import { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import "./Attendance.css";
import { hslVar } from "@/lib/utils";

interface SecurityOfficer {
  id: number;
  fullName: string;
  securityId: string;
}

interface AttendanceRecord {
  id?: number;
  attendanceDate: string;
  securityOfficerId?: number;
  securityOfficerName: string;
  securityId: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  hoursWorked?: number;
  overtimeHours?: number;
  status?: string;
  remarks?: string;
  isShiftCounted?: boolean;
}

export default function Attendance() {
  const [officers, setOfficers] = useState<SecurityOfficer[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [shiftAlert, setShiftAlert] = useState({ show: false, message: "" });

  const todayStr = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    securityOfficerId: "",
    attendanceDate: todayStr,
    checkInTime: "",
    checkOutTime: "",
    status: "PRESENT",
    remarks: "",
    isShiftCounted: "true",
    overtimeHours: "",
  });
  const [tableFilters, setTableFilters] = useState({
    date: "",
    officerName: "",
    securityId: "",
  });

  // Edit/Delete modal for existing attendance rows
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    securityOfficerId: "",
    attendanceDate: todayStr,
    checkInTime: "",
    checkOutTime: "",
    status: "PRESENT",
    remarks: "",
    isShiftCounted: "true",
    overtimeHours: "",
  });
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const loggedInEmail = localStorage.getItem("loggedInEmail")?.trim() || "";
  const authToken = localStorage.getItem("token")?.trim() || "";

  const filteredRecords = records.filter((r) => {
    const recIso = r.attendanceDate ? String(r.attendanceDate).slice(0, 10) : "";
    if (tableFilters.date && recIso !== tableFilters.date) return false;
    if (
      tableFilters.officerName &&
      !r.securityOfficerName.toLowerCase().includes(tableFilters.officerName.toLowerCase())
    )
      return false;
    if (
      tableFilters.securityId &&
      !r.securityId.toLowerCase().includes(tableFilters.securityId.toLowerCase())
    )
      return false;
    return true;
  });
  const hasActiveFilters =
    tableFilters.date !== "" ||
    tableFilters.officerName !== "" ||
    tableFilters.securityId !== "";

  const parseISODateToLocalMidnight = (iso: string) => {
    // Treat `YYYY-MM-DD` as a calendar date in the user's local timezone.
    // This avoids the "off by one day" problem that happens with `new Date('YYYY-MM-DD')` parsing as UTC.
    const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
    if (!y || !m || !d) return 0;
    return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  };

  const formatISODate = (iso: string) => {
    const ms = parseISODateToLocalMidnight(iso);
    if (!ms) return iso;
    return new Date(ms).toLocaleDateString();
  };

  const parsedRecDateIso = (r: AttendanceRecord) =>
    r.attendanceDate ? String(r.attendanceDate).slice(0, 10) : "";

  const recentSorted = [...filteredRecords].sort((a, b) => {
    const dateDiff =
      parseISODateToLocalMidnight(String(b.attendanceDate)) -
      parseISODateToLocalMidnight(String(a.attendanceDate));

    // If dates are equal, prefer the higher DB id (when present).
    if (dateDiff !== 0) return dateDiff;
    return (b.id ?? 0) - (a.id ?? 0);
  });

  // The table should always show details for the date the user is currently looking at:
  // - if "Filter by Date" is set, use that
  // - otherwise use the form's `attendanceDate`
  const activeIsoDate = tableFilters.date
    ? tableFilters.date
    : form.attendanceDate
      ? String(form.attendanceDate).slice(0, 10)
      : "";

  const activeDateRecords =
    activeIsoDate !== ""
      ? recentSorted.filter((r) => parsedRecDateIso(r) === activeIsoDate)
      : [];

  const otherRecords =
    activeIsoDate !== ""
      ? recentSorted.filter((r) => parsedRecDateIso(r) !== activeIsoDate)
      : recentSorted;

  const remainingSlots = Math.max(0, 10 - activeDateRecords.length);
  const recentRecords = [
    ...activeDateRecords,
    ...(otherRecords as AttendanceRecord[]).slice(0, remainingSlots),
  ];

  const calculatedHours = (() => {
    const { checkInTime: inVal, checkOutTime: outVal } = form;
    if (!inVal || !outVal) return "--";
    const inParts = inVal.split(":");
    const outParts = outVal.split(":");
    if (inParts.length !== 2 || outParts.length !== 2) return "--";
    const inMinutes = parseInt(inParts[0], 10) * 60 + parseInt(inParts[1], 10);
    const outMinutes = parseInt(outParts[0], 10) * 60 + parseInt(outParts[1], 10);
    let diff = outMinutes - inMinutes;
    if (diff < 0) diff += 24 * 60;
    return (diff / 60).toFixed(2) + " hours";
  })();

  // Automatically set "Count as Shift" to "No" when calculated working hours < 12
  useEffect(() => {
    const { checkInTime: inVal, checkOutTime: outVal } = form;
    if (!inVal || !outVal) {
      // Avoid stale OT value when user clears check-in/out.
      if (form.overtimeHours !== "") {
        setForm((f) => ({ ...f, overtimeHours: "" }));
      }
      return;
    }
    const inParts = inVal.split(":");
    const outParts = outVal.split(":");
    if (inParts.length !== 2 || outParts.length !== 2) return;
    const inMinutes = parseInt(inParts[0], 10) * 60 + parseInt(inParts[1], 10);
    const outMinutes = parseInt(outParts[0], 10) * 60 + parseInt(outParts[1], 10);
    let diff = outMinutes - inMinutes;
    if (diff < 0) diff += 24 * 60;
    const hours = diff / 60;
    const shiftCounted = hours >= 12;
    const overtime = Math.max(0, hours - 12);

    setForm((f) => ({
      ...f,
      isShiftCounted: shiftCounted ? "true" : "false",
      // Keep backend as source of truth, but pre-fill OT to match the same rule.
      overtimeHours: overtime > 0 ? overtime.toFixed(2) : "0",
    }));
  }, [form.checkInTime, form.checkOutTime]);

  // Auto-calculate for edit modal (12-hour shift rule)
  useEffect(() => {
    const { checkInTime: inVal, checkOutTime: outVal } = editForm;

    if (!inVal || !outVal) {
      if (editForm.overtimeHours !== "") {
        setEditForm((f) => ({ ...f, overtimeHours: "" }));
      }
      return;
    }

    const inParts = inVal.split(":");
    const outParts = outVal.split(":");
    if (inParts.length !== 2 || outParts.length !== 2) return;

    const inMinutes = parseInt(inParts[0], 10) * 60 + parseInt(inParts[1], 10);
    const outMinutes = parseInt(outParts[0], 10) * 60 + parseInt(outParts[1], 10);

    let diff = outMinutes - inMinutes;
    if (diff < 0) diff += 24 * 60;

    const hours = diff / 60;
    const shiftCounted = hours >= 12;
    const overtime = Math.max(0, hours - 12);

    setEditForm((f) => ({
      ...f,
      isShiftCounted: shiftCounted ? "true" : "false",
      overtimeHours: overtime > 0 ? overtime.toFixed(2) : "0",
    }));
  }, [editForm.checkInTime, editForm.checkOutTime]);

  async function loadOfficers() {
    const date = form.attendanceDate;
    if (!date) {
      setOfficers([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/attendance/approved-officers?date=${encodeURIComponent(String(date).slice(0, 10))}`
      );
      if (!res.ok) {
        setOfficers([]);
        return;
      }
      const data = await res.json();
      const list: SecurityOfficer[] = Array.isArray(data)
        ? data.map(
            (o: {
              securityOfficerId: number;
              securityOfficerName: string;
              securityId?: string | null;
            }) => ({
              id: o.securityOfficerId,
              fullName: o.securityOfficerName,
              securityId: o.securityId?.trim() ? o.securityId.trim() : "",
            })
          )
        : [];
      setOfficers(list);
      setForm((f) => {
        const currentId = f.securityOfficerId ? parseInt(f.securityOfficerId, 10) : null;
        if (currentId && !list.some((o) => o.id === currentId)) {
          return { ...f, securityOfficerId: "" };
        }
        return f;
      });
    } catch (e) {
      console.error("Error loading officers:", e);
      setOfficers([]);
    }
  }

  async function loadAttendance(dateIso?: string) {
    setRecordsLoading(true);
    try {
      // Load records for the month that the user is currently working on.
      // This ensures a saved April record appears in "Recent Attendance Records" immediately.
      const iso = dateIso ?? form.attendanceDate;
      const isoStr = iso ? String(iso) : "";
      if (!isoStr) {
        setRecords([]);
        return;
      }
      const [yStr, mStr] = String(iso).split("-");
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);

      const base = Number.isFinite(y) && Number.isFinite(m) ? new Date(y, m - 1, 1) : new Date();
      const startDate = new Date(base.getFullYear(), base.getMonth(), 1).toISOString().split("T")[0];
      const endDate = new Date(base.getFullYear(), base.getMonth() + 1, 0).toISOString().split("T")[0];

      const res = await fetch(
        `/api/attendance/date-range?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );
      const raw = await res.json();
      const data: AttendanceRecord[] = Array.isArray(raw) ? raw : [];
      setRecords(data);
    } catch (e) {
      console.error("Error loading attendance:", e);
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }

  function updateChart(records: AttendanceRecord[]) {
    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;
    const statusCounts = records.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    const primary = hslVar("--primary");
    const destructive = hslVar("--destructive");
    const accent = hslVar("--accent");
    const mutedForeground = hslVar("--muted-foreground");
    const border = hslVar("--border");
    const foreground = hslVar("--foreground");
    const tooltipBg = hslVar("--card") || hslVar("--background");

    // Stable status -> color mapping using your theme tokens
    const labelKeys = Object.keys(statusCounts);
    const statusColor = (status: string) => {
      switch (status) {
        case "PRESENT":
          return primary || "#F4CC00";
        case "ABSENT":
          return destructive || "#DC3545";
        case "HALF_DAY":
          return accent || "#111111";
        case "LEAVE":
          return border || "#CBD5E1";
        default:
          return border || "#CBD5E1";
      }
    };

    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labelKeys,
        datasets: [
          {
            label: "Attendance Status",
            data: Object.values(statusCounts),
            backgroundColor: labelKeys.map(statusColor),
            borderColor: border || "rgba(0,0,0,0.1)",
            borderWidth: 1,
            borderRadius: 8,
            maxBarThickness: 56,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: border ? border : "rgba(0,0,0,0.06)" },
            ticks: { color: mutedForeground || "#666", font: { family: "Public Sans" } },
          },
          y: {
            beginAtZero: true,
            max: 31,
            ticks: {
              stepSize: 1,
              color: mutedForeground || "#666",
              font: { family: "Public Sans" },
            },
            suggestedMax: 31,
            grid: { color: border ? border : "rgba(0,0,0,0.06)" },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tooltipBg || "rgba(255,255,255,0.95)",
            titleColor: foreground || "#111",
            bodyColor: mutedForeground || "#444",
            borderColor: border || "rgba(0,0,0,0.1)",
            borderWidth: 1,
            titleFont: { family: "Public Sans", weight: 600 },
            bodyFont: { family: "Public Sans" },
          },
        },
      },
    });
  }

  // Keep the monthly overview chart in sync with the filtered records
  useEffect(() => {
    updateChart(filteredRecords);
  }, [filteredRecords]);

  useEffect(() => {
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, []);

  // Officers allocated on an APPROVED shift schedule for the selected attendance date.
  useEffect(() => {
    void loadOfficers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.attendanceDate]);

  // Reload attendance records when the user changes:
  // - the form date (what they are recording/editing)
  // - or the "Filter by Date" date (what they want to inspect in the recent table)
  useEffect(() => {
    const effectiveIso = tableFilters.date ? tableFilters.date : form.attendanceDate;
    loadAttendance(effectiveIso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableFilters.date, form.attendanceDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShiftAlert({ show: false, message: "" });

    if (form.checkInTime && form.checkOutTime) {
      const inParts = form.checkInTime.split(":");
      const outParts = form.checkOutTime.split(":");
      if (inParts.length === 2 && outParts.length === 2) {
        const inMinutes = parseInt(inParts[0], 10) * 60 + parseInt(inParts[1], 10);
        const outMinutes = parseInt(outParts[0], 10) * 60 + parseInt(outParts[1], 10);
        if (outMinutes < inMinutes) {
          alert("Check-out time cannot be earlier than check-in time.");
          return;
        }
      }
    }

    const payload = {
      securityOfficerId: parseInt(form.securityOfficerId, 10),
      attendanceDate: form.attendanceDate,
      checkInTime: form.checkInTime || null,
      checkOutTime: form.checkOutTime || null,
      status: form.status,
      remarks: form.remarks,
      isShiftCounted: form.isShiftCounted === "true",
      overtimeHours: form.overtimeHours !== "" ? parseFloat(form.overtimeHours) : null,
    };
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(loggedInEmail ? { "X-User-Email": loggedInEmail } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("Attendance recorded successfully!");
        // Ensure the "Recent Attendance Records" table shows the record we just saved.
        // This avoids confusion when the user previously used table filters.
        setTableFilters({
          date: form.attendanceDate ? String(form.attendanceDate).slice(0, 10) : "",
          officerName: "",
          securityId: "",
        });
        setForm({
          securityOfficerId: "",
          // Keep the selected date so the "Recent Attendance Records" table
          // reloads the same month and shows the saved entry immediately.
          attendanceDate: form.attendanceDate,
          checkInTime: "",
          checkOutTime: "",
          status: "PRESENT",
          remarks: "",
          isShiftCounted: "true",
          overtimeHours: "",
        });
        loadAttendance();
      } else {
        const error = await res.text();
        if (error.includes("maximum shifts")) {
          setShiftAlert({ show: true, message: error });
        } else {
          alert("Error: " + error);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed to record attendance");
    }
  }

  function normalizeTime(t: string | null | undefined) {
    if (!t) return "";
    // DB might return "HH:mm:ss" while input needs "HH:mm"
    return String(t).slice(0, 5);
  }

  function openEditModal(record: AttendanceRecord) {
    if (!record.id) return;

    const attendanceDate = record.attendanceDate
      ? String(record.attendanceDate).slice(0, 10)
      : form.attendanceDate;

    setEditId(record.id);
    setEditModalOpen(true);
    setEditForm({
      securityOfficerId: record.securityOfficerId != null ? String(record.securityOfficerId) : "",
      attendanceDate,
      checkInTime: normalizeTime(record.checkInTime),
      checkOutTime: normalizeTime(record.checkOutTime),
      status: record.status ?? "PRESENT",
      remarks: record.remarks ?? "",
      isShiftCounted: record.isShiftCounted != null ? (record.isShiftCounted ? "true" : "false") : "true",
      overtimeHours:
        record.overtimeHours != null ? Number(record.overtimeHours).toFixed(2) : "",
    });
  }

  async function handleUpdateEdit() {
    if (!editId) return;

    const effectiveIso = tableFilters.date ? tableFilters.date : form.attendanceDate;

    if (editForm.checkInTime && editForm.checkOutTime) {
      const inParts = editForm.checkInTime.split(":");
      const outParts = editForm.checkOutTime.split(":");
      if (inParts.length === 2 && outParts.length === 2) {
        const inMinutes = parseInt(inParts[0], 10) * 60 + parseInt(inParts[1], 10);
        const outMinutes = parseInt(outParts[0], 10) * 60 + parseInt(outParts[1], 10);
        if (outMinutes < inMinutes) {
          alert("Check-out time cannot be earlier than check-in time.");
          return;
        }
      }
    }

    const payload = {
      // updateAttendance ignores securityOfficerId (it loads by attendance id)
      securityOfficerId: editForm.securityOfficerId ? parseInt(editForm.securityOfficerId, 10) : null,
      attendanceDate: editForm.attendanceDate,
      checkInTime: editForm.checkInTime || null,
      checkOutTime: editForm.checkOutTime || null,
      status: editForm.status,
      remarks: editForm.remarks,
      isShiftCounted: editForm.isShiftCounted === "true",
      overtimeHours: editForm.overtimeHours !== "" ? parseFloat(editForm.overtimeHours) : null,
    };

    try {
      const res = await fetch(`/api/attendance/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(loggedInEmail ? { "X-User-Email": loggedInEmail } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        alert("Update failed: " + (await res.text()));
        return;
      }

      alert("Attendance updated successfully!");
      setEditModalOpen(false);
      setEditId(null);
      loadAttendance(effectiveIso);
    } catch (e) {
      console.error(e);
      alert("Failed to update attendance.");
    }
  }

  async function handleDeleteAttendance(id?: number) {
    if (!id) return;
    if (!confirm("Delete this attendance record?")) return;

    const effectiveIso = tableFilters.date ? tableFilters.date : form.attendanceDate;
    try {
      const res = await fetch(`/api/attendance/${id}`, {
        method: "DELETE",
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(loggedInEmail ? { "X-User-Email": loggedInEmail } : {}),
        },
      });
      if (!res.ok) {
        alert("Delete failed: " + (await res.text()));
        return;
      }
      alert("Attendance deleted successfully!");
      loadAttendance(effectiveIso);
    } catch (e) {
      console.error(e);
      alert("Failed to delete attendance.");
    }
  }

  function statusClass(s: string) {
    return "status-" + s.toLowerCase();
  }

  return (
    <div className="attendance-page">
      <div className="header">
        <h2>Attendance Sheet</h2>
        <p>Record daily attendance for security officers</p>
      </div>

      {shiftAlert.show && (
        <div className="alert alert-warning">
          <strong>Warning:</strong> <span>{shiftAlert.message}</span>
        </div>
      )}

      <div className="content-wrapper">
        <div className="form-section">
          <h3>Record Attendance</h3>
          <form id="attendanceForm" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Security Officer *</label>
                <select
                  required
                  value={form.securityOfficerId}
                  onChange={(e) => setForm((f) => ({ ...f, securityOfficerId: e.target.value }))}
                >
                  <option value="">Select Officer</option>
                  {officers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.fullName}
                      {o.securityId ? ` (${o.securityId})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  required
                  value={form.attendanceDate}
                  onChange={(e) => setForm((f) => ({ ...f, attendanceDate: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Check-In Time</label>
                <input
                  type="time"
                  value={form.checkInTime}
                  onChange={(e) => setForm((f) => ({ ...f, checkInTime: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Check-Out Time</label>
                <input
                  type="time"
                  value={form.checkOutTime}
                  onChange={(e) => setForm((f) => ({ ...f, checkOutTime: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Calculated Working Hours</label>
                <input
                  type="text"
                  readOnly
                  value={calculatedHours}
                  placeholder="--"
                  className="calculated-hours"
                />
              </div>
              <div className="form-group">
                <label>OT Hours</label>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  placeholder="e.g. 1.5"
                  value={form.overtimeHours}
                  onChange={(e) => setForm((f) => ({ ...f, overtimeHours: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select
                  required
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="LEAVE">Leave</option>
                </select>
              </div>
              <div className="form-group">
                <label>Count as Shift</label>
                <select
                  value={form.isShiftCounted}
                  onChange={(e) => setForm((f) => ({ ...f, isShiftCounted: e.target.value }))}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Remarks</label>
              <textarea
                placeholder="Any additional notes..."
                value={form.remarks}
                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                className="remarks-textarea"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Save Attendance
            </button>
          </form>
        </div>
      </div>

      <div className="content-wrapper">
        <h3 className="section-title">Recent Attendance Records</h3>
        <div className="table-filters">
          <div className="form-group">
            <label>Filter by Date</label>
            <input
              type="date"
              value={tableFilters.date}
              onChange={(e) =>
                setTableFilters((f) => ({ ...f, date: e.target.value }))
              }
            />
          </div>
          <div className="form-group">
            <label>Filter by Officer Name</label>
            <input
              type="text"
              placeholder="e.g. Kamal"
              value={tableFilters.officerName}
              onChange={(e) =>
                setTableFilters((f) => ({ ...f, officerName: e.target.value }))
              }
            />
          </div>
          <div className="form-group">
            <label>Filter by Security ID</label>
            <input
              type="text"
              placeholder="e.g. SO-2026"
              value={tableFilters.securityId}
              onChange={(e) =>
                setTableFilters((f) => ({ ...f, securityId: e.target.value }))
              }
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary btn-clear-filters"
              onClick={() =>
                setTableFilters({ date: "", officerName: "", securityId: "" })
              }
            >
              Clear filters
            </button>
          )}
        </div>
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Officer Name</th>
              <th>Security ID</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Hours</th>
              <th>OT Hours</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recordsLoading ? (
              <tr>
                <td colSpan={9} className="empty-state">
                  Loading records...
                </td>
              </tr>
            ) : recentRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-state">
                  {hasActiveFilters
                    ? "No records match your filters"
                    : "No attendance records for this month"}
                </td>
              </tr>
            ) : (
              recentRecords.map((record, idx) => (
                <tr key={record.id ?? idx}>
                  <td>
                    {record.attendanceDate
                      ? formatISODate(String(record.attendanceDate))
                      : "-"}
                  </td>
                  <td>{record.securityOfficerName}</td>
                  <td>{record.securityId}</td>
                  <td>{record.checkInTime ?? "-"}</td>
                  <td>{record.checkOutTime ?? "-"}</td>
                  <td>{(record.hoursWorked ?? 0).toFixed(2)}</td>
                  <td>{(record.overtimeHours ?? 0).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${statusClass(record.status)}`}>{record.status}</span>
                  </td>
                  <td className="whitespace-nowrap">
                    <button
                      type="button"
                      className="attendance-action-btn attendance-action-btn--edit"
                      onClick={() => openEditModal(record)}
                      disabled={!record.id}
                      title="Edit attendance"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="attendance-action-btn attendance-action-btn--delete"
                      onClick={() => handleDeleteAttendance(record.id)}
                      disabled={!record.id}
                      title="Delete attendance"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editModalOpen && editId != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="attendance-edit-modal bg-[#1A1A1A] p-6 rounded-lg w-full max-w-md border border-[#D4AF37]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-[#D4AF37]">Edit Attendance</h3>

            <div className="space-y-4">
              <div className="form-group">
                <label className="block text-white text-sm mb-1">Attendance Date</label>
                <input
                  type="text"
                  readOnly
                  value={editForm.attendanceDate}
                  className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white"
                />
              </div>

              <div className="form-group">
                <label className="block text-white text-sm mb-1">Check-In Time</label>
                <input
                  type="time"
                  value={editForm.checkInTime}
                  onChange={(e) => setEditForm((f) => ({ ...f, checkInTime: e.target.value }))}
                  className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white"
                />
              </div>

              <div className="form-group">
                <label className="block text-white text-sm mb-1">Check-Out Time</label>
                <input
                  type="time"
                  value={editForm.checkOutTime}
                  onChange={(e) => setEditForm((f) => ({ ...f, checkOutTime: e.target.value }))}
                  className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white"
                />
              </div>

              <div className="form-group">
                <label className="block text-white text-sm mb-1">OT Hours</label>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  value={editForm.overtimeHours}
                  onChange={(e) => setEditForm((f) => ({ ...f, overtimeHours: e.target.value }))}
                  className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white"
                />
              </div>

              <div className="form-group">
                <label className="block text-white text-sm mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white"
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="LEAVE">Leave</option>
                </select>
              </div>

              <div className="form-group">
                <label className="block text-white text-sm mb-1">Count as Shift</label>
                <select
                  value={editForm.isShiftCounted}
                  onChange={(e) => setEditForm((f) => ({ ...f, isShiftCounted: e.target.value }))}
                  className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="form-group">
                <label className="block text-white text-sm mb-1">Remarks</label>
                <textarea
                  value={editForm.remarks}
                  onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))}
                  className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white h-24"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                className="px-4 py-2 rounded border border-gray-600 text-white hover:bg-gray-800"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditId(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-[#D4AF37] text-black font-bold hover:bg-yellow-600"
                onClick={handleUpdateEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="histogram-container">
        <h3>Monthly Attendance Overview</h3>
        <div className="chart-wrapper">
          <canvas ref={chartRef} id="attendanceChart" />
        </div>
      </div>
    </div>
  );
}

