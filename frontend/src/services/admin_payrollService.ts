// Admin Payroll API Service
import { apiFetch } from "./apiClient";

export interface AdminPayrollRequest {
  employeeId: string | number;
  payMonth: string; // format: YYYY-MM
  basicSalary: number;
  allowances: number;
  allowancesDetail?: Record<string, number>;
  loanDeduction?: number;
  advanceDeduction?: number;
  otherDeductions?: number;
  remarks?: string;
}

export interface PayrollResponse {
  id: number;
  employeeId: string | number;
  employeeName: string;
  employeeRole: string;
  payMonth: string;
  payYear?: number;
  basicSalary: number;
  allowances: number;
  allowancesDetail?: Record<string, number>;
  loanDeduction: number;
  advanceDeduction: number;
  otherDeductions: number;
  netSalary: number;
  status: "DRAFT" | "SUBMITTED_TO_DIRECTOR" | "APPROVED_BY_DIRECTOR" | "REJECTED_BY_DIRECTOR" | "SENT_TO_BANK" | "COMPLETED";
  submittedByName?: string;
  submittedAt?: string;
  approvedByName?: string;
  approvedAt?: string;
  sentToBankAt?: string;
  approvalRemarks?: string;
  rejectionReason?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollStatistics {
  id: number;
  payMonth: string;
  role: string;
  totalProcessed: number;
  totalAmount: number;
  averageSalary: number;
  maxSalary: number;
  minSalary: number;
  totalApproved: number;
  totalRejected: number;
  totalSentToBank: number;
}

export const admin_payrollService = {
  // Create admin payroll
  async createPayroll(request: AdminPayrollRequest): Promise<PayrollResponse> {
    return apiFetch<PayrollResponse>("/paysheets/admin-payroll/create", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // Submit payroll for director approval
  async submitForApproval(payrollId: number): Promise<PayrollResponse> {
    return apiFetch<PayrollResponse>(`/paysheets/admin-payroll/${payrollId}/submit-for-approval`, {
      method: "POST",
    });
  },

  // Get pending approvals (director only)
  async getPendingApprovals(): Promise<PayrollResponse[]> {
    return apiFetch<PayrollResponse[]>("/paysheets/admin-payroll/pending-approvals");
  },

  // Approve payroll (director) - allows editing allowances
  async approvePayroll(payrollId: number, body: { approvalRemarks?: string, allowances?: number }): Promise<PayrollResponse> {
    return apiFetch<PayrollResponse>(`/paysheets/admin-payroll/${payrollId}/approve`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  // Reject payroll (director)
  async rejectPayroll(payrollId: number, reason: string): Promise<PayrollResponse> {
    return apiFetch<PayrollResponse>(`/paysheets/admin-payroll/${payrollId}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejectionReason: reason }),
    });
  },

  // Get approved payrolls ready for bank submission
  async getApprovedPayrolls(): Promise<PayrollResponse[]> {
    return apiFetch<PayrollResponse[]>("/paysheets/admin-payroll/approved-list");
  },

  // Send payroll to bank and notify employee
  async sendToBank(payrollId: number): Promise<PayrollResponse> {
    return apiFetch<PayrollResponse>(`/paysheets/admin-payroll/${payrollId}/send-to-bank`, {
      method: "POST",
    });
  },

  // Proceed all approved to bank and download Excel
  async proceedAllToBank(): Promise<void> {
    const response = await fetch("/api/paysheets/admin-payroll/proceed-bank", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download payroll excel");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_bank_submission_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Get statistics for a month
  async getMonthlyStatistics(month: string): Promise<PayrollStatistics[]> {
    return apiFetch<PayrollStatistics[]>(`/paysheets/statistics/monthly/${month}`);
  },

  // Get statistics for a role
  async getStatisticsForRole(role: string): Promise<PayrollStatistics[]> {
    return apiFetch<PayrollStatistics[]>(`/paysheets/statistics/role/${role}`);
  },

  // Get last 12 months statistics
  async getLast12MonthsStatistics(): Promise<PayrollStatistics[]> {
    return apiFetch<PayrollStatistics[]>("/paysheets/statistics/last-12-months");
  },
};
