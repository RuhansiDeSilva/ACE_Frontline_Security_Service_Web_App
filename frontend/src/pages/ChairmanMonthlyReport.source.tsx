import { useEffect, useMemo, useState } from "react";
import "./area-manager/MonthlyReport.css";
import "./ChairmanMonthlyReport.css";

interface MonthlyReportRecord {
  id: number;
  month: number;
  monthName: string;
  year: number;
  branch: string | null;
  status: string;
  generatedDate: string;
  areaManagerName: string | null;
  areaManagerEmployeeId: string | null;
  problemsFaced: string;
  rootCauses: string;
  mitigationSteps: string;
  complaintsReceived: string | null;
  additionalNotes: string | null;
}

const MONTHS = [
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

function badgeClass(status: string) {
  return "badge badge-" + String(status || "DRAFT").toLowerCase();
}

function displayText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "No details provided.";
}

export default function ChairmanMonthlyReport() {
  const [reports, setReports] = useState<MonthlyReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [selected, setSelected] = useState<MonthlyReportRecord | null>(null);
  const [decisionSaving, setDecisionSaving] = useState<"APPROVED" | "REJECTED" | null>(null);

  async function loadReports() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/monthly-reports/chairman");
      if (!res.ok) throw new Error("Failed to load monthly reports");
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load monthly reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadReports();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function decideReport(report: MonthlyReportRecord, status: "APPROVED" | "REJECTED") {
    if (report.status !== "SUBMITTED") {
      alert("Only submitted reports can be reviewed.");
      return;
    }
    const confirmed = window.confirm(
      status === "APPROVED"
        ? "Approve this monthly report?"
        : "Reject this monthly report?"
    );
    if (!confirmed) return;

    setDecisionSaving(status);
    try {
      const res = await fetch(
        `/api/monthly-reports/${report.id}/decision?status=${encodeURIComponent(status)}`,
        { method: "POST" }
      );
      if (!res.ok) {
        const error = await res.text();
        alert("Failed to update report: " + (error || res.statusText));
        return;
      }
      const updated: MonthlyReportRecord = await res.json();
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      alert(`Report ${status.toLowerCase()} successfully.`);
    } catch (e) {
      console.error("Error updating report status:", e);
      alert("Failed to update report status.");
    } finally {
      setDecisionSaving(null);
    }
  }

  const years = useMemo(() => {
    const set = new Set<number>();
    reports.forEach((r) => {
      if (r.year != null) set.add(r.year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [reports]);

  const filteredReports = useMemo(() => {
    const yearNum = filterYear ? parseInt(filterYear, 10) : null;
    const monthNum = filterMonth ? parseInt(filterMonth, 10) : null;
    return reports.filter((r) => {
      if (yearNum != null && r.year !== yearNum) return false;
      if (monthNum != null && r.month !== monthNum) return false;
      return true;
    });
  }, [reports, filterYear, filterMonth]);

  const pendingReports = useMemo(
    () => filteredReports.filter((r) => String(r.status || "").toUpperCase() === "SUBMITTED"),
    [filteredReports]
  );

  function openDetails(report: MonthlyReportRecord) {
    // Chairman should be able to inspect SUBMITTED reports before deciding.
    setSelected(report);
  }

  return (
    <div className="area-monthly">
      <div className="header">
        <h2>Monthly Report</h2>
        <p>Monthly reports submitted by area managers</p>
      </div>

      <div className="content-wrapper">
        <div className="form-section">
          <h3>Filter Reports</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Year</label>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="">All years</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Month</label>
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                <option value="">All months</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={String(i + 1)}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {loadError ? <p style={{ color: "#b91c1c" }}>{loadError}</p> : null}
      </div>

      <div className="content-wrapper">
        <h3 className="section-title">Area Manager Monthly Reports</h3>
        {pendingReports.length > 0 ? (
          <p style={{ margin: "0 0 10px", color: "#b45309", fontWeight: 600 }}>
            {pendingReports.length} submitted report(s) pending approval/rejection.
          </p>
        ) : null}
        <table className="reports-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Area Manager</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Generated Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  Loading reports...
                </td>
              </tr>
            ) : filteredReports.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No submitted reports found for selected filters
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.id}>
                  <td>
                    {report.monthName} {report.year}
                  </td>
                  <td>
                    {report.areaManagerName || "-"}
                    {report.areaManagerEmployeeId ? (
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{report.areaManagerEmployeeId}</div>
                    ) : null}
                  </td>
                  <td>{report.branch || "-"}</td>
                  <td>
                    <span className={badgeClass(report.status)}>{report.status || "DRAFT"}</span>
                  </td>
                  <td>{new Date(report.generatedDate).toLocaleDateString()}</td>
                  <td>
                    <div className="actions-cell">
                      <button type="button" className="btn-action btn-edit" onClick={() => openDetails(report)}>
                        View details
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-submit"
                        onClick={() => decideReport(report, "APPROVED")}
                        disabled={decisionSaving !== null || report.status !== "SUBMITTED"}
                      >
                        {decisionSaving === "APPROVED" ? "Approving..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-delete"
                        onClick={() => decideReport(report, "REJECTED")}
                        disabled={decisionSaving !== null || report.status !== "SUBMITTED"}
                      >
                        {decisionSaving === "REJECTED" ? "Rejecting..." : "Reject"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="modal chairman-monthly-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chairman-monthly-header">
              <h3>
                {selected.monthName} {selected.year} - {selected.branch || "No Branch"}
              </h3>
              <div className="chairman-monthly-status-row">
                <span className={badgeClass(selected.status)}>{selected.status || "DRAFT"}</span>
                <span className="chairman-monthly-generated">
                  Generated: {new Date(selected.generatedDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="chairman-monthly-body">
              <div className="chairman-monthly-meta-grid">
                <div className="chairman-monthly-meta-item">
                  <span className="chairman-monthly-meta-label">Area Manager</span>
                  <span className="chairman-monthly-meta-value">{selected.areaManagerName || "-"}</span>
                </div>
                <div className="chairman-monthly-meta-item">
                  <span className="chairman-monthly-meta-label">Employee ID</span>
                  <span className="chairman-monthly-meta-value">{selected.areaManagerEmployeeId || "-"}</span>
                </div>
                <div className="chairman-monthly-meta-item">
                  <span className="chairman-monthly-meta-label">Branch</span>
                  <span className="chairman-monthly-meta-value">{selected.branch || "No Branch"}</span>
                </div>
                <div className="chairman-monthly-meta-item">
                  <span className="chairman-monthly-meta-label">Period</span>
                  <span className="chairman-monthly-meta-value">
                    {selected.monthName} {selected.year}
                  </span>
                </div>
              </div>

              <div className="chairman-monthly-section">
                <h4>Problems Faced</h4>
                <p>{displayText(selected.problemsFaced)}</p>
              </div>
              <div className="chairman-monthly-section">
                <h4>Root Causes</h4>
                <p>{displayText(selected.rootCauses)}</p>
              </div>
              <div className="chairman-monthly-section">
                <h4>Mitigation Steps</h4>
                <p>{displayText(selected.mitigationSteps)}</p>
              </div>
              <div className="chairman-monthly-section">
                <h4>Complaints Received</h4>
                <p>{displayText(selected.complaintsReceived)}</p>
              </div>
              <div className="chairman-monthly-section">
                <h4>Additional Notes</h4>
                <p>{displayText(selected.additionalNotes)}</p>
              </div>
            </div>

            <div className="modal-actions chairman-monthly-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
