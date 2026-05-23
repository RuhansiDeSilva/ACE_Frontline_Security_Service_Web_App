// API service for authentication & user management
import { apiFetch } from "./apiClient";

/* ---------- types ---------- */

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: number;
  username: string;
  fullName: string;
  role: string;
  firstLogin: boolean;
  message: string;
}

export interface UserProfile {
  id: number;
  username: string;
  role: string;
  fullName: string;
  nicNumber: string;
  sex: string;
  email: string;
  residentialAddress: string;
  mobileNumber: string;
  dateOfBirth: string;
  emergencyContact: string;
  photoUrl?: string;
  professionalCertificate: string;
  assignedArea: string;
  assignedCompany: string;
  joinDate: string;
  designation?: string;
  basicSalary?: number;
  adminPosition?: string;
  specialSkills: string;
  handoverEquipment: string[];
  bankName: string;
  bankAccountNumber: string;
  bankBranch: string;
  active?: boolean;
  qrActivated?: boolean;
  bloodGroup?: string;
  createdAt: string;
}

export interface UpdatePersonalInfoRequest {
  email?: string;
  mobileNumber?: string;
  residentialAddress?: string;
  emergencyContact?: string;
}

export interface ChangePasswordRequest {
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RegisterUserRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  nicNumber: string;
  role: string;
  designation?: string;
  assignedArea?: string;
  assignedCompany?: string;
  sex?: string;
  residentialAddress?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  basicSalary?: number;
}

/* ---------- service ---------- */

export const authService = {
  /** Login (public) */
  async login(request: LoginRequest): Promise<LoginResponse> {
    return apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /** Get current user's profile */
  async getMyProfile(): Promise<UserProfile> {
    return apiFetch<UserProfile>("/auth/me");
  },

  /** Update personal information */
  async updatePersonalInfo(data: UpdatePersonalInfoRequest): Promise<UserProfile> {
    return apiFetch<UserProfile>("/auth/me/personal-info", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /** Upload profile photo (multipart) */
  async updatePhoto(photo: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append("photo", photo);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/auth/me/photo", {
      method: "PATCH",
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(body.message || `API error ${res.status}`);
    }
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Upload failed");
    return json.data as UserProfile;
  },

  /** Send OTP for password change */
  async sendOtp(): Promise<void> {
    await apiFetch<void>("/auth/otp/send", { method: "POST" });
  },

  /** Change password with OTP */
  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await apiFetch<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /** Register a new user (Operation Manager only, multipart) */
  async registerUser(data: RegisterUserRequest, photo?: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
    if (photo) formData.append("photo", photo);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      const error: any = new Error(body.message || `API error ${res.status}`);
      if (body.data && typeof body.data === "object") {
        error.fieldErrors = body.data;
      }
      throw error;
    }
    const json = await res.json();
    if (!json.success) {
      const error: any = new Error(json.message || "Registration failed");
      if (json.data && typeof json.data === "object") {
        error.fieldErrors = json.data;
      }
      throw error;
    }
    return json.data as UserProfile;
  },

  /** Get all users */
  async getAllUsers(): Promise<UserProfile[]> {
    return apiFetch<UserProfile[]>("/auth/users");
  },

  /** Get user by ID (numeric or alphanumeric) */
  async getUserById(id: string | number): Promise<UserProfile> {
    return apiFetch<UserProfile>(`/auth/users/${id}`);
  },

  /** Get users by role */
  async getUsersByRole(role: string): Promise<UserProfile[]> {
    return apiFetch<UserProfile[]>(`/auth/users/role/${role}`);
  },

  /** Get users by area */
  async getUsersByArea(area: string): Promise<UserProfile[]> {
    return apiFetch<UserProfile[]>(`/auth/users/area/${area}`);
  },

  /** Deactivate user (Operation Manager only) */
  async deactivateUser(id: number): Promise<void> {
    await apiFetch<void>(`/auth/users/${id}/deactivate`, { method: "DELETE" });
  },

  /** 
   * Global Logout: Clears all authentication and session-related tokens and user data.
   * This prevents stale identity issues when switching users.
   */
  logout(): void {
    const keysToRemove = [
      "token", 
      "refreshToken", 
      "role", 
      "userId", 
      "user", 
      "loggedInEmail",
      "interviewApplicantsCount" // Clear any role-specific cached data
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
};
