export interface Notification {
  id: number;
  userId: number; // 0 means broadcast to all users
  message: string;
  time: string;
  read: boolean;
}

const STORAGE_KEY = "notifications";

function readAll(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || "[]";
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(all: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getNotificationsForUser(userId: number, role?: string): Notification[] {
  const all = readAll();
  return all
    .filter(n =>
      n.userId === userId ||
      n.userId === 0 ||
      (role === "ACCOUNT_EXECUTIVE" && n.userId === -1)
    )
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export function addNotification(userId: number, message: string) {
  // Also persist to backend (fire-and-forget)
  const token = localStorage.getItem("token");
  if (token) {
    const payload: Record<string, unknown> = { message };
    if (userId === -1) {
      // role-broadcast to ACCOUNT_EXECUTIVE
      payload.targetRole = "ACCOUNT_EXECUTIVE";
    } else if (userId === 0) {
      // global broadcast — no userId, no targetRole
    } else {
      payload.userId = userId;
    }
    fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }).catch(() => {}); // silently fail
  }

  // Keep localStorage as fallback
  const all = readAll();
  const nextId = all.length ? Math.max(...all.map(n => n.id)) + 1 : 1;
  const n: Notification = {
    id: nextId,
    userId,
    message,
    time: new Date().toISOString(),
    read: false,
  };
  all.push(n);
  writeAll(all);
}

export function markNotificationRead(id: number) {
  const all = readAll();
  const idx = all.findIndex(n => n.id === id);
  if (idx !== -1) {
    all[idx].read = true;
    writeAll(all);
  }
}

export function markAllNotificationsRead(userId: number) {
  const all = readAll();
  all.forEach(n => {
    if (n.userId === userId || n.userId === 0 || n.userId === -1) {
      n.read = true;
    }
  });
  writeAll(all);
}

export function clearNotificationsForUser(userId: number) {
  const all = readAll().filter(n => !(n.userId === userId || n.userId === 0));
  writeAll(all);
}