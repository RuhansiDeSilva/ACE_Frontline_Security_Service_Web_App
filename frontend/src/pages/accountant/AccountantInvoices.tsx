import { useEffect, useState, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { downloadInvoicePdf } from "@/utils/downloadInvoicePdf";
import { invoiceApi } from "@/lib/api";
import {
    FileText, Download, ChevronDown, ChevronUp, Plus,
    AlertCircle, CheckCircle, Clock, XCircle,
    Zap, LayoutList, RefreshCw, Eye, Trash2,
    CheckSquare, Square, DollarSign, Search, Filter
} from "lucide-react";

// ── Types (same shape as backend InvoiceResponse) ─────────────────────────────

type InvoiceItem = {
    itemId?: number;
    itemType?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    taxPercentage?: number;
    lineTotal?: number;
};

type PaymentRecord = {
    paymentId?: number;
    amountPaid?: number;
    paymentDate?: string;
    paymentMethod?: string;
    verificationStatus?: string;
    transactionReference?: string;
};

type Invoice = {
    invoiceId: number;
    invoiceNumber: string;
    clientId?: number;
    companyName?: string;
    billingMonth?: number;
    billingYear?: number;
    periodFrom?: string;
    periodTo?: string;
    issueDate?: string;
    dueDate?: string;
    subtotal?: number;
    deductionsTotal?: number;
    invoiceAmount?: number;
    ssclAmount?: number;
    vatAmount?: number;
    taxAmount?: number;
    totalAmount?: number;
    paidAmount?: number;
    balanceAmount?: number;
    status?: string;
    invoiceType?: string;
    notes?: string;
    manualReason?: string;
    issuedAt?: string;
    items?: InvoiceItem[];
    payments?: PaymentRecord[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTHS = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
    });
};

