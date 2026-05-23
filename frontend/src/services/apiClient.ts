// Shared API client utilities
// All requests go through Vite proxy: /api -> http://localhost:8090/api

const API_BASE = "/api";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function authHeaders(): HeadersInit {
  const token = getToken();

  // Try to get email/username from the nested user object first (standard for staff & clients)
  // then fall back to top-level keys for legacy compatibility
  const userStr = localStorage.getItem("user");
  let email = "";
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      email = u.email || u.username || "";
    } catch { /* ignore */ }
  }

  if (!email) {
    email = localStorage.getItem("email") || localStorage.getItem("username") || "";
  }

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    // Only send X-User-Email if it actually looks like an email.
    // This avoids confusing the backend AuthService for username-based logins.
    ...(email && email.includes("@") && { "X-User-Email": email }),
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Generic fetch wrapper that:
 *  - attaches Bearer token
 *  - unwraps the ApiResponse<T> envelope
 *  - throws on non-2xx or success === false
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `API error ${res.status}`);
  }

  // Handle empty responses (204 No Content, etc.)
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  const json: ApiResponse<T> = JSON.parse(text);
  if (!json.success) {
    throw new Error(json.message || "Request failed");
  }
  return json.data;
}

export default API_BASE;
