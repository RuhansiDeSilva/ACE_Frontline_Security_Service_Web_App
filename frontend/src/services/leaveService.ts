// API service for leave requests
import { apiFetch } from "./apiClient";

export interface LeaveRequestDto {
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
}

export interface LeaveRequest {
  id: number;
  user: {
    id: number;
    username: string;
    fullName: string;
    role?: string;
    assignedArea?: string;
  };
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "PENDING" | "APPROVED_BY_AREA_MANAGER" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export const leaveService = {
  async applyLeave(leaveDto: LeaveRequestDto): Promise<LeaveRequest> {
    return apiFetch<LeaveRequest>("/leaves", {
      method: "POST",
      body: JSON.stringify(leaveDto),
    });
  },

  async getMyLeaves(): Promise<LeaveRequest[]> {
    return apiFetch<LeaveRequest[]>("/leaves/my");
  },

  async getAllLeaves(): Promise<LeaveRequest[]> {
    return apiFetch<LeaveRequest[]>("/leaves");
  },

  async getPendingLeaves(): Promise<LeaveRequest[]> {
    return apiFetch<LeaveRequest[]>("/leaves/pending");
  },

  async getLeavesByArea(area: string): Promise<LeaveRequest[]> {
    return apiFetch<LeaveRequest[]>(`/leaves/area/${area}`);
  },

  async areaManagerReview(leaveId: number, review: { approved: boolean; rejectionReason?: string }): Promise<LeaveRequest> {
    return apiFetch<LeaveRequest>(`/leaves/${leaveId}/area-review`, {
      method: "PATCH",
      body: JSON.stringify(review),
    });
  },

  async finalReview(leaveId: number, review: { approved: boolean; rejectionReason?: string }): Promise<LeaveRequest> {
    return apiFetch<LeaveRequest>(`/leaves/${leaveId}/final-review`, {
      method: "PATCH",
      body: JSON.stringify(review),
    });
  },
};
