// API service for loan deduction tracking
import { apiFetch } from "./apiClient";

export interface LoanDeduction {
  id: number;
  loanRequest: {
    id: number;
    amount: number;
    repaymentMonths: number;
    reason: string;
    status: string;
  };
  user: {
    id: number;
    username: string;
    fullName: string;
    assignedArea?: string;
  };
  deductionMonth: string;
  amount: number;
  status: "PENDING" | "PAID";
  processedAt?: string;
  createdAt: string;
}

export const loanDeductionService = {
  /** Generate deduction schedule for an approved loan */
  async generateSchedule(loanId: number): Promise<LoanDeduction[]> {
    return apiFetch<LoanDeduction[]>(`/loan-deductions/generate/${loanId}`, {
      method: "POST",
    });
  },

  /** Get deduction schedule for a specific loan */
  async getScheduleForLoan(loanId: number): Promise<LoanDeduction[]> {
    return apiFetch<LoanDeduction[]>(`/loan-deductions/loan/${loanId}`);
  },

  /** Get all deductions for the logged-in security officer */
  async getMyDeductions(): Promise<LoanDeduction[]> {
    return apiFetch<LoanDeduction[]>("/loan-deductions/my");
  },

  /** Get all pending deductions (for accountant) */
  async getAllPendingDeductions(): Promise<LoanDeduction[]> {
    return apiFetch<LoanDeduction[]>("/loan-deductions/pending");
  },

  /** Get pending deductions for a specific month */
  async getPendingDeductionsForMonth(month: string): Promise<LoanDeduction[]> {
    return apiFetch<LoanDeduction[]>(`/loan-deductions/pending/${month}`);
  },

  /** Get all deductions (pending + paid) */
  async getAllDeductions(): Promise<LoanDeduction[]> {
    return apiFetch<LoanDeduction[]>("/loan-deductions");
  },

  /** Mark a deduction as paid */
  async markAsPaid(deductionId: number): Promise<LoanDeduction> {
    return apiFetch<LoanDeduction>(`/loan-deductions/${deductionId}/pay`, {
      method: "PATCH",
    });
  },

  /** Get remaining balance for a loan */
  async getRemainingBalance(loanId: number): Promise<number> {
    return apiFetch<number>(`/loan-deductions/balance/${loanId}`);
  },

  /** Process all deductions for a specific month and send notifications */
  async processMonthlyDeductions(month: string): Promise<string> {
    return apiFetch<string>(`/loan-deductions/process-monthly/${month}`, {
      method: "POST",
    });
  },

  /** Get loan deduction statistics */
  async getDeductionStatistics(): Promise<any> {
    return apiFetch<any>("/loan-deductions/statistics");
  },

  /** Get all deductions for a specific month */
  async getDeductionsForMonth(month: string): Promise<LoanDeduction[]> {
    return apiFetch<LoanDeduction[]>(`/loan-deductions/month/${month}`);
  },
};
