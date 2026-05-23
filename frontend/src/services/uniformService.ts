// API service for uniform requests
import { apiFetch } from "./apiClient";

export interface UniformRequestDto {
  uniformType: string;
  size: string;
  quantity: number;
  reason?: string;
}

export interface UniformRequest {
  id: number;
  user: {
    id: number;
    username: string;
    fullName: string;
    role?: string;
    assignedArea?: string;
  };
  uniformType: string;
  size: string;
  quantity: number;
  reason?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ReviewRequest {
  approved: boolean;
  rejectionReason?: string;
}

export const uniformService = {
  async requestUniform(dto: UniformRequestDto): Promise<UniformRequest> {
    return apiFetch<UniformRequest>("/uniforms", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  async getMyRequests(): Promise<UniformRequest[]> {
    return apiFetch<UniformRequest[]>("/uniforms/my");
  },

  async getAllRequests(): Promise<UniformRequest[]> {
    return apiFetch<UniformRequest[]>("/uniforms");
  },

  async getPendingRequests(): Promise<UniformRequest[]> {
    return apiFetch<UniformRequest[]>("/uniforms/pending");
  },

  async reviewRequest(requestId: number, review: ReviewRequest): Promise<UniformRequest> {
    return apiFetch<UniformRequest>(`/uniforms/${requestId}/review`, {
      method: "PATCH",
      body: JSON.stringify(review),
    });
  },
};
