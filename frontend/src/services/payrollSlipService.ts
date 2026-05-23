import { apiFetch } from "./apiClient";

export interface PayrollSlipResponse {
  id: number;
  slipNumber: string;
  payMonth: string;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  isDownloaded: boolean;
  isViewed: boolean;
  generatedAt: string;
  userName: string;
  userRole: string;
  userEmail: string;
  userPhone: string;
  basicSalary: number;
  otAmount: number;
  allowances: number;
  loanDeduction: number;
  advanceDeduction: number;
  otherDeductions: number;
  approvedAt?: string;
  approvedByName?: string;
  approvalRemarks?: string;
  downloadCount: number;
  downloadedAt?: string;
}

export const payrollSlipService = {
  async getMySlips(): Promise<PayrollSlipResponse[]> {
    return apiFetch<PayrollSlipResponse[]>("/payroll-slips/my-slips");
  },

  async viewSlip(id: number): Promise<PayrollSlipResponse> {
    return apiFetch<PayrollSlipResponse>(`/payroll-slips/${id}/view`, {
      method: "POST",
    });
  },

  async downloadSlip(id: number): Promise<PayrollSlipResponse> {
    return apiFetch<PayrollSlipResponse>(`/payroll-slips/${id}/download`, {
      method: "POST",
    });
  },

  async exportSlipToExcel(id: number): Promise<Blob> {
    const response = await fetch(`/api/payroll-slips/${id}/export-excel`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!response.ok) throw new Error("Failed to export slip");
    return response.blob();
  },
};
