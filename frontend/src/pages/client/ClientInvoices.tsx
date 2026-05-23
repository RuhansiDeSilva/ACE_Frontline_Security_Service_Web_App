import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { invoiceApi } from "@/lib/api";
import type { Invoice } from "@/lib/client";
import {
    Search, Download, Eye, TrendingUp, TrendingDown, FileText,
    ChevronLeft, ChevronRight, CloudUpload
} from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const statusBadge = (s: string) => {
    const m: Record<string, string> = {
        PAID: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
        PENDING: "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
        ISSUED: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
        OVERDUE: "bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
        DRAFT: "bg-gray-100 text-gray-500 border border-gray-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
        APPROVED: "bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30",
        PAYMENT_UPLOADED: "bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30",
        PAYMENT_REJECTED: "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30",
        WAIVED: "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
        DISPUTED: "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30",
        CANCELLED: "bg-gray-200 text-gray-500 border border-gray-300 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
    };
    return m[s] ?? "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30";
};

// Human-readable labels for statuses
const statusLabel = (s: string) => {
    const m: Record<string, string> = {
        PAYMENT_UPLOADED: "Proof Submitted",
        PAYMENT_REJECTED: "Proof Rejected",
    };
    return m[s] ?? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");
};

const PAGE_SIZE = 8;

const downloadBlobFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

