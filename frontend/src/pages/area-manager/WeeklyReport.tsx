import { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import "./WeeklyReport.css";
import { hslVar } from "@/lib/utils";

interface WeeklyReportRecord {
  id: number;
  securityOfficerName: string;
  securityId: string;
  companyName: string;
  weekNumber: number;
  month: number | null;
  year: number;
  weekStartDate?: string | null;
  weekEndDate?: string | null;
  branch?: string | null;
  totalShifts: number;
  totalOvertimeHours: number;
  totalHoursWorked: number;
  remarks: string | null;
}

interface SecurityOfficer {
  id: number;
  fullName: string;
  securityId: string;
}

function weekDisplayLabel(r: WeeklyReportRecord): string {
  if (r.month != null && r.month >= 1 && r.month <= 12) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return "Week " + r.weekNumber + ", " + months[r.month - 1] + " " + r.year;
  }
  return "Week " + r.weekNumber + ", " + r.year;
}

function getWeekAndYearFromDate(
  dateStr: string
): { weekNumber: number; month: number; year: number; label: string } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T12:00:00");
  const year = d.getFullYear();
  const month = d.getMonth();
  const dayOfMonth = d.getDate();
  const weekNumber = Math.min(4, Math.floor((dayOfMonth - 1) / 7) + 1);
  const weekStartDay = (weekNumber - 1) * 7 + 1;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const weekEndDay = weekNumber < 4 ? weekNumber * 7 : lastDay;
  const weekStartDate = new Date(year, month, weekStartDay);
  const weekEndDate = new Date(year, month, weekEndDay);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmt = (dt: Date) => dt.getDate() + " " + months[dt.getMonth()];
  return {
    weekNumber,
    month: month + 1,
    year,
    label:
      "Week " +
      weekNumber +
      ", " +
      months[month] +
      " " +
      year +
      " (" +
      fmt(weekStartDate) +
      " – " +
      fmt(weekEndDate) +
      ")",
  };
}

