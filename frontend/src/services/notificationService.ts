// API service for backend-persisted notifications
import { apiFetch } from "./apiClient";

/* ---------- types ---------- */

export interface NotificationItem {
  id: number;
  userId: number | null;
  targetRole: string | null;
  message: string;
  read: boolean;
  createdAt: string; // ISO datetime
}

export interface SendNotificationPayload {
  userId?: number;
  targetRole?: string;
  message: string;
}

/* ---------- service ---------- */

export const notificationService = {
  /** Get all notifications for the current user */
  async getMyNotifications(): Promise<NotificationItem[]> {
    return apiFetch<NotificationItem[]>("/notifications/my");
  },

  /** Get unread notification count */
  async getUnreadCount(): Promise<number> {
    return apiFetch<number>("/notifications/unread-count");
  },

  /** Mark a single notification as read */
  async markAsRead(id: number): Promise<void> {
    await apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH" });
  },

  /** Mark all notifications as read */
  async markAllAsRead(): Promise<void> {
    await apiFetch<void>("/notifications/read-all", { method: "PATCH" });
  },

  /** Send a notification to a specific user */
  async notifyUser(userId: number, message: string): Promise<NotificationItem> {
    return apiFetch<NotificationItem>("/notifications/send", {
      method: "POST",
      body: JSON.stringify({ userId, message }),
    });
  },

  /** Send a notification to all users with a specific role */
  async notifyRole(targetRole: string, message: string): Promise<NotificationItem> {
    return apiFetch<NotificationItem>("/notifications/send", {
      method: "POST",
      body: JSON.stringify({ targetRole, message }),
    });
  },

  /** Send a broadcast notification to all users */
  async notifyAll(message: string): Promise<NotificationItem> {
    return apiFetch<NotificationItem>("/notifications/send", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },
};
