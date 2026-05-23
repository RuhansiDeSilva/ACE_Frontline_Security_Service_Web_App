import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "@/services/authService";
import { extractUserRole } from "@/lib/roleUtils";
import "./Dashboard.css";

interface AttendanceSummary {
  id: number;
  securityOfficerId: number;
  securityOfficerName: string;
  securityId: string;
  attendanceDate: string;
  overtimeHours: number | null;
  isShiftCounted: boolean | null;
}

interface WeeklyReportSummary {
  id: number;
  weekNumber: number;
  month: number | null;
  year: number;
}

interface DashboardStats {
  areaOfficers: number;
  monthShifts: number;
  overtimeHours: number;
  weeklyReportsThisWeek: number;
  loading: boolean;
  error: string | null;
}

interface StoredUser {
  userId?: number;
  id?: number;
  assignedArea?: string;
}

interface AreaUser {
  role?: unknown;
  assignedArea?: string;
  active?: boolean;
}

interface MonthlyStatRow {
  monthlyShifts?: number;
  monthlyOvertimeHours?: number;
}

function getTodayIso(): string {
  return new Date().toISOString().split("T")[0]!;
}

function getMonthRangeIso(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const toIso = (d: Date) => d.toISOString().split("T")[0]!;
  return { start: toIso(start), end: toIso(end) };
}

function getCurrentWeekKey() {
  const today = getTodayIso();
  const d = new Date(today + "T12:00:00");
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-based
  const dayOfMonth = d.getDate();
  const weekNumber = Math.min(4, Math.floor((dayOfMonth - 1) / 7) + 1);
  return { weekNumber, month: month + 1, year };
}

