import * as fs from 'fs';
import * as path from 'path';

import { Customer } from '../models/Customer';
import { Loan, LoanStatus } from '../models/Loan';
import { LoanValidation } from '../validations/LoanValidation';

const DATA_DIRECTORY = path.join(__dirname, '..', '..', 'data');
const CUSTOMERS_FILE = path.join(DATA_DIRECTORY, 'customers.json');
const LOANS_FILE = path.join(DATA_DIRECTORY, 'loans.json');

const DIGITS_ONLY_PATTERN = /^\d+$/;

export interface PendingBalanceResult {
  loanId: string;
  customerName: string;
  pendingBalance: number;
  numberOfInstallments: number;
  installmentsPaid: number;
  installmentsPending: number;
  status: LoanStatus;
}

export class LoanService {
  public registerLoan(
    customerIdentification: string,
    amount: number,
    numberOfInstallments: number,
  ): Loan {
    const customers = this.readJsonArray<Customer>(CUSTOMERS_FILE);
    const customer = customers.find(
      (item) => item.identification === customerIdentification,
    );
    if (!customer) {
      throw new Error('Error: Customer not found.');
    }

    LoanValidation.validateAmount(amount);
    LoanValidation.validateInstallments(numberOfInstallments);

    const loans = this.readJsonArray<Loan>(LOANS_FILE);

    const hasOverdueLoan = loans.some(
      (loan) =>
        loan.customerIdentification === customerIdentification &&
        loan.status === 'OVERDUE',
    );
    if (hasOverdueLoan) {
      throw new Error(
        'Error: Customer has an overdue loan. Cannot register a new loan.',
      );
    }

    const installmentValue =
      Math.round((amount / numberOfInstallments) * 100) / 100;

    const loan: Loan = {
      id: this.generateId(loans),
      customerIdentification,
      customerName: customer.name,
      amount,
      numberOfInstallments,
      installmentValue,
      pendingBalance: amount,
      status: 'ACTIVE',
    };

    loans.push(loan);
    this.writeJsonArray(LOANS_FILE, loans);

    return loan;
  }

  public getPendingBalance(
    customerIdentification: string,
  ): PendingBalanceResult {
    if (!DIGITS_ONLY_PATTERN.test(customerIdentification)) {
      throw new Error(
        'Error: Customer identification must contain only numbers.',
      );
    }

    const customers = this.readJsonArray<Customer>(CUSTOMERS_FILE);
    const customer = customers.find(
      (item) => item.identification === customerIdentification,
    );
    if (!customer) {
      throw new Error('Error: Customer not found.');
    }

    const loans = this.readJsonArray<Loan>(LOANS_FILE);
    const customerLoans = loans.filter(
      (loan) => loan.customerIdentification === customerIdentification,
    );
    if (customerLoans.length === 0) {
      throw new Error('Error: This customer has no loans.');
    }

    const activeLoan = customerLoans.find(
      (loan) => loan.status === 'ACTIVE',
    );
    const loan = activeLoan ?? customerLoans[customerLoans.length - 1];

    const installmentsPending =
      loan.pendingBalance === 0
        ? 0
        : Math.min(
            Math.ceil(loan.pendingBalance / loan.installmentValue),
            loan.numberOfInstallments,
          );
    const installmentsPaid = loan.numberOfInstallments - installmentsPending;

    return {
      loanId: loan.id,
      customerName: loan.customerName,
      pendingBalance: loan.pendingBalance,
      numberOfInstallments: loan.numberOfInstallments,
      installmentsPaid,
      installmentsPending,
      status: loan.status,
    };
  }

  private generateId(loans: Loan[]): string {
    return String(loans.length + 1);
  }

  private readJsonArray<T>(filePath: string): T[] {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const rawContent = fs.readFileSync(filePath, 'utf-8').trim();
    if (rawContent === '') {
      return [];
    }

    const parsedContent = JSON.parse(rawContent);
    if (!Array.isArray(parsedContent)) {
      return [];
    }

    return parsedContent as T[];
  }

  private writeJsonArray<T>(filePath: string, items: T[]): void {
    if (!fs.existsSync(DATA_DIRECTORY)) {
      fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
  }
}
