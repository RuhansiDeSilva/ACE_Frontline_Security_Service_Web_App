import { useEffect, useState } from "react";
import "./MonthlyStatistics.css";
const MAX_SHIFTS_FOR_OT = 60;
const OT_HOURS_PER_SHIFT = 3;

interface StatRow {
  id: number;
  securityId: string;
  officerName: string;
  monthlyShifts: number;
  monthlyOvertimeHours: number;
  monthlyTotalHoursWorked: number;
}

export default function MonthlyStatistics() {
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return String(d.getMonth() + 1).padStart(2, "0");
  });
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [stats, setStats] = useState<StatRow[]>([]);

  const [editRow, setEditRow] = useState<StatRow | null>(null);
  const [editMonthlyShifts, setEditMonthlyShifts] = useState<number>(0);
  const [editMonthlyOvertimeHours, setEditMonthlyOvertimeHours] = useState<number>(0);
  const [savingEdit, setSavingEdit] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const mo = parseInt(month, 10);
      const yr = year;
      const role = (localStorage.getItem("role") || "").trim().toUpperCase();
      const isAccountExec = role === "ACCOUNT_EXECUTIVE" || role === "ACCOUNTANT";

      const email = localStorage.getItem("loggedInEmail")?.trim();
      const token = localStorage.getItem("token")?.trim();
      const endpoint = isAccountExec
        ? `/api/monthly-statistics/all?month=${mo}&year=${yr}`
        : `/api/monthly-statistics/me?month=${mo}&year=${yr}`;
      const res = await fetch(endpoint, {
        headers: {
          ...(email ? { "X-User-Email": email } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      const rows: StatRow[] = Array.isArray(data) ? data : [];
      setStats(rows);
    } catch (e) {
      console.error("Error loading monthly statistics:", e);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [month, year]);

  const monthLabel = (() => {
    const mo = parseInt(month, 10);
    if (Number.isNaN(mo) || mo < 1 || mo > 12) return `${year}`;
    const names = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${names[mo - 1]} ${year}`;
  })();

  async function handleSaveEdit() {
    if (!editRow) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/monthly-statistics/${editRow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyOvertimeHours: editMonthlyOvertimeHours,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update monthly statistics.");
      }

      setEditRow(null);
      await loadData();
    } catch (e) {
      console.error("Error updating monthly statistics:", e);
      alert("Failed to update. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteRow(row: StatRow) {
    const confirmed = window.confirm(
      `Delete monthly statistics for ${row.officerName} (${row.securityId})? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/monthly-statistics/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete monthly statistics.");
      }
      await loadData();
    } catch (e) {
      console.error("Error deleting monthly statistics:", e);
      alert("Failed to delete. Please try again.");
    }
  }

  return (
    <div className="area-monthly-stats">
      <div className="header">
        <h2>Monthly Statistics</h2>
        <p>
          Monthly shifts are calculated from approved shift assignments. Monthly OT hours come from attendance overtime hours.
        </p>
      </div>

      <div className="content-wrapper">
        <div className="form-section filter-row">
          <label>Month</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={String(m).padStart(2, "0")}>
                {new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <label>Year</label>
          <input
            type="number"
            min={2020}
            max={2030}
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
          />
          <button type="button" className="btn btn-primary" onClick={loadData}>
            Refresh
          </button>
        </div>

        <table className="stats-table">
          <thead>
            <tr>
              <th>Security ID</th>
              <th>Officer Name</th>
              <th>Monthly Shifts</th>
              <th>Monthly OT Hours</th>
              <th>Total Hours Worked</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  Loading…
                </td>
              </tr>
            ) : stats.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No officers or no data for {monthLabel}.
                </td>
              </tr>
            ) : (
              stats.map((row) => (
                <tr key={row.id}>
                  <td>{row.securityId}</td>
                  <td>{row.officerName}</td>
                  <td>{Number(row.monthlyShifts ?? 0)}</td>
                  <td>{Number(row.monthlyOvertimeHours ?? 0).toFixed(2)}</td>
                  <td>{Number(row.monthlyTotalHoursWorked ?? 0).toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: "8px 14px", marginRight: 8 }}
                      onClick={() => {
                        setEditRow(row);
                        setEditMonthlyShifts(row.monthlyShifts);
                        setEditMonthlyOvertimeHours(row.monthlyOvertimeHours);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        padding: "8px 14px",
                        background: "#b71c1c",
                        color: "#FFFFFF",
                        marginLeft: 0,
                      }}
                      onClick={() => handleDeleteRow(row)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p className="stats-note">
          OT hours shown are the total `overtimeHours` recorded in attendance for the selected month.
        </p>
      </div>

      {editRow && (
        <div className="monthly-edit-overlay" onClick={() => (savingEdit ? null : setEditRow(null))}>
          <div className="monthly-edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit monthly statistics</h3>
            <p style={{ marginBottom: 14 }}>
              {editRow.officerName} ({editRow.securityId})
            </p>

            <div className="monthly-edit-form">
              <label>
                Monthly Shifts (from approved schedule)
                <input type="number" readOnly value={editRow.monthlyShifts} />
              </label>
              <label>
                Monthly OT Hours
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={editMonthlyOvertimeHours}
                  onChange={(e) => setEditMonthlyOvertimeHours(parseFloat(e.target.value) || 0)}
                />
              </label>
            </div>

            <div className="monthly-edit-actions">
              <button type="button" className="btn btn-primary" onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setEditRow(null)}
                style={{ padding: "12px 18px", background: "#777777", color: "#FFFFFF", marginLeft: 12 }}
                disabled={savingEdit}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