export default function AreaManagerDashboard() {
  const [managerId, setManagerId] = useState<number | null>(null);
  const [assignedArea, setAssignedArea] = useState<string>("");
  const [stats, setStats] = useState<DashboardStats>({
    areaOfficers: 0,
    monthShifts: 0,
    overtimeHours: 0,
    weeklyReportsThisWeek: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const fallbackUserId = localStorage.getItem("userId");

    if (!storedUser) {
      const parsedFallbackId = fallbackUserId ? Number(fallbackUserId) : NaN;
      setManagerId(Number.isFinite(parsedFallbackId) ? parsedFallbackId : null);
      return;
    }

    try {
      const parsed: StoredUser = JSON.parse(storedUser);
      setAssignedArea(typeof parsed?.assignedArea === "string" ? parsed.assignedArea : "");

      const storedManagerId =
        typeof parsed?.userId === "number"
          ? parsed.userId
          : typeof parsed?.id === "number"
            ? parsed.id
            : fallbackUserId
              ? Number(fallbackUserId)
              : NaN;

      setManagerId(Number.isFinite(storedManagerId) ? storedManagerId : null);
    } catch {
      setAssignedArea("");
      const parsedFallbackId = fallbackUserId ? Number(fallbackUserId) : NaN;
      setManagerId(Number.isFinite(parsedFallbackId) ? parsedFallbackId : null);
    }
  }, []);

  useEffect(() => {
    async function loadMyProfile() {
      try {
        const me = await authService.getMyProfile();
        if (typeof me?.assignedArea === "string" && me.assignedArea.trim()) {
          setAssignedArea(me.assignedArea.trim());
        }
        if (typeof me?.id === "number") {
          setManagerId(me.id);
        }
      } catch (error) {
        console.warn("Failed to load current user profile for area mapping:", error);
      }
    }
    loadMyProfile();
  }, []);

  useEffect(() => {
    async function loadStats() {
      setStats((s) => ({ ...s, loading: true, error: null }));
      try {
        const { start, end } = getMonthRangeIso();
        const statsPromises: [
          Promise<Response> | Promise<null>,
          Promise<Response> | Promise<null>,
          Promise<AreaUser[]>,
          Promise<Response>
        ] = [
          managerId != null
            ? fetch(
              `/api/attendance/manager?managerId=${encodeURIComponent(
                managerId
              )}&startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`
            )
            : Promise.resolve(null),
          managerId != null
            ? fetch(`/api/weekly-reports/me`, {
              headers: {
                ...(localStorage.getItem("loggedInEmail")?.trim()
                  ? { "X-User-Email": localStorage.getItem("loggedInEmail")!.trim() }
                  : {}),
              },
            })
            : Promise.resolve(null),
          authService.getAllUsers(),
          fetch(
            `/api/monthly-statistics/me?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`,
            {
              headers: {
                ...(localStorage.getItem("loggedInEmail")?.trim()
                  ? { "X-User-Email": localStorage.getItem("loggedInEmail")!.trim() }
                  : {}),
                ...(localStorage.getItem("token")?.trim()
                  ? { Authorization: `Bearer ${localStorage.getItem("token")!.trim()}` }
                  : {}),
              },
            }
          ),
        ];

        const [attendanceResult, weeklyResult, areaDashboardResult, monthlyStatsResult] = await Promise.allSettled(statsPromises);

        let attendance: AttendanceSummary[] = [];
        if (
          attendanceResult.status === "fulfilled" &&
          attendanceResult.value &&
          attendanceResult.value.ok
        ) {
          const raw = await attendanceResult.value.json();
          attendance = Array.isArray(raw) ? raw : [];
        }

        let weeklyReports: WeeklyReportSummary[] = [];
        if (weeklyResult.status === "fulfilled" && weeklyResult.value && weeklyResult.value.ok) {
          const raw = await weeklyResult.value.json();
          weeklyReports = Array.isArray(raw) ? raw : [];
        }

        const areaOfficers =
          areaDashboardResult.status === "fulfilled" &&
          Array.isArray(areaDashboardResult.value)
          ? areaDashboardResult.value.filter(
            (user) =>
              extractUserRole(user?.role) === "SECURITY_OFFICER" &&
              (!assignedArea.trim() ||
                (user?.assignedArea || "").trim().toLowerCase() === assignedArea.trim().toLowerCase())
          ).length
          : 0;

        let monthlyStatsRows: MonthlyStatRow[] = [];
        if (
          monthlyStatsResult.status === "fulfilled" &&
          monthlyStatsResult.value.ok
        ) {
          const monthlyStatsRaw = await monthlyStatsResult.value.json();
          monthlyStatsRows = Array.isArray(monthlyStatsRaw) ? monthlyStatsRaw : [];
        }
        const monthShifts = monthlyStatsRows.reduce((sum, row) => sum + Number(row?.monthlyShifts ?? 0), 0);
        const overtimeHours = monthlyStatsRows.reduce((sum, row) => sum + Number(row?.monthlyOvertimeHours ?? 0), 0);

        const currentWeek = getCurrentWeekKey();
        const weeklyReportsThisWeek = weeklyReports.filter(
          (w) =>
            Number(w.weekNumber) === currentWeek.weekNumber &&
            Number(w.year) === currentWeek.year &&
            (w.month == null || Number(w.month) === currentWeek.month)
        ).length;

        setStats({
          areaOfficers,
          monthShifts,
          overtimeHours,
          weeklyReportsThisWeek,
          loading: false,
          error:
            areaDashboardResult.status === "rejected"
              ? "Some stats could not be loaded. Showing available data."
              : null,
        });
      } catch (e) {
        console.error("Error loading dashboard stats:", e);
        setStats((s) => ({
          ...s,
          loading: false,
          error: "Failed to load live statistics.",
        }));
      }
    }

    loadStats();
  }, [managerId]);

  const displayNumber = (value: number) =>
    stats.loading ? "…" : value.toLocaleString(undefined, { maximumFractionDigits: 1 });

  return (
    <div className="area-dashboard">
      <div className="header">
        <h2>Dashboard</h2>
        <p>Welcome to Ace Front Line Security Services Management System</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438z" />
            </svg>
          </div>
          <div className="card-title">
            {assignedArea ? `${assignedArea} Officers` : "Registered Officers"}
          </div>
          <div className="card-value">{displayNumber(stats.areaOfficers)}</div>
          <div className="card-description">
            {assignedArea ? `Assigned to ${assignedArea}` : "Assigned to your area"}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
              <path
                fillRule="evenodd"
                d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z"
              />
            </svg>
          </div>
          <div className="card-title">This Month&apos;s Shifts</div>
          <div className="card-value">{displayNumber(stats.monthShifts)}</div>
          <div className="card-description">Counted shifts in this month</div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
              />
            </svg>
          </div>
          <div className="card-title">Overtime Hours</div>
          <div className="card-value">
            {stats.loading ? "…" : stats.overtimeHours.toFixed(1)}
          </div>
          <div className="card-description">Overtime recorded this month</div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6.905 9.97a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72V18a.75.75 0 001.5 0v-4.19l1.72 1.72a.75.75 0 101.06-1.06l-3-3z"
              />
              <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
            </svg>
          </div>
          <div className="card-title">Weekly Reports</div>
          <div className="card-value">
            {displayNumber(stats.weeklyReportsThisWeek)}
          </div>
          <div className="card-description">Generated in the current week</div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <Link to="/area-manager/attendance" className="action-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z"
              />
            </svg>
            Record Attendance
          </Link>
          <Link to="/area-manager/weekly-report" className="action-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
            </svg>
            Generate Weekly Report
          </Link>
          <Link to="/area-manager/monthly-report" className="action-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.125 3C3.089 3 2.25 3.84 2.25 4.875V18a3 3 0 003 3h15a3 3 0 01-3-3V4.875C17.25 3.839 16.41 3 15.375 3H4.125zM12 9.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H12zm-.75-2.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H12a.75.75 0 01-.75-.75zM6 12.75a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5H6zm-.75 3.75a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5H6a.75.75 0 01-.75-.75zM6 6.75a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-3A.75.75 0 009 6.75H6z"
              />
              <path d="M18.75 6.75h1.875c.621 0 1.125.504 1.125 1.125V18a1.5 1.5 0 01-3 0V6.75z" />
            </svg>
            Create Monthly Report
          </Link>
        </div>
      </div>
    </div>
  );
}

