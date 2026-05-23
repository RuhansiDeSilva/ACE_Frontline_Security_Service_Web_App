// API service for paysheets
import { apiFetch } from "./apiClient";

export interface PaysheetRequest {
  userId: number;
  month: string; // e.g. "2025-01"
}

export interface Paysheet {
  id: number;
  user: {
    id: number;
    username: string;
    fullName: string;
    role?: string;
  };
  month: string;
  basicSalary: number;
  allowances: number;
  otherDeductions: number;
  netSalary: number;
  createdAt: string;
}

export const paysheetService = {
  async generatePaysheet(request: PaysheetRequest): Promise<Paysheet> {
    return apiFetch<Paysheet>("/paysheets", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  async getMyPaysheets(): Promise<Paysheet[]> {
    return apiFetch<Paysheet[]>("/paysheets/my");
  },

  async getPaysheetsByUser(userId: number): Promise<Paysheet[]> {
    return apiFetch<Paysheet[]>(`/paysheets/user/${userId}`);
  },

  async getAllPaysheets(): Promise<Paysheet[]> {
    return apiFetch<Paysheet[]>("/paysheets");
  },
};