export default function WeeklyReport() {
  const [companies, setCompanies] = useState<string[]>([]);
  const [officers, setOfficers] = useState<SecurityOfficer[]>([]);
  const [allReports, setAllReports] = useState<WeeklyReportRecord[]>([]);
  const [crudReports, setCrudReports] = useState<WeeklyReportRecord[]>([]);
  const [filterCompany, setFilterCompany] = useState("");
  const [filterOfficerId, setFilterOfficerId] = useState("");
  const [filterWeekDate, setFilterWeekDate] = useState("");
  const [crudCompany, setCrudCompany] = useState("");
  const [crudWeekDate, setCrudWeekDate] = useState("");
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [manageGroup, setManageGroup] = useState<WeeklyReportRecord[]>([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewReportItem, setViewReportItem] = useState<WeeklyReportRecord | null>(null);
  const [weekManageOpen, setWeekManageOpen] = useState(false);
  const [weekManageItems, setWeekManageItems] = useState<WeeklyReportRecord[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editReport, setEditReport] = useState<WeeklyReportRecord | null>(null);
  const [editForm, setEditForm] = useState({
    totalShifts: 0,
    totalOvertimeHours: 0,
    totalHoursWorked: 0,
    remarks: "",
  });
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const lastGeneratedKeyRef = useRef<string>("");
  const lastCrudGeneratedKeyRef = useRef<string>("");

  const crudWeekDateInputRef = useRef<HTMLInputElement | null>(null);
  const filterWeekDateInputRef = useRef<HTMLInputElement | null>(null);

  function openDatePicker(ref: React.RefObject<HTMLInputElement>) {
    const el = ref.current;
    if (!el) return;
    if (typeof (el as HTMLInputElement & { showPicker?: () => void }).showPicker === "function") {
      (el as HTMLInputElement & { showPicker: () => void }).showPicker();
    } else {
      el.focus();
      el.click();
    }
  }

  async function loadCompanies() {
    try {
      // Source dropdown from weekly-report endpoint backed by `clients` table.
      // For AREA_MANAGER users this is filtered by assigned city (assignedArea).
      const storedUserRaw = localStorage.getItem("user");
      let storedUserEmail = "";
      try {
        storedUserEmail = storedUserRaw ? (JSON.parse(storedUserRaw)?.email ?? "") : "";
      } catch {
        storedUserEmail = "";
      }
      const email = (localStorage.getItem("loggedInEmail") || storedUserEmail || "").trim();
      const res = await fetch(`/api/weekly-reports/me/companies`, {
        headers: email ? { "X-User-Email": email } : {},
      });
      const data = await res.json();
      const names = Array.isArray(data) ? data.filter(Boolean) : [];
      if (names.length > 0) {
        setCompanies(names);
        return;
      }

      // Fallback: derive allowed companies from authenticated profile + clients API.
      // This protects the dropdown from legacy email/header resolution mismatches.
      const token = localStorage.getItem("token")?.trim();
      const authHeaders: HeadersInit = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const profileRes = await fetch("/api/auth/me", { headers: authHeaders });
      const profileJson = await profileRes.json().catch(() => null);
      const assignedArea =
        profileJson?.data?.assignedArea && typeof profileJson.data.assignedArea === "string"
          ? profileJson.data.assignedArea.trim()
          : "";

      const clientsRes = await fetch("/api/clients", { headers: authHeaders });
      const clientsJson = await clientsRes.json().catch(() => null);
      const clientRows = Array.isArray(clientsJson?.data) ? clientsJson.data : [];
      const fallbackNames = clientRows
        .filter((c) => c && typeof c.companyName === "string")
        .filter((c) => {
          if (!assignedArea) return true;
          const city = typeof c.city === "string" ? c.city.trim() : "";
          return city.toLowerCase() === assignedArea.toLowerCase();
        })
        .map((c) => c.companyName)
        .filter(Boolean);

      const uniqueSorted = Array.from(new Set(fallbackNames)).sort((a, b) => a.localeCompare(b));
      setCompanies(uniqueSorted);
    } catch (e) {
      console.error("Error loading companies:", e);
      setCompanies([]);
    }
  }

  async function loadOfficersForCompany(companyName: string) {
    try {
      // Officer filter options should come from weekly reports for the selected week.
      // This function is kept for compatibility but no longer calls the old manager-scoped endpoint.
      setOfficers([]);
    } catch (e) {
      console.error("Error loading officers:", e);
      setOfficers([]);
    }
  }

  async function loadReports() {
    try {
      const email = localStorage.getItem("loggedInEmail")?.trim();
      const res = await fetch(`/api/weekly-reports/me`, {
        headers: email ? { "X-User-Email": email } : {},
      });
      const data = await res.json();
      setAllReports(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading reports:", e);
      setAllReports([]);
    }
  }

  // When the user selects a company + week date in the filter section,
  // generate weekly report rows from APPROVED shift scheduling allocations,
  // then reload the list so those rows show up immediately.
  useEffect(() => {
    (async () => {
      if (!filterCompany || !filterWeekDate) return;

      const key = `${filterCompany}|${filterWeekDate}`;
      if (lastGeneratedKeyRef.current === key) return;
      lastGeneratedKeyRef.current = key;

      try {
        await fetch(
          `/api/weekly-reports/generate/company?companyName=${encodeURIComponent(
            filterCompany
          )}&weekDate=${encodeURIComponent(filterWeekDate)}`,
          {
            method: "POST",
            headers: (() => {
              const email = localStorage.getItem("loggedInEmail")?.trim();
              return email ? { "X-User-Email": email } : {};
            })(),
          }
        );
        await loadReports();
      } catch (e) {
        console.error(e);
        alert("Failed to generate weekly reports for the selected company/week.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCompany, filterWeekDate]);

  async function loadCrudReports() {
    if (!crudCompany) {
      alert("Please select a company.");
      return;
    }
    try {
      // Ensure rows exist for the selected company/week by generating from
      // APPROVED shift allocations. This makes "Load Report" behave like the user expects.
      if (crudWeekDate) {
        const key = `${crudCompany}|${crudWeekDate}`;
        if (lastCrudGeneratedKeyRef.current !== key) {
          lastCrudGeneratedKeyRef.current = key;
          await fetch(
            `/api/weekly-reports/generate/company?companyName=${encodeURIComponent(
              crudCompany
            )}&weekDate=${encodeURIComponent(crudWeekDate)}`,
            {
              method: "POST",
              headers: (() => {
                const email = localStorage.getItem("loggedInEmail")?.trim();
                return email ? { "X-User-Email": email } : {};
              })(),
            }
          );
        }
      }

      let url = `/api/weekly-reports/me/company?companyName=${encodeURIComponent(crudCompany)}`;
      if (crudWeekDate) url += "&weekDate=" + encodeURIComponent(crudWeekDate);
      const email = localStorage.getItem("loggedInEmail")?.trim();
      const res = await fetch(url, { headers: email ? { "X-User-Email": email } : {} });
      const data = await res.json();
      setCrudReports(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading CRUD reports:", e);
      alert("Failed to load report data.");
      setCrudReports([]);
    }
  }

  const filteredReports = (() => {
    const base = Array.isArray(allReports) ? allReports : [];
    let list = base.slice().filter((r) => r && typeof r === "object");
    if (filterCompany) list = list.filter((r) => r.companyName === filterCompany);
    if (filterOfficerId) list = list.filter((r) => r.securityId === filterOfficerId);
    if (filterWeekDate) {
      const wk = getWeekAndYearFromDate(filterWeekDate);
      if (wk) {
        list = list.filter(
          (r) => r.year === wk.year && r.month === wk.month && r.weekNumber === wk.weekNumber
        );
      }
    }
    list.sort((a, b) => (a.year !== b.year ? a.year - b.year : a.weekNumber - b.weekNumber));
    return list;
  })();

  const summary =
    filteredReports.length > 0
      ? (() => {
          const first = filteredReports[0];
          const seenIds: Record<string, boolean> = {};
          const officerLabels: string[] = [];
          let totalShiftsSum = 0;
          filteredReports.forEach((r) => {
            if (!seenIds[r.securityId]) {
              seenIds[r.securityId] = true;
              officerLabels.push(r.securityOfficerName + " (" + r.securityId + ")");
            }
            totalShiftsSum += r.totalShifts;
          });
          return { company: first.companyName, officers: officerLabels.join(", "), totalShifts: totalShiftsSum };
        })()
      : null;

  function updateChart() {
    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;
    const reports = filteredReports;
    let labels: string[];
    let dataValues: number[];
    const perOfficer = !!filterOfficerId;

    if (perOfficer) {
      const data = reports.slice(0, 10).map((r) => ({
        weekLabel: "W" + r.weekNumber + " " + r.year,
        shifts: r.totalShifts,
      }));
      labels = data.map((d) => d.weekLabel);
      dataValues = data.map((d) => d.shifts);
    } else {
      const grouped: { weekNumber: number; year: number; totalShifts: number }[] = [];
      reports.forEach((r) => {
        const existing = grouped.find((g) => g.weekNumber === r.weekNumber && g.year === r.year);
        if (existing) existing.totalShifts += r.totalShifts;
        else grouped.push({ weekNumber: r.weekNumber, year: r.year, totalShifts: r.totalShifts });
      });
      const limited = grouped.slice(0, 10);
      labels = limited.map((g) => "W" + g.weekNumber + " " + g.year);
      dataValues = limited.map((g) => g.totalShifts);
    }

    if (chartInstance.current) chartInstance.current.destroy();

    const primary = hslVar("--primary");
    const foreground = hslVar("--foreground");
    const mutedForeground = hslVar("--muted-foreground");
    const border = hslVar("--border");
    const tooltipBg = hslVar("--card") || hslVar("--background");

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: perOfficer ? "Shifts per Week (Officer)" : "Shifts per Week (Company total)",
            data: dataValues,
            backgroundColor: primary || "#F4CC00",
            borderColor: border || primary || "#111111",
            hoverBackgroundColor: primary ? primary : "#F4CC00",
            borderWidth: 1,
            borderRadius: 8,
            maxBarThickness: 44,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: mutedForeground || "#666",
              font: { family: "Public Sans" },
            },
          },
          tooltip: {
            backgroundColor: tooltipBg || "rgba(255,255,255,0.95)",
            titleColor: foreground || "#111",
            bodyColor: mutedForeground || "#444",
            borderColor: border || "rgba(0,0,0,0.1)",
            borderWidth: 1,
            titleFont: { family: "Public Sans", weight: "600" as const },
            bodyFont: { family: "Public Sans" },
          },
        },
        scales: {
          x: {
            grid: { color: border ? border : "rgba(0,0,0,0.06)" },
            ticks: { color: mutedForeground || "#666", font: { family: "Public Sans" } },
          },
          y: {
            beginAtZero: true,
            grid: { color: border ? border : "rgba(0,0,0,0.06)" },
            ticks: { stepSize: 1, color: mutedForeground || "#666", font: { family: "Public Sans" } },
          },
        },
      },
    });
  }

  useEffect(() => {
    updateChart();
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [filteredReports.length, filterOfficerId]);

  useEffect(() => {
    loadCompanies();
    loadReports();
    // Weekly reports should reflect latest attendance edits without requiring
    // manual refresh/reload of the page.
    const interval = window.setInterval(() => {
      loadReports();
    }, 15000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    // Officer dropdown is derived from the already-loaded weekly report rows for the selected week.
    if (!filterCompany || !filterWeekDate) {
      setOfficers([]);
      return;
    }
    const wk = getWeekAndYearFromDate(filterWeekDate);
    if (!wk) {
      setOfficers([]);
      return;
    }
    const list = (Array.isArray(allReports) ? allReports : [])
      .filter(
        (r) =>
          r.companyName === filterCompany &&
          r.year === wk.year &&
          r.month === wk.month &&
          r.weekNumber === wk.weekNumber
      )
      .map((r) => ({ id: -1, fullName: r.securityOfficerName, securityId: r.securityId }))
      .filter((o) => o.securityId);
    const unique = new Map<string, SecurityOfficer>();
    list.forEach((o) => {
      if (!unique.has(o.securityId)) unique.set(o.securityId, o);
    });
    setOfficers(Array.from(unique.values()).sort((a, b) => a.fullName.localeCompare(b.fullName)));
  }, [filterCompany, filterWeekDate, allReports]);

  function viewReport(report: WeeklyReportRecord) {
    setViewReportItem(report);
    setViewModalOpen(true);
  }

  function openManageModal(idsStr: string) {
    const ids = idsStr.split(",").map((s) => parseInt(s.trim(), 10));
    const group = ids
      .map((id) => crudReports.find((x) => x.id === id))
      .filter(Boolean) as WeeklyReportRecord[];
    setManageGroup(group);
    setManageModalOpen(true);
  }

  function openEditModal(r: WeeklyReportRecord) {
    setManageModalOpen(false);
    setEditReport(r);
    setEditForm({
      totalShifts: r.totalShifts ?? 0,
      totalOvertimeHours: r.totalOvertimeHours ?? 0,
      totalHoursWorked: r.totalHoursWorked ?? 0,
      remarks: r.remarks ?? "",
    });
    setEditModalOpen(true);
  }

  async function saveEdit() {
    if (!editReport) return;
    try {
      const res = await fetch("/api/weekly-reports/" + editReport.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editReport.id,
          remarks: editForm.remarks,
        }),
      });
      if (!res.ok) {
        alert("Update failed: " + (await res.text()));
        return;
      }
      setEditModalOpen(false);
      setEditReport(null);
      loadCrudReports();
      loadReports();
    } catch (e) {
      console.error(e);
      alert("Failed to update report.");
    }
  }

  async function deleteReport(reportId: number) {
    if (!confirm("Delete this weekly report row?")) return;
    try {
      const res = await fetch("/api/weekly-reports/" + reportId, { method: "DELETE" });
      if (!res.ok) {
        alert("Delete failed: " + (await res.text()));
        return;
      }
      setManageModalOpen(false);
      setWeekManageOpen(false);
      loadCrudReports();
      loadReports();
    } catch (e) {
      console.error(e);
      alert("Failed to delete report.");
    }
  }

  async function deleteWeekGroup(items: WeeklyReportRecord[]) {
    if (!items || items.length === 0) return;
    const weekLabel = weekDisplayLabel(items[0]);
    if (!confirm(`Delete ALL weekly report rows for ${weekLabel}?`)) return;

    // Delete sequentially so we can show the first failure clearly.
    for (const r of items) {
      try {
        const res = await fetch("/api/weekly-reports/" + r.id, { method: "DELETE" });
        if (!res.ok) {
          alert("Delete failed for report #" + r.id + ": " + (await res.text()));
          return;
        }
      } catch (e) {
        console.error(e);
        alert("Failed to delete report #" + r.id);
        return;
      }
    }

    setWeekManageOpen(false);
    loadCrudReports();
    loadReports();
  }

  function handleCrudGenerateClick() {
    (async () => {
      if (!crudCompany || !crudWeekDate) {
        alert("Please select a company and a week date first.");
        return;
      }

      try {
        // Generate weekly report rows based on APPROVED shift scheduling.
        const genRes = await fetch(
          `/api/weekly-reports/generate/company?companyName=${encodeURIComponent(
            crudCompany
          )}&weekDate=${encodeURIComponent(crudWeekDate)}`,
          { method: "POST" }
        );
        if (!genRes.ok) {
          const errText = await genRes.text();
          alert("Failed to generate weekly report: " + (errText || "Unknown error"));
          return;
        }

        await loadCrudReports();
        await loadReports();
        const weekMeta = getWeekAndYearFromDate(crudWeekDate);
        const weekLabel = weekMeta
          ? `Week ${weekMeta.weekNumber}, ${weekMeta.year}`
          : crudWeekDate;
        alert(`Weekly report generated successfully for ${crudCompany} (${weekLabel}).`);
      } catch (e) {
        console.error(e);
        alert("Failed to generate weekly report for this company/week.");
      }
    })();
  }

  const crudTableRows = (() => {
    if (!crudCompany || crudReports.length === 0) return null;
    const byPerson: Record<string, WeeklyReportRecord[]> = {};
    crudReports.forEach((r) => {
      const key = r.securityId ?? r.securityOfficerName ?? "";
      if (!byPerson[key]) byPerson[key] = [];
      byPerson[key].push(r);
    });
    const selectedWeekLabel = crudWeekDate ? getWeekAndYearFromDate(crudWeekDate)?.label : null;
    const rows: {
      name: string;
      sid: string;
      weekLabel: string;
      totalShifts: number;
      totalOT: number;
      totalHours: number;
      remarks: string;
      group: WeeklyReportRecord[];
    }[] = [];
    for (const key of Object.keys(byPerson)) {
      const group = byPerson[key];
      const first = group[0];
      let totalShifts = 0,
        totalOT = 0,
        totalHours = 0;
      const remarksParts: string[] = [];
      group.forEach((r) => {
        totalShifts += r.totalShifts ?? 0;
        totalOT += r.totalOvertimeHours ?? 0;
        totalHours += r.totalHoursWorked ?? 0;
        if (r.remarks) remarksParts.push(r.remarks);
      });
      const weekLabel =
        selectedWeekLabel ?? (group.length === 1 ? weekDisplayLabel(first) : group.length + " weeks (merged)");
      rows.push({
        name: first.securityOfficerName,
        sid: first.securityId ?? key,
        weekLabel,
        totalShifts,
        totalOT,
        totalHours,
        remarks: remarksParts.length > 0 ? remarksParts.join(" | ") : "-",
        group,
      });
    }
    return rows;
  })();

  const canManageSelectedWeek =
    !!filterCompany &&
    !!filterWeekDate &&
    Array.isArray(filteredReports) &&
    filteredReports.length > 0;

  return (
    <div className="area-weekly">
      <div className="header">
        <h2>Weekly Report</h2>
        <p>Generate and view weekly shift reports for security officers</p>
      </div>

      <div className="content-wrapper">
        <div className="form-section">
          <h3>Generate Weekly Report</h3>
          <p className="section-desc">
            Generate weekly report rows for a company and week. Edits/deletes are available in Recent Weekly Reports after generation.
          </p>
          <div className="form-grid">
            <div className="form-group">
              <label>Company *</label>
              <select value={crudCompany} onChange={(e) => setCrudCompany(e.target.value)}>
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Week Date</label>
              <div className="date-input-wrapper">
                <input
                  ref={crudWeekDateInputRef}
                  type="date"
                  value={crudWeekDate}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCrudWeekDate(next);
                    // Changing week should reset company selection to avoid showing stale rows.
                    setCrudCompany("");
                    setCrudReports([]);
                  }}
                />
                <button
                  type="button"
                  className="btn calendar-btn"
                  onClick={() => openDatePicker(crudWeekDateInputRef)}
                >
                  📅
                </button>
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={loadCrudReports}>
            Load Report
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleCrudGenerateClick}>
            Generate Report for this Company &amp; Week
          </button>

          {crudCompany && crudReports.length > 0 && (
            <>
              <div className="crud-company-header">{crudCompany}</div>
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Officer Name</th>
                    <th>Security ID</th>
                    <th>Week</th>
                    <th>Shifts</th>
                    <th>OT Hours</th>
                    <th>Total Hours</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {crudTableRows?.map((row) => (
                    <tr key={row.sid + row.weekLabel}>
                      <td>{row.name}</td>
                      <td>{row.sid}</td>
                      <td>{row.weekLabel}</td>
                      <td>{row.totalShifts}</td>
                      <td>{row.totalOT.toFixed(2)}</td>
                      <td>{row.totalHours.toFixed(2)}</td>
                      <td>{row.remarks}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-view"
                          onClick={() =>
                            row.group.length === 1
                              ? viewReport(row.group[0])
                              : openManageModal(row.group.map((r) => r.id).join(","))
                          }
                        >
                          {row.group.length === 1 ? "View" : "View Weeks"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {crudCompany && crudReports.length === 0 && (
            <div className="crud-empty-message">
              No report rows for this company. Use &quot;Generate Report for this Company &amp; Week&quot; after selecting
              a week date.
            </div>
          )}
        </div>
      </div>

      <div className="content-wrapper">
        <div className="form-section">
          <h3>Filter the weekly reports</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Company *</label>
              <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}>
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Security Officers in Company</label>
              <select value={filterOfficerId} onChange={(e) => setFilterOfficerId(e.target.value)}>
                <option value="">Select Officer (optional)</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.securityId}>
                    {o.fullName} ({o.securityId})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Week Date *</label>
              <div className="date-input-wrapper">
                <input
                  ref={filterWeekDateInputRef}
                  type="date"
                  value={filterWeekDate}
                  onChange={(e) => {
                    const next = e.target.value;
                    setFilterWeekDate(next);
                    // Changing week should reset officer filter only (keep company).
                    setFilterOfficerId("");
                  }}
                />
                <button
                  type="button"
                  className="btn calendar-btn"
                  onClick={() => openDatePicker(filterWeekDateInputRef)}
                >
                  📅
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            Refresh List
          </button>
        </div>
      </div>

      {manageModalOpen && manageGroup.length > 0 && (
        <div className="modal-overlay" onClick={() => setManageModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              Reports for {manageGroup[0].securityOfficerName} ({manageGroup[0].securityId})
            </h3>
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Shifts</th>
                  <th>OT Hours</th>
                  <th>Total Hours</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {manageGroup.map((r) => (
                  <tr key={r.id}>
                    <td>{weekDisplayLabel(r)}</td>
                    <td>{r.totalShifts ?? 0}</td>
                    <td>{(r.totalOvertimeHours ?? 0).toFixed(2)}</td>
                    <td>{(r.totalHoursWorked ?? 0).toFixed(2)}</td>
                    <td>{r.remarks ?? "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-view"
                        onClick={() => viewReport(r)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: 16 }}
              onClick={() => setManageModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {editModalOpen && editReport && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content modal-edit" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Weekly Report</h3>
            <div className="form-group">
              <label>Total Shifts (from shift scheduling)</label>
              <input
                type="number"
                min={0}
                max={14}
                step={1}
                value={editForm.totalShifts}
                readOnly
              />
            </div>
            <div className="form-group">
              <label>OT Hours (from attendance)</label>
              <input
                type="number"
                min={0}
                max={42}
                step={0.25}
                value={editForm.totalOvertimeHours}
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Total Hours Worked (from attendance)</label>
              <input
                type="number"
                min={0}
                step={0.25}
                value={editForm.totalHoursWorked}
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Remarks</label>
              <input
                type="text"
                placeholder="Optional"
                value={editForm.remarks}
                onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))}
              />
            </div>
            <button type="button" className="btn btn-primary" onClick={saveEdit}>
              Save
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {viewModalOpen && viewReportItem && (
        <div className="modal-overlay" onClick={() => setViewModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Weekly report details</h3>
            <div style={{ marginTop: 10, lineHeight: 1.7 }}>
              <div>
                <strong>Week:</strong> {weekDisplayLabel(viewReportItem)}
                {viewReportItem.weekStartDate && viewReportItem.weekEndDate
                  ? ` (${String(viewReportItem.weekStartDate).slice(0, 10)} → ${String(
                      viewReportItem.weekEndDate
                    ).slice(0, 10)})`
                  : ""}
              </div>
              <div>
                <strong>Officer:</strong> {viewReportItem.securityOfficerName} ({viewReportItem.securityId})
              </div>
              <div>
                <strong>Company:</strong> {viewReportItem.companyName}
              </div>
              {viewReportItem.branch ? (
                <div>
                  <strong>Branch:</strong> {viewReportItem.branch}
                </div>
              ) : null}
              <div>
                <strong>Shifts (from scheduling):</strong> {viewReportItem.totalShifts ?? 0}
              </div>
              <div>
                <strong>OT Hours (from attendance):</strong>{" "}
                {(viewReportItem.totalOvertimeHours ?? 0).toFixed(2)}
              </div>
              <div>
                <strong>Total Hours Worked (from attendance):</strong>{" "}
                {(viewReportItem.totalHoursWorked ?? 0).toFixed(2)}
              </div>
              <div>
                <strong>Remarks:</strong> {viewReportItem.remarks?.trim() ? viewReportItem.remarks : "-"}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setViewModalOpen(false);
                  openEditModal(viewReportItem);
                }}
              >
                Edit remarks
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="content-wrapper">
        <h3 className="section-title">Recent Weekly Reports</h3>
        {canManageSelectedWeek ? (
          <div style={{ margin: "10px 0 14px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setWeekManageItems(filteredReports);
                setWeekManageOpen(true);
              }}
            >
              Manage Week (Edit/Delete as a group)
            </button>
          </div>
        ) : null}
        <div className="company-weekly-summary">
          <p>
            <strong>Company Name:</strong> <span>{summary?.company ?? "-"}</span>
          </p>
          <p>
            <strong>Security Officers:</strong> <span>{summary?.officers ?? "-"}</span>
          </p>
          <p>
            <strong>Total Shifts (all officers):</strong> <span>{summary?.totalShifts ?? "-"}</span>
          </p>
        </div>
        <table className="reports-table">
          <thead>
            <tr>
              <th>Week</th>
              <th>Officer Name</th>
              <th>Security ID</th>
              <th>Company</th>
              <th>Shifts</th>
              <th>OT Hours</th>
              <th>Total Hours</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  No reports generated yet
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.id}>
                  <td>{weekDisplayLabel(report)}</td>
                  <td>{report.securityOfficerName}</td>
                  <td>{report.securityId}</td>
                  <td>{report.companyName}</td>
                  <td>
                    {report.totalShifts}{" "}
                    {report.totalShifts >= 15 ? (
                      <span className="badge badge-warning">High</span>
                    ) : (
                      <span className="badge badge-success">Normal</span>
                    )}
                  </td>
                  <td>{(report.totalOvertimeHours ?? 0).toFixed(2)}</td>
                  <td>{(report.totalHoursWorked ?? 0).toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-view"
                      onClick={() => viewReport(report)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {weekManageOpen && weekManageItems.length > 0 && (
        <div className="modal-overlay" onClick={() => setWeekManageOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              Manage week: {weekDisplayLabel(weekManageItems[0])} · {weekManageItems[0].companyName}
            </h3>
            <p style={{ marginTop: 6, color: "#9CA3AF" }}>
              Shifts come from scheduling, hours/OT from attendance. You can edit remarks per row, or delete the whole week.
            </p>

            <table className="reports-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Officer</th>
                  <th>Security ID</th>
                  <th>Shifts</th>
                  <th>OT Hours</th>
                  <th>Total Hours</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {weekManageItems.map((r) => (
                  <tr key={r.id}>
                    <td>{r.securityOfficerName}</td>
                    <td>{r.securityId}</td>
                    <td>{r.totalShifts ?? 0}</td>
                    <td>{(r.totalOvertimeHours ?? 0).toFixed(2)}</td>
                    <td>{(r.totalHoursWorked ?? 0).toFixed(2)}</td>
                    <td>{r.remarks ?? "-"}</td>
                    <td>
                      <button type="button" className="btn-view" onClick={() => viewReport(r)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setWeekManageOpen(false)}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => deleteWeekGroup(weekManageItems)}
              >
                Delete entire week
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="histogram-container">
        <h3>Weekly Shifts Overview</h3>
        <div className="chart-wrapper">
          <canvas ref={chartRef} />
        </div>
      </div>
    </div>
  );
}

