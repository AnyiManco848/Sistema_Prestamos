import * as fs from 'fs';
import * as path from 'path';

import { Customer } from '../models/Customer';
import { Loan } from '../models/Loan';
import { Payment } from '../models/Payment';
import { PaymentValidation } from '../validations/PaymentValidation';

const DATA_DIRECTORY = path.join(__dirname, '..', '..', 'data');
const CUSTOMERS_FILE = path.join(DATA_DIRECTORY, 'customers.json');
const LOANS_FILE = path.join(DATA_DIRECTORY, 'loans.json');
const PAYMENTS_FILE = path.join(DATA_DIRECTORY, 'payments.json');

export interface RegisterPaymentResult {
  payment: Payment;
  previousBalance: number;
  newBalance: number;
  remainingInstallments: number;
}

export class PaymentService {
  public registerPayment(
    customerIdentification: string,
    amount: number,
  ): RegisterPaymentResult {
    const customers = this.readJsonArray<Customer>(CUSTOMERS_FILE);
    const customer = customers.find(
      (item) => item.identification === customerIdentification,
    );
    if (!customer) {
      throw new Error('Error: Customer not found.');
    }

    const loans = this.readJsonArray<Loan>(LOANS_FILE);
    // If a customer ever has more than one ACTIVE loan (should not happen with
    // the current rules), we take the first one found. Revisit this later.
    const loan = loans.find(
      (item) =>
        item.customerIdentification === customerIdentification &&
        item.status === 'ACTIVE',
    );
    if (!loan) {
      throw new Error('Error: No active loan found for this customer.');
    }

    PaymentValidation.validatePaymentAmount(amount);
    PaymentValidation.validatePaymentAgainstBalance(
      amount,
      loan.pendingBalance,
    );

    const payments = this.readJsonArray<Payment>(PAYMENTS_FILE);

    const payment: Payment = {
      id: this.generateId(payments),
      loanId: loan.id,
      amount,
      date: new Date().toISOString(),
    };

    payments.push(payment);
    this.writeJsonArray(PAYMENTS_FILE, payments);

    const previousBalance = loan.pendingBalance;
    const newBalance = previousBalance - amount;

    loan.pendingBalance = newBalance;
    loan.status = newBalance === 0 ? 'PAID' : 'ACTIVE';
    this.writeJsonArray(LOANS_FILE, loans);

    const remainingInstallments =
      newBalance === 0
        ? 0
        : Number((newBalance / loan.installmentValue).toFixed(1));

    return { payment, previousBalance, newBalance, remainingInstallments };
  }

  private generateId(payments: Payment[]): string {
    return String(payments.length + 1);
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
