import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

import { CustomerService } from './services/CustomerService';

const customerService = new CustomerService();

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
  console.log('2. Exit');
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