const formatLKR = (n: number) =>
    `LKR ${(n ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

const statusConfig: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30" },
    APPROVED: { label: "Approved", cls: "bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30" },
    ISSUED: { label: "Issued", cls: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30" },
    PENDING: { label: "Pending", cls: "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30" },
    PAYMENT_UPLOADED: { label: "Verifying", cls: "bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30" },
    PAYMENT_REJECTED: { label: "Proof Rejected", cls: "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30" },
    VERIFICATION_PENDING: { label: "Verifying", cls: "bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30" },
    PAID: { label: "Paid", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30" },
    OVERDUE: { label: "Overdue", cls: "bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30" },
    DISPUTED: { label: "Disputed", cls: "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30" },
    WAIVED: { label: "Waived", cls: "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30" },
    CANCELLED: { label: "Cancelled", cls: "bg-gray-200 text-gray-500 border border-gray-300 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30" },
};

const statusFilterOptions = [
    "ALL",
    "DRAFT",
    "APPROVED",
    "ISSUED",
    "PAYMENT_UPLOADED",
    "PAYMENT_REJECTED",
    "PAID",
    "OVERDUE",
    "DISPUTED",
    "WAIVED",
    "CANCELLED",
] as const;

// ── Main Component ─────────────────────────────────────────────────────────────

interface AccountantInvoicesProps {
    onCreateClick?: () => void;
    onQueueClick?: () => void;
    onReviewClick?: (id: number) => void;
    activeTab?: "list" | "queue";
    onTabChange?: (tab: "list" | "queue") => void;
}

const AccountantInvoices = ({
    onCreateClick,
    onQueueClick,
    onReviewClick,
    activeTab: activeTabProp = "list",
    onTabChange
}: AccountantInvoicesProps) => {
    const navigate = useNavigate();
    const [activeTabInternal, setActiveTabInternal] = useState<"list" | "queue">(activeTabProp);

    // Support both controlled and uncontrolled usage
    const activeTab = onTabChange ? activeTabProp : activeTabInternal;

    const handleTabChange = (tab: "list" | "queue") => {
        if (!onTabChange) setActiveTabInternal(tab);
        onTabChange?.(tab);
    };


    // ── All Invoices state ─────────────────────────────────────────────────────
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState<number | null>(null);
    const [downloading, setDownloading] = useState<number | null>(null);
    const [dlError, setDlError] = useState("");
    const [actionMsg, setActionMsg] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterMonth, setFilterMonth] = useState("ALL");
    const [filterYear, setFilterYear] = useState("ALL");

    // ── Queue state ────────────────────────────────────────────────────────────
    const [queueInvoices, setQueueInvoices] = useState<Invoice[]>([]);
    const [queueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [approvingBatch, setApprovingBatch] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [queueMsg, setQueueMsg] = useState("");
    const [queueSearch, setQueueSearch] = useState("");

    // ── Fetch all invoices ─────────────────────────────────────────────────────
    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const data = await invoiceApi.getAll();
            setInvoices(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load invoices");
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch DRAFT invoices for queue ─────────────────────────────────────────
    const fetchQueue = async () => {
        setQueueLoading(true);
        setQueueError("");
        try {
            const data = await invoiceApi.getDraft();
            setQueueInvoices(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setQueueError(e?.message ?? "Failed to load invoice queue");
        } finally {
            setQueueLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, []);

    useEffect(() => {
        if (activeTab === "queue") fetchQueue();
    }, [activeTab]);

    // ── Download PDF ──────────────────────────────────────────────────────────
    const handleDownload = async (inv: Invoice) => {
        setDownloading(inv.invoiceId);
        setDlError("");
        try {
            await downloadInvoicePdf(inv.invoiceId, inv.invoiceNumber);
        } catch (e: any) {
            setDlError(`Download failed: ${e?.message}`);
        } finally {
            setDownloading(null);
        }
    };

    // ── Delete draft ──────────────────────────────────────────────────────────
    const handleDeleteDraft = async (invoiceId: number) => {
        if (!confirm("Delete this draft invoice? This cannot be undone.")) return;
        try {
            await invoiceApi.deleteDraft(invoiceId);
            setQueueMsg("Draft deleted.");
            fetchQueue();
        } catch (e: any) {
            setQueueError(`Delete failed: ${e?.message}`);
        }
    };

    // ── Batch approve-and-issue ────────────────────────────────────────────────
    const handleApproveBatch = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Approve and issue ${selectedIds.size} selected invoice(s)?`)) return;
        setApprovingBatch(true);
        setQueueMsg("");
        try {
            await invoiceApi.approveBatch(Array.from(selectedIds));
            setQueueMsg(`${selectedIds.size} invoice(s) approved and issued.`);
            setSelectedIds(new Set());
            fetchQueue();
            fetchInvoices();
        } catch (e: any) {
            setQueueError(`Batch approval failed: ${e?.message}`);
        } finally {
            setApprovingBatch(false);
        }
    };

    // ── Generate monthly invoices ──────────────────────────────────────────────
    const handleGenerateMonthly = async () => {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        if (!confirm(`Generate invoices for all active clients for ${MONTHS[month]} ${year}?`)) return;
        setGenerating(true);
        setQueueMsg("");
        try {
            await invoiceApi.generateMonthly(month, year);
            setQueueMsg(`Monthly invoices generated for ${MONTHS[month]} ${year}. Review them below.`);
            fetchQueue();
            fetchInvoices();
        } catch (e: any) {
            setQueueError(`Generation failed: ${e?.message}`);
        } finally {
            setGenerating(false);
        }
    };

    // ── Filter ─────────────────────────────────────────────────────────────────
    const years = [...new Set(invoices.map((i) => i.billingYear))].sort((a, b) => b - a);
    const filteredInvoices = invoices.filter((inv) => {
        const matchStatus = filterStatus === "ALL" || inv.status === filterStatus;
        const matchSearch =
            inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.companyName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchMonth = filterMonth === "ALL" || String(inv.billingMonth) === filterMonth;
        const matchYear = filterYear === "ALL" || String(inv.billingYear) === filterYear;
        return matchStatus && matchSearch && matchMonth && matchYear;
    }).sort((a, b) => {
        const taRaw = Date.parse(b.issuedAt || b.issueDate || b.periodTo || "");
        const tbRaw = Date.parse(a.issuedAt || a.issueDate || a.periodTo || "");
        const ta = Number.isNaN(taRaw) ? 0 : taRaw;
        const tb = Number.isNaN(tbRaw) ? 0 : tbRaw;
        const dateCmp = ta - tb;
        if (dateCmp !== 0) return dateCmp;
        const ymCmp = (b.billingYear * 100 + b.billingMonth) - (a.billingYear * 100 + a.billingMonth);
        if (ymCmp !== 0) return ymCmp;
        return b.invoiceId - a.invoiceId;
    });

    const filteredQueue = queueInvoices.filter((inv) =>
        inv.invoiceNumber.toLowerCase().includes(queueSearch.toLowerCase()) ||
        inv.companyName.toLowerCase().includes(queueSearch.toLowerCase())
    ).sort((a, b) =>
        ((b.billingYear ?? 0) * 100 + (b.billingMonth ?? 0)) - ((a.billingYear ?? 0) * 100 + (a.billingMonth ?? 0))
        || (b.invoiceId - (a.invoiceId ?? 0))
    );

    // ── Summary stats ──────────────────────────────────────────────────────────
    const totalRevenue = invoices.filter((i) => i.status !== "CANCELLED").reduce((s, i) => s + (i.totalAmount ?? 0), 0);
    const totalOutstanding = invoices.filter((i) => ["ISSUED", "PENDING", "OVERDUE", "PAYMENT_UPLOADED"].includes(i.status))
        .reduce((s, i) => s + (i.balanceAmount ?? 0), 0);
    const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;
    const draftCount = invoices.filter((i) => i.status === "DRAFT").length;

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredQueue.length && filteredQueue.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredQueue.map((i) => i.invoiceId)));
        }
    };

    if (loading && activeTab === "list") return (
        <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading invoices…</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-5 px-6">

            {/* ── Page header ── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-black text-foreground">Invoice Management</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage, review and issue all client invoices
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {draftCount > 0 && (
                        <span className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50
                                         text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                            {draftCount} draft{draftCount > 1 ? "s" : ""} pending review
                        </span>
                    )}
                    <button
                        onClick={onCreateClick}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black text-sm font-black rounded-xl hover:bg-yellow-500 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Create Invoice
                    </button>

                </div>
            </div>

            {/* ── Summary cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Invoices", value: invoices.length, color: "text-foreground", bg: "bg-card dark:bg-blue-500/10", border: "border-border dark:border-blue-500/20", icon: <FileText className="h-4 w-4 text-blue-500" /> },
                    { label: "Total Revenue", value: formatLKR(totalRevenue), color: "text-foreground", bg: "bg-card dark:bg-emerald-500/10", border: "border-border dark:border-emerald-500/20", icon: <DollarSign className="h-4 w-4 text-emerald-500" /> },
                    { label: "Outstanding", value: formatLKR(totalOutstanding), color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-100 dark:border-red-500/20", icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
                    { label: "Overdue", value: overdueCount, color: overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground", bg: overdueCount > 0 ? "bg-red-50 dark:bg-orange-500/10" : "bg-card dark:bg-amber-500/10", border: overdueCount > 0 ? "border-red-100 dark:border-orange-500/20" : "border-border dark:border-amber-500/20", icon: <Clock className="h-4 w-4 text-amber-500" /> },
                ].map((s) => (
                    <div key={s.label} className={`rounded-2xl border p-4 shadow-sm transition-all ${s.bg} ${s.border}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-background/50 dark:bg-background/20">
                                {s.icon}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
                        </div>
                        <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Tab bar ── */}
            <div className="border-b">
                <div className="flex gap-0">
                    <button
                        onClick={() => handleTabChange("list")}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "list"
                            ? "border-yellow-400 text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <LayoutList className="w-4 h-4 pointer-events-none" />
                        All Invoices
                    </button>
                    <button
                        onClick={() => {
                            handleTabChange("queue");
                            onQueueClick?.();
                        }}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "queue"
                            ? "border-yellow-400 text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Clock className="w-4 h-4 pointer-events-none" />
                        Invoice Queue
                        {draftCount > 0 && (
                            <span className="bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full pointer-events-none">
                                {draftCount}
                            </span>
                        )}
                    </button>

                </div>
            </div>

            {/* ── Global Alerts ── */}
            {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3 flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
            )}
            {dlError && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3 flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {dlError}
                </div>
            )}
            {actionMsg && (
                <div className="rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm p-3 flex gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> {actionMsg}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ALL INVOICES TAB                                                   */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === "list" && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <input
                            type="text"
                            placeholder="Search by invoice number or client…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 min-w-56 border rounded-xl px-3 py-2 text-sm
                                       focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {statusFilterOptions.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${filterStatus === s
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}
                                >
                                    {s === "ALL" ? "All" : (statusConfig[s]?.label ?? s)}
                                </button>
                            ))}
                        </div>
                        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
                            className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                            <option value="ALL">All Months</option>
                            {MONTHS.slice(1).map((m, i) => (
                                <option key={i + 1} value={String(i + 1)}>{m}</option>
                            ))}
                        </select>
                        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                            className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                            <option value="ALL">All Years</option>
                            {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                        </select>
                        <button
                            onClick={fetchInvoices}
                            className="flex items-center gap-1.5 border border-border rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {filteredInvoices.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No invoices found</p>
                            <p className="text-sm mt-1">Try adjusting your filters or create a new invoice.</p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b">
                                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-left">Invoice #</th>
                                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-left">Client</th>
                                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-center hidden md:table-cell">Period</th>
                                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-center">Status</th>
                                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-right">Total</th>
                                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-right hidden sm:table-cell">Balance</th>
                                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredInvoices.map((inv) => {
                                            const sc = statusConfig[inv.status] ?? statusConfig["DRAFT"];
                                            const open = expanded === inv.invoiceId;
                                            const isDraft = inv.status === "DRAFT" || inv.status === "APPROVED";
                                            return (
                                                <Fragment key={inv.invoiceId}>
                                                    <tr
                                                        onClick={() => {
                                                            if (onReviewClick) onReviewClick(inv.invoiceId);
                                                            else navigate(`/accountant/invoices/review/${inv.invoiceId}`);
                                                        }}
                                                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${inv.status === "OVERDUE" ? "bg-red-50/30 dark:bg-red-500/10" :
                                                            inv.status === "DRAFT" ? "bg-yellow-50/20 dark:bg-yellow-500/10" : ""
                                                            }`}>

                                                        <td className="px-4 py-3 font-bold whitespace-nowrap text-left">{inv.invoiceNumber}</td>
                                                        <td className="px-4 py-3 text-left">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-black text-xs shrink-0">
                                                                    {(inv.companyName || "?").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
                                                                </div>
                                                                <span className="font-medium text-sm whitespace-nowrap">{inv.companyName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground text-sm hidden md:table-cell whitespace-nowrap text-center">
                                                            {inv.billingMonth ? `${MONTHS[inv.billingMonth]} ${inv.billingYear}` : formatDate(inv.periodFrom)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${sc.cls}`}>
                                                                {sc.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-sm whitespace-nowrap">{formatLKR(inv.totalAmount ?? 0)}</td>
                                                        <td className="px-4 py-3 text-right hidden sm:table-cell whitespace-nowrap">
                                                            {(inv.balanceAmount ?? 0) > 0
                                                                ? <span className="text-red-600 font-semibold text-sm">{formatLKR(inv.balanceAmount)}</span>
                                                                : <span className="text-green-600 text-xs font-medium">Paid</span>
                                                            }
                                                        </td>
                                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                            <div className="flex items-center justify-end gap-1">
                                                                {/* Expand/Collapse */}
                                                                <button
                                                                    onClick={() => setExpanded(open ? null : inv.invoiceId)}
                                                                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-500"
                                                                    title={open ? "Collapse" : "View details"}
                                                                >
                                                                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                </button>
                                                                {/* Download */}
                                                                <button
                                                                    onClick={() => handleDownload(inv)}
                                                                    disabled={downloading === inv.invoiceId}
                                                                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-50"
                                                                    title="Download PDF"
                                                                >
                                                                    {downloading === inv.invoiceId
                                                                        ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                                                                        : <Download className="w-4 h-4" />
                                                                    }
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded detail row */}
                                                    {open && (
                                                        <tr key={`${inv.invoiceId}-detail`}>
                                                            <td colSpan={7} className="bg-muted/20 px-6 py-5 border-b">
                                                                <div className="space-y-4">
                                                                    {/* Line items */}
                                                                    <div>
                                                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Line Items</p>
                                                                        <div className="rounded-xl border overflow-hidden">
                                                                            <table className="w-full text-sm">
                                                                                <thead>
                                                                                    <tr className="bg-muted/50 border-b">
                                                                                        <th className="text-left px-3 py-2 text-xs font-semibold uppercase">Description</th>
                                                                                        <th className="text-right px-3 py-2 text-xs font-semibold uppercase">Qty</th>
                                                                                        <th className="text-right px-3 py-2 text-xs font-semibold uppercase">Unit Price</th>
                                                                                        <th className="text-right px-3 py-2 text-xs font-semibold uppercase">Total</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {(inv.items ?? []).map((item, idx) => (
                                                                                        <tr key={item.itemId ?? idx} className={`border-b last:border-0 ${idx % 2 === 1 ? "bg-muted/10" : ""}`}>
                                                                                            <td className="px-3 py-2">{item.description}</td>
                                                                                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                                                                                            <td className="px-3 py-2 text-right">{formatLKR(Number(item.unitPrice ?? 0))}</td>
                                                                                            <td className="px-3 py-2 text-right font-semibold">{formatLKR(Number(item.lineTotal ?? 0))}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>

                                                                    {/* Totals + notes side by side */}
                                                                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                                                                        <div className="space-y-2">
                                                                            {inv.notes && (
                                                                                <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-sm max-w-sm">
                                                                                    <span className="font-semibold text-yellow-800">Note: </span>
                                                                                    <span className="text-yellow-700">{inv.notes}</span>
                                                                                </div>
                                                                            )}
                                                                            {inv.manualReason && (
                                                                                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm max-w-sm">
                                                                                    <span className="font-semibold text-blue-800">Reason: </span>
                                                                                    <span className="text-blue-700">{inv.manualReason}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="w-full max-w-xs space-y-1 text-sm ml-auto">
                                                                            <div className="flex justify-between font-bold">
                                                                                <span>Total</span><span>{formatLKR(inv.totalAmount ?? 0)}</span>
                                                                            </div>
                                                                            <div className={`border-t pt-1 flex justify-between font-bold text-base ${(inv.balanceAmount ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                                                                                <span>Balance Due</span>
                                                                                <span>{formatLKR(inv.balanceAmount ?? 0)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {filteredInvoices.length > 0 && (
                        <p className="text-xs text-muted-foreground text-center">
                            Showing {filteredInvoices.length} of {invoices.length} invoices
                        </p>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* INVOICE QUEUE TAB                                                  */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === "queue" && (
                <div className="space-y-4">
                    {/* Queue header actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="font-bold text-lg text-foreground">Draft Invoice Queue</h3>
                            <p className="text-sm text-muted-foreground">
                                Review and approve draft invoices before issuing to clients
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={handleGenerateMonthly}
                                disabled={generating}
                                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-yellow-400 text-yellow-700 hover:bg-yellow-50 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                                {generating ? (
                                    <span className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Zap className="w-4 h-4" />
                                )}
                                {generating ? "Generating…" : "Generate Invoices"}
                            </button>
                            <button
                                onClick={() => fetchQueue()}
                                className="flex items-center gap-1.5 border border-border rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleApproveBatch}
                                disabled={selectedIds.size === 0 || approvingBatch}
                                className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black font-black text-sm rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50"
                            >
                                {approvingBatch ? (
                                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <CheckSquare className="w-4 h-4" />
                                )}
                                {approvingBatch ? "Approving…" : `Approve Selected${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
                            </button>
                        </div>
                    </div>

                    {/* Queue alerts */}
                    {queueError && (
                        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3 flex gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {queueError}
                        </div>
                    )}
                    {queueMsg && (
                        <div className="rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm p-3 flex gap-2">
                            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> {queueMsg}
                        </div>
                    )}

                    {/* Queue search */}
                    <input
                        type="text"
                        placeholder="Filter by invoice number or client name…"
                        value={queueSearch}
                        onChange={(e) => setQueueSearch(e.target.value)}
                        className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />

                    {/* Queue stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-card rounded-xl border border-border/60 p-3 text-center">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Drafts</p>
                            <p className="text-2xl font-black mt-1 text-foreground">{queueInvoices.length}</p>
                        </div>
                        <div className="bg-card rounded-xl border border-border/60 p-3 text-center">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total Amount</p>
                            <p className="text-xl font-black mt-1 text-primary">{formatLKR(queueInvoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0))}</p>
                        </div>
                        <div className="bg-card rounded-xl border border-border/60 p-3 text-center">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Auto-Generated</p>
                            <p className="text-2xl font-black mt-1 text-foreground">{queueInvoices.filter((i) => i.invoiceType === "AUTO").length}</p>
                        </div>
                    </div>

                    {queueLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-7 h-7 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredQueue.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-2xl">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No draft invoices in queue</p>
                            <p className="text-sm mt-1">
                                Text Click <strong>Generate Invoices</strong> to auto-generate for all active clients,
                                or <button onClick={onCreateClick} className="text-yellow-600 font-semibold underline">create one manually</button>.
                            </p>

                        </div>
                    ) : (
                        <div className="rounded-2xl border shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b">
                                            <th className="px-4 py-3 w-10">
                                                <button onClick={toggleAll} className="flex items-center justify-center">
                                                    {selectedIds.size === filteredQueue.length && filteredQueue.length > 0
                                                        ? <CheckSquare className="w-4 h-4 text-yellow-600" />
                                                        : <Square className="w-4 h-4 text-muted-foreground" />
                                                    }
                                                </button>
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide">Invoice #</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide">Client</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide hidden md:table-cell">Period</th>
                                            <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide">Total</th>
                                            <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wide hidden sm:table-cell">Type</th>
                                            <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wide">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredQueue.map((inv) => (
                                            <tr key={inv.invoiceId}
                                                className={`transition-colors hover:bg-muted/30 ${selectedIds.has(inv.invoiceId) ? "bg-yellow-50" : ""}`}>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => toggleSelect(inv.invoiceId)}>
                                                        {selectedIds.has(inv.invoiceId)
                                                            ? <CheckSquare className="w-4 h-4 text-yellow-600" />
                                                            : <Square className="w-4 h-4 text-muted-foreground" />
                                                        }
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 font-bold text-sm">{inv.invoiceNumber}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-black text-xs shrink-0">
                                                            {(inv.companyName || "?").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-sm">{inv.companyName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground text-sm hidden md:table-cell">
                                                    {inv.billingMonth ? `${MONTHS[inv.billingMonth]} ${inv.billingYear}` : formatDate(inv.periodFrom)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-sm">{formatLKR(inv.totalAmount ?? 0)}</td>
                                                <td className="px-4 py-3 text-center hidden sm:table-cell">
                                                    {inv.invoiceType === "AUTO" ? (
                                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                                            <Zap className="w-3 h-3" /> Auto
                                                        </span>
                                                    ) : (
                                                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                                            Manual
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => {
                                                                if (onReviewClick) onReviewClick(inv.invoiceId);
                                                                else navigate(`/accountant/invoices/review/${inv.invoiceId}`);
                                                            }}
                                                            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            Review
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteDraft(inv.invoiceId)}
                                                            className="p-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete draft"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Floating batch action bar */}
                    {selectedIds.size > 0 && (
                        <div className="fixed bottom-6 left-64 right-0 z-50 flex justify-center pointer-events-none">
                            <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4 pointer-events-auto">
                                <span className="text-sm font-semibold">{selectedIds.size} Selected</span>
                                <button onClick={() => setSelectedIds(new Set())} className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Clear
                                </button>
                                <button
                                    onClick={handleApproveBatch}
                                    disabled={approvingBatch}
                                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-black text-sm px-5 py-2 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {approvingBatch ? "Approving…" : `Approve & Issue (${selectedIds.size})`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AccountantInvoices;
