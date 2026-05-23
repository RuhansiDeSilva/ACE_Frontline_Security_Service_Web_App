import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ChangePasswordModal from "@/components/client/ChangePasswordModal";
import { clientApi, invoiceApi, paymentApi, officerAssignmentApi } from "@/lib/api";
import type { ClientDashboardData, Invoice, OfficerAssignment, PaymentRecord } from "@/lib/client";
import { authService } from "@/services/authService";
import type { UserProfile } from "@/services/authService";
import {
    Download, CloudUpload, ChevronRight, ArrowLeft, FileText,
    Star, Shield, AlertTriangle, CreditCard, Phone,
    Building2, User, Calendar, MapPin, Users,
    Activity, TrendingUp, Mail,
} from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ClientDashboard = () => {
    const [data, setData] = useState<ClientDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
    const [lastPayment, setLastPayment] = useState<PaymentRecord | null>(null);
    const [clientCity, setClientCity] = useState("");
    const [clientContactPhone, setClientContactPhone] = useState("");
    const [liveActiveOfficersCount, setLiveActiveOfficersCount] = useState<number | null>(null);
    const [invoicesErr, setInvoicesErr] = useState("");
    const [invoicesLoading, setInvoicesLoading] = useState(false);
    const [activeAssignments, setActiveAssignments] = useState<OfficerAssignment[]>([]);
    const [officerDesignations, setOfficerDesignations] = useState<Record<number, string>>({});
    const [assignmentsLoading, setAssignmentsLoading] = useState(false);
    const [showActiveOfficersModal, setShowActiveOfficersModal] = useState(false);
    const [officerSearch, setOfficerSearch] = useState("");
    const [selectedOfficerId, setSelectedOfficerId] = useState<number | null>(null);
    const [selectedOfficerProfile, setSelectedOfficerProfile] = useState<UserProfile | null>(null);
    const [selectedOfficerLoading, setSelectedOfficerLoading] = useState(false);
    const [selectedOfficerError, setSelectedOfficerError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const clientIdRaw = localStorage.getItem("clientId");
        if (!clientIdRaw) {
            setErr("Client session not found. Please log in again.");
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const res = await clientApi.getDashboard(Number(clientIdRaw));
                setData(res);

                // Load full client profile for fields not present in dashboard DTO (e.g., city)
                try {
                    const fullClient = await clientApi.getById(Number(clientIdRaw));
                    setClientCity(fullClient.city ?? "");
                    setClientContactPhone(fullClient.contactPersonPhone ?? "");
                    setLiveActiveOfficersCount(
                        typeof fullClient.activeOfficersCount === "number" ? fullClient.activeOfficersCount : null
                    );
                } catch {
                    setClientCity("");
                    setClientContactPhone("");
                    setLiveActiveOfficersCount(null);
                }

                if (localStorage.getItem("isFirstLogin") === "true") setShowChangePassword(true);

                // Load real invoices for the dashboard table
                setInvoicesLoading(true);
                setInvoicesErr("");
                try {
                    const inv = await invoiceApi.getByClient(Number(clientIdRaw));
                    const sorted = [...inv].sort((a, b) =>
                        (b.billingYear ?? 0) - (a.billingYear ?? 0) || (b.billingMonth ?? 0) - (a.billingMonth ?? 0)
                    );
                    setRecentInvoices(sorted.slice(0, 5));

                    const payments = await paymentApi.getByClient(Number(clientIdRaw));
                    const sortedPayments = [...payments].sort((a, b) => {
                        const ta = Date.parse(b.paymentDate ?? b.proofUploadedAt ?? "");
                        const tb = Date.parse(a.paymentDate ?? a.proofUploadedAt ?? "");
                        const t1 = Number.isNaN(ta) ? 0 : ta;
                        const t2 = Number.isNaN(tb) ? 0 : tb;
                        return t1 - t2;
                    });
                    setLastPayment(sortedPayments[0] ?? null);
                } catch (e: any) {
                    setInvoicesErr(e?.message ?? "Failed to load invoices");
                } finally {
                    setInvoicesLoading(false);
                }

                try {
                    setAssignmentsLoading(true);
                    const assignments = await officerAssignmentApi.getActiveByClient(Number(clientIdRaw));
                    const list = Array.isArray(assignments) ? assignments : [];
                    setActiveAssignments(list);

                    if (list.length > 0) {
                        const uniqueOfficerIds = Array.from(new Set(list.map((a) => a.officerId)));
                        const profiles = await Promise.all(
                            uniqueOfficerIds.map(async (officerId) => {
                                try {
                                    const profile = await authService.getUserById(officerId);
                                    return [officerId, profile.designation || "—"] as const;
                                } catch {
                                    return [officerId, "—"] as const;
                                }
                            })
                        );
                        setOfficerDesignations(Object.fromEntries(profiles));
                    } else {
                        setOfficerDesignations({});
                    }
                } catch {
                    setActiveAssignments([]);
                    setOfficerDesignations({});
                } finally {
                    setAssignmentsLoading(false);
                }
            } catch (e: any) {
                setErr(e?.message ?? "Failed to load dashboard");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleLogout = () => { authService.logout(); navigate("/client-login"); };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Loading dashboard…</p>
            </div>
        </div>
    );
    if (err) return (
        <div className="flex items-center justify-center py-20">
            <p className="text-red-600 dark:text-red-400 text-sm">{err}</p>
        </div>
    );
    if (!data) return null;

    const isFirstLogin = localStorage.getItem("isFirstLogin") === "true";

    const statusBadge = (s: string) => {
        const map: Record<string, string> = {
            ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
            SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
            EXPIRED: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
            TERMINATED: "bg-gray-100 text-gray-500 dark:bg-slate-500/15 dark:text-slate-300",
        };
        return map[s] ?? "bg-gray-100 text-gray-500 dark:bg-slate-500/15 dark:text-slate-300";
    };

    const formatLkr = (n?: number | null) => (typeof n === "number" ? `LKR ${n.toLocaleString("en-LK", { minimumFractionDigits: 2 })}` : "—");
    const formatDate = (d?: string | null) => {
        if (!d) return "—";
        const t = Date.parse(d);
        if (Number.isNaN(t)) return d;
        return new Date(t).toLocaleDateString("en-LK", { day: "2-digit", month: "short", year: "numeric" });
    };

    const startTs = Date.parse(data.contractStartDate ?? "");
    const endTs = Date.parse(data.contractEndDate ?? "");
    const now = Date.now();
    const contractProgress = Number.isNaN(startTs) || Number.isNaN(endTs) || endTs <= startTs
        ? null
        : Math.max(0, Math.min(100, Math.round(((now - startTs) / (endTs - startTs)) * 100)));

    const liveCurrentInvoice = typeof data.currentInvoiceAmount === "number"
        ? data.currentInvoiceAmount
        : recentInvoices.find(inv => !["PAID", "WAIVED", "CANCELLED"].includes((inv.status ?? "").toUpperCase()))?.totalAmount;

    const activeOfficersCount = liveActiveOfficersCount ?? data.activeOfficersCount;

    const quickStats = [
        { label: "Monthly Fee", value: formatLkr(data.monthlyBaseFee), Icon: CreditCard, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10", trend: "Due 10th of month" },
        { label: "Active Officers", value: typeof activeOfficersCount === "number" ? `${activeOfficersCount}` : "—", Icon: Users, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", trend: "On duty now" },
        { label: "Overdue Invoices", value: typeof data.overdueInvoicesCount === "number" ? `${data.overdueInvoicesCount}` : "—", Icon: AlertTriangle, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", trend: "Action needed" },
        { label: "Risk Level", value: data.riskLevel || "—", Icon: Shield, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/10", trend: "Within normal range" },
    ];

    const closeActiveOfficerModal = () => {
        setShowActiveOfficersModal(false);
        setOfficerSearch("");
        setSelectedOfficerId(null);
        setSelectedOfficerProfile(null);
        setSelectedOfficerLoading(false);
        setSelectedOfficerError("");
    };

    const openOfficerProfileInModal = async (officerId: number) => {
        setSelectedOfficerId(officerId);
        setSelectedOfficerLoading(true);
        setSelectedOfficerError("");
        try {
            const profile = await authService.getUserById(officerId);
            setSelectedOfficerProfile(profile);
        } catch (e: any) {
            setSelectedOfficerError(e?.message ?? "Failed to load officer profile.");
            setSelectedOfficerProfile(null);
        } finally {
            setSelectedOfficerLoading(false);
        }
    };

    const filteredActiveAssignments = activeAssignments.filter((officer) => {
        const q = officerSearch.trim().toLowerCase();
        if (!q) return true;
        const designation = (officerDesignations[officer.officerId] ?? "").toLowerCase();
        return (
            (officer.officerName ?? "").toLowerCase().includes(q) ||
            designation.includes(q) ||
            String(officer.officerId).includes(q)
        );
    });

    return (
        <div className="space-y-5 pb-10">

            {/* ── Hero Banner ── */}
            <section className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-5">
                    {/* Left content */}
                    <div className="lg:col-span-3 p-8 lg:p-10 flex flex-col justify-center gap-5">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black text-foreground leading-[1.1]">
                                {isFirstLogin ? "Welcome," : "Welcome back,"}<br />
                                <span className="text-primary">{data.companyName}</span>
                            </h1>
                            <p className="text-sm text-muted-foreground mt-3 max-w-sm leading-relaxed">
                                Manage your security services and financial status efficiently from your central command center.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                to="/client/payments"
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm shadow-primary/20"
                            >
                                <CloudUpload className="h-4 w-4" /> Upload Payment Proof
                            </Link>
                            <Link
                                to="/client/invoices"
                                className="flex items-center gap-2 border border-border hover:bg-muted text-muted-foreground px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                            >
                                <FileText className="h-4 w-4" /> View Invoices
                            </Link>
                        </div>
                    </div>

                    {/* Right: building image area */}
                    <div className="hidden lg:flex lg:col-span-2 relative overflow-hidden items-center justify-center min-h-[240px]" style={{ background: "linear-gradient(135deg, #334155, #1e293b, #0f172a)" }}>
                        {/* Decorative rings */}
                        <div className="absolute w-64 h-64 rounded-full border border-white/5" />
                        <div className="absolute w-48 h-48 rounded-full border border-white/8" />
                        <div className="absolute w-32 h-32 rounded-full border border-white/10" />
                        {/* Glow */}
                        <div className="absolute top-4 right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
                        <div className="absolute bottom-6 left-6 w-16 h-16 bg-indigo-400/20 rounded-full blur-xl" />
                        {/* Icon */}
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <Building2 className="h-20 w-20 text-white/30" strokeWidth={1.2} />
                            <div className="text-center">
                                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Security Services</p>
                                <p className="text-white/40 text-[10px] mt-0.5">Active Protection</p>
                            </div>
                        </div>
                        {/* Bottom fade */}
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    </div>
                </div>
            </section>

            {/* ── Quick Stats Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickStats.map(({ label, value, Icon, color, bg, trend }) => (
                    <div key={label} className="bg-card rounded-2xl border border-border/60 px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                            <Icon className={`h-4.5 w-4.5 ${color}`} />
                        </div>
                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
                        <p className="text-lg font-black text-foreground mt-0.5 truncate">{value}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{trend}</p>
                    </div>
                ))}
            </div>

            {/* ── Service Overview + Assigned Officers ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                {/* Service Overview */}
                <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <span className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                <Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                            </span>
                            Service Overview
                        </h3>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusBadge(data.status)}`}>
                            {data.status}
                        </span>
                    </div>
                    <div>
                        {[
                            { label: "Contract Period", value: (data.contractStartDate && data.contractEndDate) ? `${data.contractStartDate} – ${data.contractEndDate}` : "—", Icon: Calendar },
                            { label: "Location", value: clientCity || data.serviceLocation || "—", Icon: MapPin },
                            { label: "Contact Number", value: clientContactPhone || "—", Icon: Phone },
                            { label: "Status", value: data.contractStatus || data.status || "—", Icon: Activity, green: data.status === "ACTIVE" },
                        ].map(({ label, value, Icon, green }) => (
                            <div key={label} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    <Icon className={`h-3.5 w-3.5 ${green ? "text-emerald-500" : "text-muted-foreground"}`} />
                                    {label}
                                </span>
                                <span className={`text-sm font-semibold ${green ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>{value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/40">
                        <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                            <span>Contract Progress</span>
                            <span className="font-semibold">{contractProgress != null ? `${contractProgress}%` : "—"}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${contractProgress ?? 0}%` }} />
                        </div>
                    </div>
                </div>

                {/* Assigned Officers */}
                <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <span className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                <User className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                            </span>
                            Assigned Officers
                        </h3>
                        <Link to="/client/shift-schedule" className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1">
                            View Schedule <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/40 px-4 py-3.5">
                                <p className="text-sm text-muted-foreground">Entry-level</p>
                                <p className="text-sm font-black text-foreground">{typeof data.entryLevelCount === "number" ? data.entryLevelCount : "—"}</p>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/40 px-4 py-3.5">
                                <p className="text-sm text-muted-foreground">Mid-level</p>
                                <p className="text-sm font-black text-foreground">{typeof data.midLevelCount === "number" ? data.midLevelCount : "—"}</p>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/40 px-4 py-3.5">
                                <p className="text-sm text-muted-foreground">Specialized</p>
                                <p className="text-sm font-black text-foreground">{typeof data.specializedCount === "number" ? data.specializedCount : "—"}</p>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/40 px-4 py-3.5">
                                <p className="text-sm text-muted-foreground">Supervisor</p>
                                <p className="text-sm font-black text-foreground">{typeof data.supervisorCount === "number" ? data.supervisorCount : "—"}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowActiveOfficersModal(true)}
                            className="w-full text-left flex items-center justify-between rounded-xl border border-border/40 bg-muted/40 px-4 py-3.5 hover:bg-muted/70 transition-all font-bold text-primary"
                        >
                            <p className="text-sm font-bold">Currently Active Officers</p>
                            <p className="text-sm font-black">{typeof activeOfficersCount === "number" ? activeOfficersCount : "—"}</p>
                        </button>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                        <p>Total on site: <span className="font-semibold text-foreground">{typeof activeOfficersCount === "number" ? activeOfficersCount : "—"}</span></p>
                        <p>
                            {[
                                data.entryLevelCount && `${data.entryLevelCount} Entry`,
                                data.midLevelCount && `${data.midLevelCount} Mid`,
                                data.specializedCount && `${data.specializedCount} Spec`,
                                data.supervisorCount && `${data.supervisorCount} Sup`
                            ].filter(Boolean).join(" · ") || "None required"}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Payment Summary + Recent Invoices ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Payment Summary */}
                <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6 flex flex-col gap-4">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                            <CreditCard className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        </span>
                        Payment Summary
                    </h3>
                    <div className="rounded-xl p-4 border border-indigo-100/60 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-indigo-500/15 dark:to-slate-900">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Total Outstanding</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-foreground mt-1">
                            {formatLkr(data.totalOutstanding)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                            <TrendingUp className="h-3 w-3 text-red-400" />
                            <span className="text-[11px] text-red-500 font-medium">{typeof data.overdueInvoicesCount === "number" ? data.overdueInvoicesCount : "—"} invoice overdue</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-border/40 bg-muted/40 p-3">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Current Invoice</p>
                            <p className="text-sm font-black text-foreground mt-0.5">
                                {formatLkr(liveCurrentInvoice ?? null)}
                            </p>
                            <Link to="/client/invoices" className="text-[11px] font-bold text-indigo-500 hover:underline mt-1 block">View PDF →</Link>
                        </div>
                        <div className="rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10 p-3">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Last Payment</p>
                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatLkr(lastPayment?.amountPaid ?? null)}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(lastPayment?.paymentDate ?? lastPayment?.proofUploadedAt)}</p>
                        </div>
                    </div>
                    <Link
                        to="/client/payments"
                        className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all"
                    >
                        <CloudUpload className="h-4 w-4" /> Upload Payment Proof
                    </Link>
                </div>

                {/* Recent Invoices Table (real data) */}
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                        <h3 className="font-bold text-sm">Recent Invoices</h3>
                        <Link to="/client/invoices" className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1">
                            View All <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/40">
                                    <th className="px-5 py-3 text-left">Invoice #</th>
                                    <th className="px-5 py-3 text-left">Billing Period</th>
                                    <th className="px-5 py-3 text-left">Amount</th>
                                    <th className="px-5 py-3 text-left">Status</th>
                                    <th className="px-5 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {invoicesLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                                            Loading invoices…
                                        </td>
                                    </tr>
                                ) : invoicesErr ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-10 text-center text-sm text-red-500 dark:text-red-400">
                                            {invoicesErr}
                                        </td>
                                    </tr>
                                ) : recentInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                                            No invoices available
                                        </td>
                                    </tr>
                                ) : (
                                    recentInvoices.map((inv) => {
                                        const period = `${MONTHS[(inv.billingMonth ?? 1) - 1]} ${inv.billingYear ?? ""}`;
                                        const badge = (s: string) => {
                                            const map: Record<string, string> = {
                                                PAID: "bg-emerald-100 text-emerald-700",
                                                PENDING: "bg-sky-100 text-sky-700",
                                                ISSUED: "bg-amber-100 text-amber-700",
                                                OVERDUE: "bg-red-100 text-red-700",
                                                APPROVED: "bg-indigo-100 text-indigo-700",
                                                PAYMENT_UPLOADED: "bg-sky-100 text-sky-700",
                                                PAYMENT_REJECTED: "bg-orange-100 text-orange-700",
                                                WAIVED: "bg-purple-100 text-purple-700",
                                                DISPUTED: "bg-yellow-100 text-yellow-700",
                                                CANCELLED: "bg-gray-200 text-gray-600 dark:bg-slate-500/15 dark:text-slate-300",
                                                DRAFT: "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-300",
                                            };
                                            return map[s] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-300";
                                        };
                                        return (
                                            <tr key={inv.invoiceId} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-5 py-3.5 font-semibold text-sm text-foreground">
                                                    {inv.invoiceNumber ?? `INV-${inv.invoiceId}`}
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-muted-foreground">{period}</td>
                                                <td className="px-5 py-3.5 text-sm font-semibold text-foreground">
                                                    LKR {(inv.totalAmount ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge(inv.status)}`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <button
                                                        onClick={() => navigate(`/client/invoices/${inv.invoiceId}`)}
                                                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <Download className="h-4 w-4 text-muted-foreground" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Need Assistance Banner ── */}
            <section className="relative rounded-2xl p-7 overflow-hidden" style={{ background: "linear-gradient(to right, #111827, #1f2937)" }}>
                <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute right-28 -top-8 h-28 w-28 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div>
                        <h3 className="text-xl font-black text-white">Need Assistance?</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-1">
                            Our dedicated support team is available 24/7 to help with your security configurations or billing queries.
                        </p>
                    </div>
                    <a
                        href="tel:0114848177"
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl transition-all shrink-0 text-sm shadow-lg shadow-primary/20"
                    >
                        <Phone className="h-4 w-4" /> Contact Support
                    </a>
                </div>
            </section>

            {/* ── Service Feedback ── */}
            <section className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Star className="h-5 w-5 text-amber-500" />
                        </span>
                        <div>
                            <h3 className="font-bold text-sm text-foreground">Service Feedback</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Help us improve — share your experience this month.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            to="/client/feedback"
                            className="text-xs text-muted-foreground hover:text-foreground font-semibold border border-border px-4 py-2 rounded-xl hover:bg-muted transition-all"
                        >
                            View History
                        </Link>
                        <Link
                            to="/client/feedback"
                            className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-xs hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
                        >
                            <Star className="h-3.5 w-3.5" /> Give Feedback
                        </Link>
                    </div>
                </div>
            </section>

            {showChangePassword && (
                <ChangePasswordModal
                    clientId={data.clientId}
                    onClose={() => {
                        setShowChangePassword(false);
                        localStorage.setItem("isFirstLogin", "false");
                    }}
                />
            )}

            {showActiveOfficersModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                            <h4 className="text-sm font-black text-foreground">Active Officers</h4>
                            <div className="flex items-center gap-3">
                                {selectedOfficerProfile && (
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                        onClick={() => {
                                            setSelectedOfficerId(null);
                                            setSelectedOfficerProfile(null);
                                            setSelectedOfficerError("");
                                        }}
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" /> Back to list
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                                    onClick={closeActiveOfficerModal}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
                            {selectedOfficerLoading ? (
                                <div className="space-y-3 animate-pulse">
                                    <div className="h-16 rounded-xl bg-muted/60" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div className="h-14 rounded-lg bg-muted/50" />
                                        <div className="h-14 rounded-lg bg-muted/50" />
                                        <div className="h-14 rounded-lg bg-muted/50" />
                                        <div className="h-14 rounded-lg bg-muted/50" />
                                    </div>
                                </div>
                            ) : selectedOfficerError ? (
                                <p className="text-sm text-red-500 dark:text-red-400">{selectedOfficerError}</p>
                            ) : selectedOfficerProfile ? (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Officer Profile</p>
                                                <h5 className="text-lg font-black text-foreground mt-1">{selectedOfficerProfile.fullName || "Unnamed Officer"}</h5>
                                                <p className="text-xs text-muted-foreground mt-0.5">{selectedOfficerProfile.designation || "Security Officer"}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${selectedOfficerProfile.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                                                {selectedOfficerProfile.active ? "ACTIVE" : "INACTIVE"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div className="rounded-lg border border-border/40 px-3 py-2.5">
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold flex items-center gap-1"><User className="h-3.5 w-3.5" /> Officer ID</p>
                                            <p className="text-sm font-semibold text-foreground mt-1">{selectedOfficerProfile.id}</p>
                                        </div>
                                        <div className="rounded-lg border border-border/40 px-3 py-2.5">
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Designation</p>
                                            <p className="text-sm font-semibold text-foreground mt-1">{selectedOfficerProfile.designation || "—"}</p>
                                        </div>
                                        <div className="rounded-lg border border-border/40 px-3 py-2.5">
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Assigned Company</p>
                                            <p className="text-sm font-semibold text-foreground mt-1">{selectedOfficerProfile.assignedCompany || "—"}</p>
                                        </div>
                                        <div className="rounded-lg border border-border/40 px-3 py-2.5">
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Assigned Area</p>
                                            <p className="text-sm font-semibold text-foreground mt-1">{selectedOfficerProfile.assignedArea || "—"}</p>
                                        </div>
                                        <div className="rounded-lg border border-border/40 px-3 py-2.5">
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Mobile</p>
                                            <p className="text-sm font-semibold text-foreground mt-1">{selectedOfficerProfile.mobileNumber || "—"}</p>
                                        </div>
                                        <div className="rounded-lg border border-border/40 px-3 py-2.5">
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</p>
                                            <p className="text-sm font-semibold text-foreground mt-1 break-all">{selectedOfficerProfile.email || "—"}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : assignmentsLoading ? (
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-10 rounded-lg bg-muted/60" />
                                    <div className="h-10 rounded-lg bg-muted/60" />
                                    <div className="h-10 rounded-lg bg-muted/60" />
                                    <div className="h-10 rounded-lg bg-muted/60" />
                                </div>
                            ) : (
                                <>
                                    <div className="mb-3">
                                        <input
                                            value={officerSearch}
                                            onChange={(e) => setOfficerSearch(e.target.value)}
                                            placeholder="Search by name, designation, or ID"
                                            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                    {filteredActiveAssignments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No officers match your search.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {filteredActiveAssignments.map((officer) => (
                                                <li key={officer.assignmentId}>
                                                    <button
                                                        type="button"
                                                        onClick={() => openOfficerProfileInModal(officer.officerId)}
                                                        className={`w-full text-left flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${selectedOfficerId === officer.officerId ? "border-primary/50 bg-primary/5" : "border-border/40 bg-card hover:bg-muted/60"}`}
                                                    >
                                                        <p className="text-sm font-semibold text-foreground">{officer.officerName}</p>
                                                        <span className="text-[11px] font-semibold text-muted-foreground text-right">{officerDesignations[officer.officerId] || "—"}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;
