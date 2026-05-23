import axios from "axios";

export type LeaveRequestStatus = "PENDING" | "PENDING_REASSIGNMENT" | "APPROVED" | "REJECTED";

export interface LeaveRequestDTO {
    id: number;
    employeeId: number;
    employeeName: string;
    clientId: number;
    clientName: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: LeaveRequestStatus;
    rejectionReason?: string;
    createdAt: string;
    reviewedAt?: string;
    reviewedById?: number;
    reviewedByName?: string;
    replacementHandled: boolean;
}

export interface CreateLeaveRequestDTO {
    startDate: string;
    endDate: string;
    reason: string;
}

export interface LeaveSummaryDTO {
    monthlyLimit: number;
    usedLeaves: number;
    remainingLeaves: number;
    month: number;
    year: number;
}

export interface AffectedShiftDTO {
    shiftId: number;
    date: string;
    shiftType: string;
    currentOfficerId: number;
    currentOfficerName: string;
    assignmentId: number;
}

export interface EligibleReplacementDTO {
    officerId: number;
    officerName: string;
}

export interface ReassignShiftRequestDTO {
    replacementOfficerId: number;
}

/** Use relative URL so Vite dev server proxies /api → http://localhost:8090 (see vite.config.ts). */
const api = axios.create({
    baseURL: "/api/leaves",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const email = localStorage.getItem("loggedInEmail");
    if (email) {
        config.headers["X-User-Email"] = email;
    }
    
    const token = localStorage.getItem("token");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    return config;
});

export const leaveRequestApi = {
    myRequests: async (): Promise<LeaveRequestDTO[]> => {
        const { data } = await api.get("/my");
        return data;
    },

    mySummary: async (month: number, year: number): Promise<LeaveSummaryDTO> => {
        const { data } = await api.get("/my/summary", { params: { month, year } });
        return data;
    },

    createRequest: async (dto: CreateLeaveRequestDTO): Promise<LeaveRequestDTO> => {
        // Use base path exactly (/api/leaves) to match Spring @PostMapping without trailing slash.
        const { data } = await api.post("", dto);
        return data;
    },

    branchRequests: async (status?: LeaveRequestStatus): Promise<LeaveRequestDTO[]> => {
        const { data } = await api.get("/branch", status ? { params: { status } } : undefined);
        return data;
    },

    approveLeave: async (id: number): Promise<void> => {
        await api.put(`/${id}/approve`);
    },

    rejectLeave: async (id: number, reason?: string): Promise<void> => {
        await api.put(`/${id}/reject`, null, reason != null ? { params: { reason } } : undefined);
    },

    getAffectedShifts: async (id: number): Promise<AffectedShiftDTO[]> => {
        const { data } = await api.get(`/${id}/affected-shifts`);
        return data;
    },

    getEligibleReplacements: async (leaveId: number, assignmentId: number): Promise<EligibleReplacementDTO[]> => {
        const { data } = await api.get(`/${leaveId}/eligible-replacements/${assignmentId}`);
        return data;
    },

    reassignShift: async (id: number, assignmentId: number, dto: ReassignShiftRequestDTO): Promise<void> => {
        await api.put(`/${id}/assignments/${assignmentId}/reassign`, dto);
    },

    deleteRequest: async (id: number): Promise<void> => {
        await api.delete(`/${id}`);
    },
};