const ClientInvoices = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<string>("ALL");
    const [page, setPage] = useState(1);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const clientIdRaw = localStorage.getItem("clientId");
    const clientId = clientIdRaw ? Number(clientIdRaw) : 0;
    const companyName = localStorage.getItem("companyName") ?? "Client";

    useEffect(() => {
        if (!token || !clientIdRaw) {
            setErr("Please log in as a client to view invoices.");
            setInvoices([]);
            setLoading(false);
            return;
        }
        (async () => {
            try {
                setErr("");
                const data = await invoiceApi.getByClient(clientId);
                setInvoices(data);
            } catch (e: any) {
                setErr(e?.message ?? "Failed to load invoices");
            } finally {
                setLoading(false);
            }
        })();
    }, [token, clientIdRaw, clientId]);

    const totalOutstanding = useMemo(() =>
        invoices.filter(i => i.status !== "PAID" && i.status !== "WAIVED")
            .reduce((s, i) => s + (i.balanceAmount ?? i.totalAmount ?? 0), 0), [invoices]);

    const totalPaidThisYear = useMemo(() => {
        const yr = new Date().getFullYear();
        return invoices
            .filter(i => i.status === "PAID" && (i.billingYear === yr || new Date(i.issueDate ?? "").getFullYear() === yr))
            .reduce((s, i) => s + (i.totalAmount ?? 0), 0);
    }, [invoices]);

    const settledCount = useMemo(() => invoices.filter(i => i.status === "PAID").length, [invoices]);
    const avgMonthlyBill = useMemo(() =>
        invoices.length ? invoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0) / invoices.length : 0,
        [invoices]);

    const filtered = useMemo(() => {
        let list = [...invoices];
        if (filter !== "ALL") list = list.filter(i => i.status === filter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(i =>
                (i.invoiceNumber ?? "").toLowerCase().includes(q) ||
                `${MONTHS[(i.billingMonth ?? 1) - 1]} ${i.billingYear}`.toLowerCase().includes(q)
            );
        }
        return list.sort((a, b) => (b.billingYear ?? 0) - (a.billingYear ?? 0) || (b.billingMonth ?? 0) - (a.billingMonth ?? 0));
    }, [invoices, filter, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleDownload = async (invoiceId: number) => {
        try {
            const blob = await invoiceApi.downloadPdf(invoiceId);
            downloadBlobFile(blob, `invoice-${invoiceId}.pdf`);
        } catch {
            alert("Could not download PDF.");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading invoices…</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pt-2">

            <div>
                <h1 className="text-2xl font-black text-foreground">My Invoices</h1>
                <p className="text-sm text-muted-foreground mt-0.5">View and manage all your billing statements</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl shadow-sm border border-red-100 dark:border-red-500/20 p-5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Total Outstanding</p>
                    <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                        LKR {totalOutstanding.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-xs text-red-600 font-semibold">+12.5% from last month</span>
                    </div>
                </div>
                <div className="bg-card dark:bg-emerald-500/10 rounded-2xl shadow-sm border border-border dark:border-emerald-500/20 p-5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Total Paid This Year</p>
                    <p className="text-2xl font-black text-foreground mt-1">
                        LKR {totalPaidThisYear.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xs text-emerald-600 font-semibold">{settledCount} invoices settled</span>
                    </div>
                </div>
                <div className="bg-card dark:bg-blue-500/10 rounded-2xl shadow-sm border border-border dark:border-blue-500/20 p-5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Average Monthly Bill</p>
                    <p className="text-2xl font-black text-foreground mt-1">
                        LKR {avgMonthlyBill.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-semibold">-2.1% from last month</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-2xl shadow-sm border border-border/60 p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search invoice # or period…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {["ALL", "ISSUED", "PAYMENT_UPLOADED", "PAYMENT_REJECTED", "PAID", "OVERDUE", "WAIVED"].map(s => (
                            <button
                                key={s}
                                onClick={() => { setFilter(s); setPage(1); }}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${filter === s
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    }`}
                            >
                                {s === "ALL" ? "All" : statusLabel(s)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {err && <p className="text-red-600 dark:text-red-400 text-sm">{err}</p>}

            {/* Table */}
            <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/40 border-b border-border/50">
                            <tr className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                <th className="px-6 py-3 text-center">Invoice #</th>
                                <th className="px-6 py-3 text-center">Period</th>
                                <th className="px-6 py-3 text-center">Issue Date</th>
                                <th className="px-6 py-3 text-center">Due Date</th>
                                <th className="px-6 py-3 text-center">Amount (LKR)</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                                <FileText className="h-8 w-8 text-muted-foreground opacity-50" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground mb-1">No Invoices Found</h3>
                                            <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                                                Everything looks clear. When new invoices are issued for your account, they will appear here.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginated.map(inv => {
                                const period = `${MONTHS[(inv.billingMonth ?? 1) - 1]} ${inv.billingYear ?? ""}`;
                                return (
                                    <tr key={inv.invoiceId}
                                        onClick={() => navigate(`/client/invoices/${inv.invoiceId}`)}
                                        className="hover:bg-muted/30 transition-colors cursor-pointer">
                                        <td className="px-6 py-3 font-semibold text-sm text-foreground text-center">
                                            {inv.invoiceNumber ?? `INV-${inv.invoiceId}`}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-muted-foreground text-center">{period}</td>
                                        <td className="px-6 py-3 text-sm text-muted-foreground text-center">
                                            {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString("en-LK") : "—"}
                                        </td>
                                        <td className={`px-6 py-3 text-sm font-medium text-center ${inv.status === "OVERDUE" ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-LK") : "—"}
                                        </td>
                                        <td className="px-6 py-3 text-sm font-semibold text-foreground text-center">
                                            {(inv.totalAmount ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${statusBadge(inv.status)}`}>
                                                {statusLabel(inv.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {(inv.status === "ISSUED" || inv.status === "PAYMENT_REJECTED" || inv.status === "OVERDUE") && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/client/invoices/${inv.invoiceId}/upload-proof`);
                                                        }}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-all"
                                                        title="Upload Payment Proof"
                                                    >
                                                        <CloudUpload className="h-3 w-3" />
                                                        Upload
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(inv.invoiceId);
                                                    }}
                                                    className="p-1.5 border border-border rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                                    title="Download"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-border/40">
                        <p className="text-xs text-muted-foreground">
                            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-7 h-7 text-xs rounded-lg font-semibold transition-all ${p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted/80 text-muted-foreground"}`}>
                                    {p}
                                </button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientInvoices;
