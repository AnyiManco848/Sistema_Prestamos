export type LoanStatus = 'ACTIVE' | 'OVERDUE' | 'PAID';

export interface Loan {
  id: string;
  customerIdentification: string;
  customerName: string;
  amount: number;
  numberOfInstallments: number;
  installmentValue: number;
  pendingBalance: number;
  status: LoanStatus;
}
