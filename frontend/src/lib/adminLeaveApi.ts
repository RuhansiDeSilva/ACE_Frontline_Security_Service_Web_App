import axios from "axios";

export interface AdminLeaveRequestDTO {
    id: number;
    employeeId: number;
    employeeEmail: string;
    employeeRole: string;
    startDate: string;
    endDate: string;
    reason: string;
    rejectionReason?: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: string;
    reviewedAt?: string;
    reviewedById?: number;
    consumedLeaveDays?: number;
}

export interface CreateAdminLeaveRequestDTO {
    startDate: string;
    endDate: string;
    reason: string;
}

export interface AdminLeaveSummaryDTO {
    monthlyLimit: number;
    usedLeaves: number;
    remainingLeaves: number;
    month: number;
    year: number;
}

/** Relative URL so Vite proxies /api → backend (see vite.config.ts). */
const api = axios.create({
    baseURL: "/api/admin-leaves",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    const email = localStorage.getItem("loggedInEmail");
    if (email) {
        config.headers["X-User-Email"] = email;
    }
    return config;
});

export const adminLeaveApi = {
    // Admin endpoints
    createRequest: async (data: CreateAdminLeaveRequestDTO): Promise<AdminLeaveRequestDTO> => {
        const { data: res } = await api.post("", data);
        return res;
    },
    myRequests: async (): Promise<AdminLeaveRequestDTO[]> => {
        const { data } = await api.get("/my");
        return data;
    },
    mySummary: async (month?: number, year?: number): Promise<AdminLeaveSummaryDTO> => {
        const { data } = await api.get("/my/summary", {
            params:
                month != null && year != null
                    ? { month, year }
                    : undefined,
        });
        return data;
    },
    deleteRequest: async (id: number): Promise<void> => {
        await api.delete(`/${id}`);
    },

    // Director endpoints
    directorRequests: async (status?: string, month?: number, year?: number): Promise<AdminLeaveRequestDTO[]> => {
        const params: Record<string, string | number> = {};
        if (status && status !== "ALL") params.status = status;
        if (month !== undefined) params.month = month;
        if (year !== undefined) params.year = year;
        const { data } = await api.get("/director", { params });
        return data;
    },
    approve: async (id: number): Promise<void> => {
        await api.put(`/${id}/approve`);
    },
    reject: async (id: number, reason: string): Promise<void> => {
        await api.put(`/${id}/reject`, { reason });
    },
};
