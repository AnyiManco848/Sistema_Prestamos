import * as fs from 'fs';
import * as path from 'path';

import { Customer } from '../models/Customer';

const DATA_DIRECTORY = path.join(__dirname, '..', '..', 'data');
const CUSTOMERS_FILE = path.join(DATA_DIRECTORY, 'customers.json');

const NAME_HAS_NUMBER_PATTERN = /[0-9]/;
const NAME_ONLY_LETTERS_PATTERN = /^[A-Za-zÁÉÍÓÚÑáéíóúñ ]+$/;
const IDENTIFICATION_NUMERIC_PATTERN = /^[0-9]+$/;

export class CustomerService {
  public registerCustomer(name: string, identification: string): Customer {
    if (name === null || name === undefined || name.trim() === '') {
      throw new Error('Error: Name is required.');
    }

    if (
      identification === null ||
      identification === undefined ||
      identification.trim() === ''
    ) {
      throw new Error('Error: Identification is required.');
    }

    const trimmedName = name.trim();
    const trimmedIdentification = identification.trim();

    this.validateNameHasNoNumbers(trimmedName);
    this.validateNameHasOnlyLetters(trimmedName);
    this.validateIdentificationIsNumeric(trimmedIdentification);

    const customers = this.readCustomers();

    this.validateIdentificationNotDuplicate(trimmedIdentification, customers);

    const customer: Customer = {
      id: this.generateId(customers),
      name: trimmedName,
      identification: trimmedIdentification,
    };

    customers.push(customer);
    this.writeCustomers(customers);

    return customer;
  }

  private validateNameHasNoNumbers(name: string): void {
    if (NAME_HAS_NUMBER_PATTERN.test(name)) {
      throw new Error('Error: Name must not contain numbers.');
    }
  }

  private validateNameHasOnlyLetters(name: string): void {
    if (!NAME_ONLY_LETTERS_PATTERN.test(name)) {
      throw new Error('Error: Name must contain only letters.');
    }
  }

  private validateIdentificationIsNumeric(identification: string): void {
    if (!IDENTIFICATION_NUMERIC_PATTERN.test(identification)) {
      throw new Error('Error: Identification must contain only numbers.');
    }
  }

  private validateIdentificationNotDuplicate(
    identification: string,
    customers: Customer[],
  ): void {
    const alreadyRegistered = customers.some(
      (customer) => customer.identification === identification,
    );

    if (alreadyRegistered) {
      throw new Error(
        'Error: This identification number is already registered.',
      );
    }
  }

  private generateId(customers: Customer[]): string {
    return String(customers.length + 1);
  }

  private readCustomers(): Customer[] {
    if (!fs.existsSync(CUSTOMERS_FILE)) {
      return [];
    }

    const rawContent = fs.readFileSync(CUSTOMERS_FILE, 'utf-8').trim();

    if (rawContent === '') {
      return [];
    }

    const parsedContent = JSON.parse(rawContent);

    if (!Array.isArray(parsedContent)) {
      return [];
    }

    return parsedContent as Customer[];
  }

  private writeCustomers(customers: Customer[]): void {
    if (!fs.existsSync(DATA_DIRECTORY)) {
      fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
    }

    fs.writeFileSync(
      CUSTOMERS_FILE,
      JSON.stringify(customers, null, 2),
      'utf-8',
    );
  }
}
