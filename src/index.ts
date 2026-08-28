import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

import { CustomerService } from './services/CustomerService';
import { LoanService } from './services/LoanService';
import { PaymentService } from './services/PaymentService';
import { parseAmount } from './utils/ParseAmount';

const customerService = new CustomerService();
const loanService = new LoanService();
const paymentService = new PaymentService();

/**
 * Small wrapper around readline/promises that buffers incoming lines so that
 * sequential prompts also work when the input is piped (non-TTY) and not only
 * in an interactive terminal.
 */
class ConsoleReader {
  private readonly rl: readline.Interface;
  private readonly pendingLines: string[] = [];
  private readonly waitingResolvers: Array<(line: string) => void> = [];
  private closed = false;

  constructor() {
    this.rl = readline.createInterface({ input, output });

    this.rl.on('line', (line: string) => {
      const resolve = this.waitingResolvers.shift();
      if (resolve) {
        resolve(line);
      } else {
        this.pendingLines.push(line);
      }
    });

    this.rl.on('close', () => {
      this.closed = true;
      while (this.waitingResolvers.length > 0) {
        const resolve = this.waitingResolvers.shift();
        if (resolve) {
          resolve('');
        }
      }
    });
  }

  public async question(prompt: string): Promise<string> {
    output.write(prompt);

    const bufferedLine = this.pendingLines.shift();
    if (bufferedLine !== undefined) {
      return bufferedLine;
    }

    if (this.closed) {
      return '';
    }

    return new Promise<string>((resolve) => {
      this.waitingResolvers.push(resolve);
    });
  }

  public close(): void {
    this.rl.close();
  }
}

function printMenu(): void {
  console.log('');
  console.log('================================');
  console.log('          LOAN SYSTEM');
  console.log('================================');
  console.log('');
  console.log('1. Register customer');
  console.log('2. Register loan');
  console.log('3. Register payment');
  console.log('4. Exit');
  console.log('');
}

async function registerCustomerFlow(reader: ConsoleReader): Promise<void> {
  const name = await reader.question('Name: ');
  const identification = await reader.question('Identification: ');

  try {
    const customer = customerService.registerCustomer(name, identification);
    console.log('Customer registered successfully.');
    console.log(`Customer ID: ${customer.id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(message);
  }
}

async function registerLoanFlow(reader: ConsoleReader): Promise<void> {
  const customerIdentification = await reader.question(
    'Customer identification: ',
  );
  const amountInput = await reader.question('Loan amount: ');
  const numberOfInstallments = Number(
    await reader.question('Number of installments: '),
  );

  try {
    const amount = parseAmount(amountInput);
    const loan = loanService.registerLoan(
      customerIdentification,
      amount,
      numberOfInstallments,
    );
    console.log('Loan registered successfully.');
    console.log(`Loan ID: ${loan.id}`);
    console.log(`Customer: ${loan.customerName}`);
    console.log(`Amount: $${loan.amount}`);
    console.log(`Installment: $${loan.installmentValue}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(message);
  }
}

async function registerPaymentFlow(reader: ConsoleReader): Promise<void> {
  const customerIdentification = await reader.question(
    'Customer identification: ',
  );
  const amountInput = await reader.question('Payment amount: ');

  try {
    const amount = parseAmount(amountInput);
    const result = paymentService.registerPayment(
      customerIdentification,
      amount,
    );
    console.log('Payment registered successfully.');
    console.log('');
    console.log(`Payment: $${result.payment.amount}`);
    console.log(`Previous balance: $${result.previousBalance}`);
    console.log(`New balance: $${result.newBalance}`);
    console.log(`Remaining installments: ${result.remainingInstallments}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(message);
  }
}

async function main(): Promise<void> {
  const reader = new ConsoleReader();

  let running = true;

  while (running) {
    printMenu();
    const option = await reader.question('Select an option: ');

    switch (option.trim()) {
      case '1':
        await registerCustomerFlow(reader);
        break;
      case '2':
        await registerLoanFlow(reader);
        break;
      case '3':
        await registerPaymentFlow(reader);
        break;
      case '4':
        console.log('Goodbye.');
        running = false;
        break;
      default:
        console.log('Error: Invalid option.');
        break;
    }
  }

  reader.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
