// API service for loan requests
import { apiFetch } from "./apiClient";

export interface LoanRequestDto {
  amount: number;
  repaymentMonths: number;
  reason: string;
}

export interface LoanRequest {
  id: number;
  user: {
    id: number;
    username: string;
    fullName: string;
    role?: string;
    assignedArea?: string;
  };
  amount: number;
  repaymentMonths: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ReviewRequest {
  approved: boolean;
  status?: string;
  rejectionReason?: string;
}

export const loanService = {
  async requestLoan(loanDto: LoanRequestDto): Promise<LoanRequest> {
    return apiFetch<LoanRequest>("/loans", {
      method: "POST",
      body: JSON.stringify(loanDto),
    });
  },

  async getMyLoans(): Promise<LoanRequest[]> {
    return apiFetch<LoanRequest[]>("/loans/my");
  },

  async getAllLoans(): Promise<LoanRequest[]> {
    return apiFetch<LoanRequest[]>("/loans");
  },

  async getPendingLoans(): Promise<LoanRequest[]> {
    return apiFetch<LoanRequest[]>("/loans/pending");
  },

  async getApprovedLoans(): Promise<LoanRequest[]> {
    return apiFetch<LoanRequest[]>("/loans/approved");
  },

  async reviewLoan(loanId: number, review: ReviewRequest): Promise<LoanRequest> {
    return apiFetch<LoanRequest>(`/loans/${loanId}/review`, {
      method: "PATCH",
      body: JSON.stringify(review),
    });
  },
};
