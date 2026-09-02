const THOUSANDS_SEPARATOR_PATTERN = /[.,]/g;
const NUMERIC_PATTERN = /^-?\d+$/;

export class PaymentValidation {
  public static validatePaymentIsNumeric(input: string): void {
    const normalizedInput = input.replace(THOUSANDS_SEPARATOR_PATTERN, '').trim();

    if (normalizedInput === '' || !NUMERIC_PATTERN.test(normalizedInput)) {
      throw new Error('Error: Payment amount must contain only numbers.');
    }
  }

  public static validatePaymentIsNotNegative(amount: number): void {
    if (amount < 0) {
      throw new Error('Error: Payment amount cannot be negative.');
    }
  }

  public static validatePaymentIsGreaterThanZero(amount: number): void {
    if (amount === 0) {
      throw new Error('Error: Payment amount must be greater than 0.');
    }
  }

  public static validatePaymentAgainstBalance(
    amount: number,
    pendingBalance: number,
  ): void {
    if (amount > pendingBalance) {
      throw new Error(
        'Error: Payment cannot be greater than pending balance.',
      );
    }
  }
}
