import { useEffect, useState } from "react";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import "./MonthlyReport.css";

interface MonthlyReportRecord {
  id: number;
  monthName: string;
  year: number;
  branch: string;
  status: string;
  generatedDate: string;
}

interface MonthlyReportDetail extends MonthlyReportRecord {
  month: number;
  problemsFaced: string;
  rootCauses: string;
  mitigationSteps: string;
  complaintsReceived: string | null;
  additionalNotes: string | null;
}

const MONTHS = [
  { value: "", label: "Select Month" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function MonthlyReport() {
  const [reports, setReports] = useState<MonthlyReportRecord[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [form, setForm] = useState({
    month: "",
    year: 2026,
    problemsFaced: "",
    rootCauses: "",
    mitigationSteps: "",
    complaintsReceived: "",
    additionalNotes: "",
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editReport, setEditReport] = useState<MonthlyReportDetail | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<number | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    problemsFaced: "",
    rootCauses: "",
    mitigationSteps: "",
    complaintsReceived: "",
    additionalNotes: "",
  });

  const displayReports = [...reports].sort((a, b) => {
    // Show older reports first so the newest/saved draft appears at the bottom.
    if (a.year !== b.year) return a.year - b.year;
    const aMonth = MONTHS.find((m) => m.label === a.monthName)?.value ?? "";
    const bMonth = MONTHS.find((m) => m.label === b.monthName)?.value ?? "";
    const aMonthNum = parseInt(aMonth || "0", 10);
    const bMonthNum = parseInt(bMonth || "0", 10);
    if (aMonthNum !== bMonthNum) return aMonthNum - bMonthNum;
    const aDate = new Date(a.generatedDate).getTime();
    const bDate = new Date(b.generatedDate).getTime();
    if (aDate !== bDate) return aDate - bDate;
    return a.id - b.id;
  });

  async function loadReports() {
    setReportsLoading(true);
    try {
      const email = localStorage.getItem("loggedInEmail")?.trim();
      const token = localStorage.getItem("token")?.trim();
      const res = await fetch(`/api/monthly-reports/me`, {
        headers: {
          ...(email ? { "X-User-Email": email } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading reports:", e);
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
    const timer = setInterval(loadReports, 15000);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      month: parseInt(form.month, 10),
      year: form.year,
      problemsFaced: form.problemsFaced,
      rootCauses: form.rootCauses,
      mitigationSteps: form.mitigationSteps,
      complaintsReceived: form.complaintsReceived,
      additionalNotes: form.additionalNotes,
      status: "DRAFT",
    };
    try {
      const email = localStorage.getItem("loggedInEmail")?.trim();
      const token = localStorage.getItem("token")?.trim();
      const res = await fetch("/api/monthly-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(email ? { "X-User-Email": email } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("Monthly report created successfully!");
        setForm({
          month: "",
          year: 2026,
          problemsFaced: "",
          rootCauses: "",
          mitigationSteps: "",
          complaintsReceived: "",
          additionalNotes: "",
        });
        loadReports();
      } else {
        const error = await res.text();
        alert("Error: " + error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to create report");
    }
  }

  function handleClear() {
    setForm({
      month: "",
      year: 2026,
      problemsFaced: "",
      rootCauses: "",
      mitigationSteps: "",
      complaintsReceived: "",
      additionalNotes: "",
    });
  }

  async function startEdit(id: number) {
    setEditLoadingId(id);
    try {
      const res = await fetch(`/api/monthly-reports/${id}`);
      if (!res.ok) {
        const error = await res.text();
        alert("Failed to load report: " + (error || res.statusText));
        return;
      }
      const data: MonthlyReportDetail = await res.json();
      setEditReport(data);
      setEditForm({
        problemsFaced: data.problemsFaced ?? "",
        rootCauses: data.rootCauses ?? "",
        mitigationSteps: data.mitigationSteps ?? "",
        complaintsReceived: data.complaintsReceived ?? "",
        additionalNotes: data.additionalNotes ?? "",
      });
      setEditModalOpen(true);
    } catch (e) {
      console.error("Error loading report for edit:", e);
      alert("Failed to load report for editing. Check the console and that the backend is running.");
    } finally {
      setEditLoadingId(null);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editReport) return;
    setEditSaving(true);
    const payload = {
      problemsFaced: editForm.problemsFaced,
      rootCauses: editForm.rootCauses,
      mitigationSteps: editForm.mitigationSteps,
      complaintsReceived: editForm.complaintsReceived || null,
      additionalNotes: editForm.additionalNotes || null,
      status: editReport.status,
    };
    try {
      const res = await fetch(`/api/monthly-reports/${editReport.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditModalOpen(false);
        setEditReport(null);
        await loadReports();
        alert("Monthly report updated successfully!");
      } else {
        const error = await res.text();
        alert("Error updating report: " + (error || res.statusText));
      }
    } catch (e) {
      console.error("Error updating report:", e);
      alert("Failed to update report. Check the console and network.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Are you sure you want to delete this monthly report? This cannot be undone.");
    if (!confirmed) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/monthly-reports/${id}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        await loadReports();
        alert("Monthly report deleted successfully!");
      } else {
        const error = await res.text();
        alert("Error deleting report: " + (error || res.statusText));
      }
    } catch (e) {
      console.error("Error deleting report:", e);
      alert("Failed to delete report. Check the console and that the backend is running.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmitForReview(id: number) {
    const confirmed = window.confirm("Submit this monthly report to chairman for review?");
    if (!confirmed) return;

    setSubmittingId(id);
    try {
      const email = localStorage.getItem("loggedInEmail")?.trim();
      const token = localStorage.getItem("token")?.trim();
      const res = await fetch(`/api/monthly-reports/${id}/submit`, {
        method: "POST",
        headers: {
          ...(email ? { "X-User-Email": email } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        await loadReports();
        alert("Report submitted to chairman successfully.");
      } else {
        const error = await res.text();
        alert("Failed to submit report: " + (error || res.statusText));
      }
    } catch (e) {
      console.error("Error submitting report:", e);
      alert("Failed to submit report. Check the console and network.");
    } finally {
      setSubmittingId(null);
    }
  }

  function badgeClass(status: string) {
    return "badge badge-" + status.toLowerCase();
  }

  return (
    <div className="area-monthly">
      <div className="header">
        <h2>Monthly Report</h2>
        <p>Record problems, root causes, mitigation steps, and complaints</p>
      </div>

      <div className="content-wrapper">
        <div className="form-section">
          <h3>Create New Monthly Report</h3>
          <form id="monthlyReportForm" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Month *</label>
                <select
                  required
                  value={form.month}
                  onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value || "empty"} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Year *</label>
                <input
                  type="number"
                  required
                  value={form.year}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, year: parseInt(e.target.value, 10) || 2026 }))
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>Problems Faced *</label>
              <textarea
                required
                placeholder="Describe the main problems encountered during the month..."
                value={form.problemsFaced}
                onChange={(e) => setForm((f) => ({ ...f, problemsFaced: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Root Causes *</label>
              <textarea
                required
                placeholder="Identify the root causes of the problems..."
                value={form.rootCauses}
                onChange={(e) => setForm((f) => ({ ...f, rootCauses: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Mitigation Steps *</label>
              <textarea
                required
                placeholder="Describe the steps taken or planned to address the problems..."
                value={form.mitigationSteps}
                onChange={(e) => setForm((f) => ({ ...f, mitigationSteps: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Complaints Received</label>
              <textarea
                placeholder="List any complaints received from client companies..."
                value={form.complaintsReceived}
                onChange={(e) => setForm((f) => ({ ...f, complaintsReceived: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Additional Notes</label>
              <textarea
                placeholder="Any other relevant information..."
                value={form.additionalNotes}
                onChange={(e) => setForm((f) => ({ ...f, additionalNotes: e.target.value }))}
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Save as Draft
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleClear}>
              Clear Form
            </button>
          </form>
        </div>
      </div>

      <div className="content-wrapper">
        <h3 className="section-title">Previous Monthly Reports</h3>
        <table className="reports-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Generated Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reportsLoading ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  Loading reports...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  No reports created yet
                </td>
              </tr>
            ) : (
              displayReports.map((report) => (
                <tr key={report.id}>
                  <td>
                    {report.monthName} {report.year}
                  </td>
                  <td>{report.branch}</td>
                  <td>
                    <span className={badgeClass(report.status)}>{report.status}</span>
                  </td>
                  <td>{new Date(report.generatedDate).toLocaleDateString()}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        type="button"
                        className="btn-action btn-edit"
                        onClick={() => startEdit(report.id)}
                        disabled={editLoadingId !== null || report.status === "SUBMITTED" || report.status === "APPROVED"}
                        title="Edit report"
                      >
                        {editLoadingId === report.id ? (
                          <Loader2 className="spin" size={16} />
                        ) : (
                          <Pencil size={16} />
                        )}
                        Edit
                      </button>
                      {(report.status === "DRAFT" || report.status === "REJECTED") && (
                        <button
                          type="button"
                          className="btn-action btn-submit"
                          onClick={() => handleSubmitForReview(report.id)}
                          disabled={submittingId !== null}
                          title="Submit to chairman"
                        >
                          {submittingId === report.id ? <Loader2 className="spin" size={16} /> : "Submit"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(report.id)}
                        disabled={deletingId !== null || report.status === "SUBMITTED" || report.status === "APPROVED"}
                        title="Delete report"
                      >
                        {deletingId === report.id ? (
                          <Loader2 className="spin" size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {editModalOpen && editReport && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditModalOpen(false);
              setEditReport(null);
            }
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              Edit Monthly Report – {editReport.monthName} {editReport.year} ({editReport.branch})
            </h3>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Problems Faced *</label>
                <textarea
                  required
                  value={editForm.problemsFaced}
                  onChange={(e) => setEditForm((f) => ({ ...f, problemsFaced: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Root Causes *</label>
                <textarea
                  required
                  value={editForm.rootCauses}
                  onChange={(e) => setEditForm((f) => ({ ...f, rootCauses: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Mitigation Steps *</label>
                <textarea
                  required
                  value={editForm.mitigationSteps}
                  onChange={(e) => setEditForm((f) => ({ ...f, mitigationSteps: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Complaints Received</label>
                <textarea
                  value={editForm.complaintsReceived}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, complaintsReceived: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  value={editForm.additionalNotes}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, additionalNotes: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <input value={editReport.status} readOnly />
              </div>
              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSaving}
                >
                  {editSaving ? (
                    <>
                      <Loader2 className="spin" size={16} />
                      Saving…
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditReport(null);
                  }}
                  disabled={editSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
