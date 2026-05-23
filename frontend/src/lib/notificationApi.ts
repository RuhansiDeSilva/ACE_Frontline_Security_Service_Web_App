import axios from "axios";

export interface NotificationDTO {
    id: number;
    message: string;
    /** Backend may serialize as `isRead` or `read` depending on Jackson config */
    isRead?: boolean;
    read?: boolean;
    createdAt: string;
}

const api = axios.create({
    baseURL: "/api/notifications",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const email = localStorage.getItem("loggedInEmail");
    if (email) {
        config.headers["X-User-Email"] = email;
    }
    return config;
});

export const notificationApi = {
    myNotifications: async (): Promise<NotificationDTO[]> => {
        const { data } = await api.get("/my");
        return data;
    },
    markAsRead: async (id: number): Promise<void> => {
        await api.put(`/${id}/read`);
    },
};

export function isNotificationRead(n: NotificationDTO): boolean {
    if (typeof n.isRead === "boolean") return n.isRead;
    if (typeof n.read === "boolean") return n.read;
    return false;
}
