import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8090/api/shift-schedules",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    login: (data: { email: string; password: string }) =>
        axios.post("http://localhost:8090/api/auth/login", data).then((res) => res.data),

    me: () =>
        axios
            .get("http://localhost:8090/api/auth/me", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })
            .then((res) => res.data),
};

export const shiftScheduleApi = {
    // Create a schedule from a clientId (active model)
    createSchedule: (data: {
        clientId: number;
        month: number;
        year: number;
    }) => api.post("", data).then((res) => res.data),

    // JSO-specific: load current schedule by login context (uses assigned_company internally)
    getOfficerCurrentSchedule: (month: number, year: number) =>
        api.get("/officer/current-schedule", { params: { month, year } }).then((res) => res.data),

    // JSO-specific: create a new draft (uses assigned_company internally)
    createOfficerSchedule: (month: number, year: number) =>
        api.post("/officer/create-schedule", null, { params: { month, year } }).then((res) => res.data),

    getScheduleById: (id: number) =>
        api.get(`/${id}`).then((res) => res.data),

    getSubmitted: () => api.get("/submitted").then((res) => res.data),

    autoGenerate: (id: number) =>
        api.post(`/${id}/auto-generate`).then((res) => res.data),

    submitSchedule: (id: number) =>
        api.put(`/${id}/submit`).then((res) => res.data),

    approveSchedule: (id: number) =>
        api.put(`/${id}/approve`).then((res) => res.data),

    assignOfficers: (
        scheduleId: number,
        data: {
            date: string;
            shiftType: "DAY" | "NIGHT";
            securityOfficerIds: number[];
        }
    ) => api.post(`/${scheduleId}/assignments`, data).then((res) => res.data),

    removeAssignment: (assignmentId: number) =>
        api.delete(`/assignments/${assignmentId}`).then((res) => res.data),

    // Lookup a schedule by clientId + month + year (active model)
    getScheduleByCompanyAndMonthYear: (
        clientId: number,
        month: number,
        year: number
    ) =>
        api
            .get("/by-company", {
                params: { clientId, month, year },
            })
            .then((res) => res.data),

    // Area Manager: schedules for a month (filtered by assignedArea server-side)
    getAreaManagerSchedulesForMonth: (month: number, year: number) =>
        api.get("/area-manager/month", { params: { month, year } }).then((res) => res.data),

    // Area Manager: approved history (filtered by assignedArea server-side)
    getAreaManagerApprovedHistory: (month: number, year: number) =>
        api.get("/area-manager/history", { params: { month, year } }).then((res) => res.data),

    assignOfficersAsAreaManager: (
        scheduleId: number,
        data: {
            date: string;
            shiftType: "DAY" | "NIGHT";
            securityOfficerIds: number[];
        }
    ) => api.post(`/area-manager/${scheduleId}/assignments`, data).then((res) => res.data),

    removeAssignmentAsAreaManager: (assignmentId: number) =>
        api.delete(`/area-manager/assignments/${assignmentId}`).then((res) => res.data),

    getMyApproved: () => api.get("/my-approved").then((res) => res.data),

    getClientCurrentSchedules: (clientId: number) =>
        api.get(`/client/${clientId}/current`).then((res) => res.data),

    getFilter: (params: {
        company?: string;
        month?: string;
    }) => api.get("/filter", { params }).then((res) => res.data),
};