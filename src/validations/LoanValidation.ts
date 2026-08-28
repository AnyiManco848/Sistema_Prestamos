export class LoanValidation {
  public static validateAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Error: Amount must be greater than 0.');
    }
  }

  public static validateInstallments(installments: number): void {
    if (
      !Number.isInteger(installments) ||
      installments < 1 ||
      installments > 60
    ) {
      throw new Error(
        'Error: Number of installments must be between 1 and 60.',
      );
    }
  }
}
