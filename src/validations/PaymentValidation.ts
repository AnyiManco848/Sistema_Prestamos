export class PaymentValidation {
  public static validatePaymentAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Error: Payment must be greater than 0.');
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
