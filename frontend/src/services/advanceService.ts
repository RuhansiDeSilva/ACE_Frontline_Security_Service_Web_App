// API service for salary advance requests
import { apiFetch } from "./apiClient";

export interface AdvanceRequestDto {
  amount: number;
  reason: string;
}

export interface AdvanceRequest {
  id: number;
  user: {
    id: number;
    username: string;
    fullName: string;
    role?: string;
    assignedArea?: string;
  };
  amount: number;
  forMonth: string;
  reason: string;
  status: "PENDING" | "APPROVED_BY_AREA_MANAGER" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export const advanceService = {
  async requestAdvance(advanceDto: AdvanceRequestDto): Promise<AdvanceRequest> {
    return apiFetch<AdvanceRequest>("/advances", {
      method: "POST",
      body: JSON.stringify(advanceDto),
    });
  },

  async getMyAdvances(): Promise<AdvanceRequest[]> {
    return apiFetch<AdvanceRequest[]>("/advances/my");
  },

  async getAllAdvances(): Promise<AdvanceRequest[]> {
    return apiFetch<AdvanceRequest[]>("/advances");
  },

  async getPendingAdvances(): Promise<AdvanceRequest[]> {
    return apiFetch<AdvanceRequest[]>("/advances/pending");
  },

  async getAwaitingFinalReview(): Promise<AdvanceRequest[]> {
    return apiFetch<AdvanceRequest[]>("/advances/awaiting-final-review");
  },

  async getApprovedAdvances(): Promise<AdvanceRequest[]> {
    return apiFetch<AdvanceRequest[]>("/advances/approved");
  },

  async getAdvancesByArea(area: string): Promise<AdvanceRequest[]> {
    return apiFetch<AdvanceRequest[]>(`/advances/area/${area}`);
  },

  async areaManagerReview(advanceId: number, review: { approved: boolean; rejectionReason?: string }): Promise<AdvanceRequest> {
    return apiFetch<AdvanceRequest>(`/advances/${advanceId}/area-review`, {
      method: "PATCH",
      body: JSON.stringify(review),
    });
  },

  async finalReview(advanceId: number, review: { approved: boolean; rejectionReason?: string }): Promise<AdvanceRequest> {
    return apiFetch<AdvanceRequest>(`/advances/${advanceId}/final-review`, {
      method: "PATCH",
      body: JSON.stringify(review),
    });
  },

  async submitAdvance(amount: number, reason: string): Promise<AdvanceRequest> {
    return this.requestAdvance({ amount, reason });
  },

  getMaxAdvanceAmount(user: any): number {
    if (user?.role === "AREA_MANAGER") return 15000.0;
    switch (user?.designation) {
      case "JSO":
      case "LSO":
        return 4000.0;
      case "ISO":
        return 5000.0;
      case "CSO":
        return 6000.0;
      case "SSO":
        return 10000.0;
      default:
        // Fallback: 10% of basic salary if available, otherwise default cap
        if (user?.basicSalary) return user.basicSalary * 0.10;
        return 10000.0;
    }
  },
};
