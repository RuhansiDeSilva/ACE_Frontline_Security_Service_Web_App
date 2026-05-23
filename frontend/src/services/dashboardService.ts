// API service for role-based dashboards
import { apiFetch } from "./apiClient";

export interface DashboardData {
  [key: string]: any;
}

export const dashboardService = {
  /** Director / Chairman dashboard */
  async getExecutiveDashboard(): Promise<DashboardData> {
    return apiFetch<DashboardData>("/dashboard/executive");
  },

  /** Account Executive dashboard */
  async getAccountExecutiveDashboard(): Promise<DashboardData> {
    return apiFetch<DashboardData>("/dashboard/account-executive");
  },

  /** Operation Manager dashboard */
  async getOperationManagerDashboard(): Promise<DashboardData> {
    return apiFetch<DashboardData>("/dashboard/operation-manager");
  },

  /** Executive Officer dashboard */
  async getExecutiveOfficerDashboard(): Promise<DashboardData> {
    return apiFetch<DashboardData>("/dashboard/executive-officer");
  },

  /** Area Manager dashboard (scoped to manager's area) */
  async getAreaManagerDashboard(): Promise<DashboardData> {
    return apiFetch<DashboardData>("/dashboard/area-manager");
  },

  /** Security Officer dashboard */
  async getSecurityOfficerDashboard(): Promise<DashboardData> {
    return apiFetch<DashboardData>("/dashboard/security-officer");
  },
};
