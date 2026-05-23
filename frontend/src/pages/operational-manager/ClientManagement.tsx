import { useEffect, useState, useMemo } from "react";
import { clientApi } from "@/lib/api";
import type { Client, SuccessData } from "@/utils/client";
import {
  Users,
  CheckCircle,
  PauseCircle,
  CalendarX,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Download,
  Filter,
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  XCircle,
  RotateCcw,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import ClientRegistration from "@/components/client/ClientRegistration";

/* ───────────────────────────── types / helpers ────────────────────────────── */

type View = "list" | "register" | "success" | "detail";

const ROWS_PER_PAGE = 10;

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    SUSPENDED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    TERMINATED: "bg-red-500/10 text-red-500 border-red-500/20",
    EXPIRED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    EXPIRING: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  return map[s] || "bg-muted text-muted-foreground border-border";
};

const formatDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatCurrency = (n?: number) =>
  `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

const downloadCsv = (rows: string[], fileName: string) => {
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const getDisplayStatus = (client: Client): string => {
  if (client.status === "ACTIVE" && client.contractEndDate) {
    const end = new Date(client.contractEndDate);
    const diff = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diff > 0 && diff <= 60) return "EXPIRING";
  }
  return client.status;
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         CLIENT MANAGEMENT PAGE                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

const ClientManagement = () => {
  const [view, setView] = useState<View>("list");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();

  /* ── list state ── */
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterIndustry, setFilterIndustry] = useState("ALL");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [automationLoading, setAutomationLoading] = useState<string | null>(null);

  const goToRegister = () => {
    setSuccessData(null);
    setSelectedClient(null);
    setView("register");
  };

  const handleAction = async (action: string, successMessage: string) => {
    try {
      setAutomationLoading(action);
      await api.post(`/v1/automation/${action}`);
      toast({
        title: "Success",
        description: successMessage,
      });

      // These automation jobs can update client statuses; refresh list to reflect changes.
      if (action === "send-contract-reminders" || action === "handle-expired-contracts") {
        fetchClients();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action.replace(/-/g, " ")}.`,
        variant: "destructive",
      });
    } finally {
      setAutomationLoading(null);
    }
  };

  /* ── data fetching ── */
  const fetchClients = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await clientApi.getAll();
      setClients(data || []);
    } catch {
      setError("Failed to load clients. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  /* ── computed stats ── */
  const total = clients.length;
  const active = clients.filter((c) => c.status === "ACTIVE").length;
  const suspended = clients.filter((c) => c.status === "SUSPENDED").length;
  const expiring = clients.filter((c) => {
    if (!c.contractEndDate) return false;
    const end = new Date(c.contractEndDate);
    const diff = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 60;
  }).length;

  /* ── filtered + paginated ── */
  const industries = useMemo(
    () => [...new Set(clients.map((c) => c.industryType).filter(Boolean))].sort(),
    [clients]
  );

  const filtered = useMemo(() => {
    const rows = clients.filter((c) => {
      const matchSearch =
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        c.contactPersonEmail.toLowerCase().includes(search.toLowerCase()) ||
        c.contactPersonName.toLowerCase().includes(search.toLowerCase()) ||
        (c.clientCode || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === "ALL" ||
        (filterStatus === "EXPIRING"
          ? getDisplayStatus(c) === "EXPIRING"
          : c.status === filterStatus);
      const matchIndustry =
        filterIndustry === "ALL" || c.industryType === filterIndustry;
      return matchSearch && matchStatus && matchIndustry;
    });
    return rows.sort((a, b) => {
      const taRaw = Date.parse(b.registeredAt ?? b.updatedAt ?? "");
      const tbRaw = Date.parse(a.registeredAt ?? a.updatedAt ?? "");
      const ta = Number.isNaN(taRaw) ? 0 : taRaw;
      const tb = Number.isNaN(tbRaw) ? 0 : tbRaw;
      return (ta - tb) || (b.clientId - a.clientId);
    });
  }, [clients, search, filterStatus, filterIndustry]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterIndustry]);

  /* ── actions ── */
  const handleClientAction = async (
    clientId: number,
    action: "suspend" | "terminate" | "reactivate"
  ) => {
    if (!confirm(`Are you sure you want to ${action} this client?`)) return;
    setActionLoading(clientId);
    try {
      await clientApi[action](clientId);
      fetchClients();
    } catch {
      alert(`Failed to ${action} client.`);
    } finally {
      setActionLoading(null);
    }
  };

  const onRegisterSuccess = (data: SuccessData) => {
    setSuccessData(data);
    setView("success");
    fetchClients(); // Refresh the list
  };

  const handleDownloadClients = () => {
    const header = [
      "Client Code",
      "Company Name",
      "Contact Person",
      "Email",
      "Phone",
      "Industry",
      "Status",
      "Contract End",
      "Registered",
    ];

    const rows = filtered.map((client) => [
      client.clientCode ?? "",
      client.companyName ?? "",
      client.contactPersonName ?? "",
      client.contactPersonEmail ?? "",
      client.contactPersonPhone ?? "",
      client.industryType ?? "",
      getDisplayStatus(client),
      client.contractEndDate ? formatDate(client.contractEndDate) : "",
      formatDate(client.registeredAt ?? client.updatedAt),
    ].map((cell) => escapeCsv(String(cell))).join(","));

    downloadCsv([header.map(escapeCsv).join(","), ...rows], `clients-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                             LIST VIEW                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const renderListView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Client Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Onboard, view, and manage your corporate clients.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-border hover:bg-muted/50 transition-all font-semibold"
            disabled={!!automationLoading}
            onClick={() =>
              handleAction(
                "send-contract-reminders",
                "Contract reminders sent."
              )
            }
          >
            {automationLoading === "send-contract-reminders" ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Send Contract Reminders
          </Button>
          <Button
            variant="outline"
            className="border-border hover:bg-muted/50 transition-all font-semibold"
            disabled={!!automationLoading}
            onClick={() =>
              handleAction(
                "handle-expired-contracts",
                "Expired contracts handled."
              )
            }
          >
            {automationLoading === "handle-expired-contracts" ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CalendarX className="h-4 w-4 mr-2" />
            )}
            Handle Expired Contracts
          </Button>
          <Button
            onClick={() => setView("register")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Register New Client
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Clients",
            value: total.toLocaleString(),
            icon: Users,
            trend: "12%",
            up: true,
            color: "",
            bg: "bg-blue-50/50 dark:bg-blue-950/20",
            iconBg: "bg-blue-100/50 dark:bg-blue-900/30",
            iconColor: "text-blue-500",
          },
          {
            label: "Active Contracts",
            value: active.toLocaleString(),
            icon: CheckCircle,
            trend: "5%",
            up: true,
            color: "text-emerald-500",
            bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
            iconBg: "bg-emerald-100/50 dark:bg-emerald-900/30",
            iconColor: "text-emerald-500",
          },
          {
            label: "Suspended",
            value: suspended.toString(),
            icon: PauseCircle,
            trend: "2%",
            up: false,
            color: "text-amber-500",
            bg: "bg-amber-50/50 dark:bg-amber-950/20",
            iconBg: "bg-amber-100/50 dark:bg-amber-900/30",
            iconColor: "text-amber-500",
          },
          {
            label: "Expiring Soon",
            value: expiring.toString(),
            icon: CalendarX,
            trend: "8%",
            up: true,
            color: "text-rose-500",
            bg: "bg-rose-50/50 dark:bg-rose-950/20",
            iconBg: "bg-rose-100/50 dark:bg-rose-900/30",
            iconColor: "text-rose-500",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} p-6 rounded-xl border shadow-sm`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 ${stat.iconBg} rounded-lg`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <span
                className={`text-sm font-bold flex items-center gap-0.5 ${stat.up ? "text-emerald-500" : "text-rose-500"
                  }`}
              >
                {stat.up ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                ~{stat.trend}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              {stat.label}
            </p>
            <p className={`text-3xl font-black mt-1 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            {/* Status filter */}
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Status:
              </span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="TERMINATED">Terminated</option>
                <option value="EXPIRED">Expired</option>
                <option value="EXPIRING">Expiring Soon</option>
              </select>
            </div>

            {/* Industry filter */}
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Industry:
              </span>
              <select
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 cursor-pointer"
              >
                <option value="ALL">All Industries</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center bg-muted rounded-lg border border-border px-3 py-1.5 w-full sm:w-[28rem] lg:w-[34rem] max-w-full">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-muted-foreground ml-2 outline-none"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleDownloadClients}
              className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors border"
              title="Download filtered clients as CSV"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={fetchClients}
              className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors border"
              title="Refresh"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Loading clients...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">
              {search || filterStatus !== "ALL" || filterIndustry !== "ALL"
                ? "No clients match your filters."
                : "No clients yet. Register your first client!"}
            </p>
            {!search && filterStatus === "ALL" && filterIndustry === "ALL" && (
              <button
                onClick={goToRegister}
                className="mt-4 text-primary font-bold hover:underline"
              >
                + Register New Client
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-left">Client</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-center hidden md:table-cell">Industry</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-center hidden lg:table-cell">Contract End</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-center">Status</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginated.map((c) => {
                    const displayStatus = getDisplayStatus(c);
                    const sBadge = statusBadge(displayStatus);
                    return (
                      <tr
                        key={c.clientId}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-left">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${sBadge}`}
                            >
                              {getInitials(c.companyName)}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground whitespace-nowrap">
                                {c.companyName}
                              </p>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {c.clientCode}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell text-center">
                          {c.industryType}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell text-center">
                          {formatDate(c.contractEndDate)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${sBadge}`}
                          >
                            {displayStatus.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={actionLoading === c.clientId}
                              >
                                {actionLoading === c.clientId ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedClient(c);
                                  setView("detail");
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {c.status === "ACTIVE" && (
                                <DropdownMenuItem
                                  className="text-amber-600 focus:text-amber-600"
                                  onClick={() =>
                                    handleClientAction(c.clientId, "suspend")
                                  }
                                >
                                  <PauseCircle className="mr-2 h-4 w-4" />
                                  Suspend
                                </DropdownMenuItem>
                              )}
                              {c.status === "SUSPENDED" && (
                                <DropdownMenuItem
                                  className="text-emerald-600 focus:text-emerald-600"
                                  onClick={() =>
                                    handleClientAction(
                                      c.clientId,
                                      "reactivate"
                                    )
                                  }
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Re-activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() =>
                                  handleClientAction(c.clientId, "terminate")
                                }
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Terminate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-muted/30 flex items-center justify-between border-t">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-bold text-foreground">
                  {(page - 1) * ROWS_PER_PAGE + 1} to{" "}
                  {Math.min(page * ROWS_PER_PAGE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-foreground">
                  {filtered.length.toLocaleString()}
                </span>{" "}
                clients
              </p>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-card transition-colors disabled:opacity-50 flex items-center gap-1"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-card transition-colors disabled:opacity-50 flex items-center gap-1"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                         REGISTRATION VIEW                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const renderRegistrationView = () => (
    <div className="w-full flex justify-center">
      <ClientRegistration
        onBack={() => setView("list")}
        onSuccess={onRegisterSuccess}
      />
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                          SUCCESS VIEW                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const renderSuccessView = () => {
    if (!successData) return null;
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">

          {/* Hero success banner */}
          <div className="px-8 py-10 text-center border-b border-border/50">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">Registration Successful!</h2>
            <p className="text-muted-foreground text-sm mt-1">
              <strong className="text-foreground">{successData.companyName}</strong> has been onboarded successfully
            </p>
          </div>

          {/* Credentials section */}
          <div className="px-6 py-6 space-y-5">
            {/* Warning note */}
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium">
                Save these credentials now — the temporary password will <strong>not</strong> be shown again.
              </p>
            </div>

            {/* Credentials cards */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 border rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Username</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-sm font-bold text-foreground">{successData.username}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(successData.username)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors shrink-0"
                      title="Copy username"
                    >
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">Temp. Password</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-sm font-bold text-primary">{successData.temporaryPassword || "Via email"}</code>
                    {successData.temporaryPassword && (
                      <button
                        onClick={() => navigator.clipboard.writeText(successData.temporaryPassword!)}
                        className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors shrink-0"
                        title="Copy password"
                      >
                        <Copy className="h-3.5 w-3.5 text-primary" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Email Sent To</p>
                    <p className="text-sm font-semibold">{successData.contactPersonEmail}</p>
                  </div>
                  <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Next steps */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">What's Next</p>
              <ul className="space-y-1.5">
                {[
                  "Client receives email with login credentials",
                  "Client logs in and sets a new password",
                  "Assign officers and generate the first invoice",
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-blue-800">
                    <span className="h-4 w-4 rounded-full bg-blue-200 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-3">
            <button
              onClick={() => setView("list")}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Client List
            </button>
            <button
              onClick={goToRegister}
              className="border border-border hover:bg-muted font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm text-foreground"
            >
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                          DETAIL VIEW                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const renderDetailView = () => {
    if (!selectedClient) return null;
    const c = selectedClient;
    const displayStatus = getDisplayStatus(c);

    return (
      <div className="space-y-6">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Client List
        </button>

        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/80 flex items-center justify-center font-bold text-lg text-primary-foreground">
              {getInitials(c.companyName)}
            </div>
            <div>
              <h1 className="text-2xl font-black">{c.companyName}</h1>
              <p className="text-muted-foreground text-sm font-mono">
                #{c.clientCode || `AF-${c.clientId}`}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusBadge(
              displayStatus
            )}`}
          >
            {displayStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Info */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Company Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Registration No</p>
                <p className="font-semibold">
                  {c.companyRegistrationNo || "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">VAT Number</p>
                <p className="font-semibold">{c.vatNumber || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Industry</p>
                <p className="font-semibold">{c.industryType || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">City</p>
                <p className="font-semibold">{c.city || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Address</p>
                <p className="font-semibold">{c.address || "—"}</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Contact Person
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  {getInitials(c.contactPersonName)}
                </div>
                <div>
                  <p className="font-bold">{c.contactPersonName}</p>
                  <p className="text-muted-foreground text-xs">
                    {c.contactPersonDesignation || "Primary Contact"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{c.contactPersonEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{c.contactPersonPhone || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs">Username:</span>
                <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                  {c.username}
                </code>
              </div>
            </div>
          </div>

          {/* Contract */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Contract Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Start Date</p>
                <p className="font-semibold">
                  {formatDate(c.serviceStartDate)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">End Date</p>
                <p className="font-semibold">
                  {formatDate(c.contractEndDate)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-semibold">
                  {c.contractDurationMonths} months
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Service Location</p>
                <p className="font-semibold">{c.serviceLocation || "—"}</p>
              </div>
            </div>
          </div>

          {/* Staffing & Rates */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" /> Staffing & Rates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">OIC Count</p>
                <p className="font-semibold">{c.oicCount ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">JSO Count</p>
                <p className="font-semibold">{c.jsoCount ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active Officers</p>
                <p className="font-semibold text-primary">
                  {c.activeOfficersCount ?? 0}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">OIC Rate/Shift</p>
                <p className="font-semibold">
                  {formatCurrency(c.oicRatePerShift)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">JSO Rate/Shift</p>
                <p className="font-semibold">
                  {formatCurrency(c.jsoRatePerShift)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">OIC OT Rate/Hour</p>
                <p className="font-semibold">
                  {formatCurrency(c.oicOtRatePerHour)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">JSO OT Rate/Hour</p>
                <p className="font-semibold">
                  {formatCurrency(c.jsoOtRatePerHour)}
                </p>
              </div>
            </div>
          </div>

          {/* Financial */}
          <div className="bg-card rounded-xl border p-6 space-y-4 lg:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Financial & Risk Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Outstanding Balance
                </p>
                <p
                  className={`text-xl font-black ${(c.totalOutstanding ?? 0) > 0
                    ? "text-amber-600"
                    : "text-emerald-600"
                    }`}
                >
                  {formatCurrency(c.totalOutstanding)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Risk Level
                </p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${c.riskLevel === "LOW"
                    ? "bg-emerald-100 text-emerald-700"
                    : c.riskLevel === "MEDIUM"
                      ? "bg-amber-100 text-amber-700"
                      : c.riskLevel === "HIGH"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-700"
                    }`}
                >
                  {c.riskLevel}
                </span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Recommended Officers
                </p>
                <p className="text-xl font-black">{c.recommendedOfficers ?? "—"}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Registered
                </p>
                <p className="text-sm font-semibold">
                  {formatDate(c.registeredAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          {c.status === "ACTIVE" && (
            <>
              <button
                onClick={() => handleClientAction(c.clientId, "suspend")}
                className="px-4 py-2 rounded-lg border text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors flex items-center gap-2"
              >
                <Ban className="h-4 w-4" /> Suspend Partner
              </button>
              <button
                onClick={() => handleClientAction(c.clientId, "terminate")}
                className="px-4 py-2 rounded-lg border text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" /> Terminate
              </button>
            </>
          )}
          {(c.status === "SUSPENDED" || c.status === "TERMINATED") && (
            <button
              onClick={() => handleClientAction(c.clientId, "reactivate")}
              className="px-4 py-2 rounded-lg border text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" /> Reactivate
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                              RENDER                                   */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-0">
      {view === "list" && renderListView()}
      {view === "register" && renderRegistrationView()}
      {view === "success" && renderSuccessView()}
      {view === "detail" && renderDetailView()}
    </div>
  );
};

export default ClientManagement;
