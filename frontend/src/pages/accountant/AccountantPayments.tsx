import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { paymentApi } from "@/lib/api";
import {
    CheckCircle2, Clock, AlertTriangle, Search,
    ChevronLeft, ChevronRight, FileText, Eye,
    TrendingUp, DollarSign, RefreshCw, ShieldCheck, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";

const PAGE_SIZE = 10;

const verificationBadge = (s: string) => {
    const m: Record<string, string> = {
        VERIFIED: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
        PENDING: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
        REJECTED: "bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
    };
    return m[s] ?? "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30";
};

const formatLKR = (n: number) => `LKR ${n.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

const timeAgo = (iso: string | null) => {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return "Just now";
};

interface AccountantPaymentsProps {
    onVerifyClick?: (paymentId: number) => void;
}

const AccountantPayments = ({ onVerifyClick }: AccountantPaymentsProps) => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [payments, setPayments] = useState<any[]>([]);
    const [pending, setPending] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [tab, setTab] = useState<"queue" | "history">("queue");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [page, setPage] = useState(1);

    const handleAction = async (action: string, successMessage: string) => {
        try {
            await api.post(`/v1/automation/${action}`);
            toast({
                title: "Success",
                description: successMessage,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: `Failed to ${action.replace(/-/g, " ")}.`,
                variant: "destructive",
            });
        }
    };

    const load = async () => {
        setLoading(true);
        try {
            const [all, pend] = await Promise.all([
                paymentApi.getAll(),
                paymentApi.getPending(),
            ]);
            setPayments(all);
            setPending(pend);
        } catch (e: any) {
            setErr(e?.message ?? "Failed to load payments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    /* ── Stats ── */
    const totalVerifiedAmount = useMemo(() =>
        payments.filter(p => p.verificationStatus === "VERIFIED")
            .reduce((s: number, p: any) => s + (p.amountPaid ?? 0), 0),
        [payments]);

    const totalPendingAmount = useMemo(() =>
        pending.reduce((s: number, p: any) => s + (p.amountPaid ?? 0), 0),
        [pending]);

    const rejectedCount = useMemo(() =>
        payments.filter(p => p.verificationStatus === "REJECTED").length,
        [payments]);

    /* ── Current list depending on tab ── */
    const activeList = tab === "queue" ? pending : payments;

    const filtered = useMemo(() => {
        let list = [...activeList];
        if (tab === "history" && statusFilter !== "ALL") {
            list = list.filter(p => p.verificationStatus === statusFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                (p.invoiceNumber ?? "").toLowerCase().includes(q) ||
                (p.companyName ?? "").toLowerCase().includes(q) ||
                (p.transactionReference ?? "").toLowerCase().includes(q)
            );
        }
        return list.sort((a: any, b: any) => {
            const taRaw = Date.parse(b.proofUploadedAt ?? b.paymentDate ?? "");
            const tbRaw = Date.parse(a.proofUploadedAt ?? a.paymentDate ?? "");
            const ta = Number.isNaN(taRaw) ? 0 : taRaw;
            const tb = Number.isNaN(tbRaw) ? 0 : tbRaw;
            return ta - tb;
        });
    }, [activeList, tab, statusFilter, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="space-y-6 px-6 pb-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Payments</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Verify client payment proofs and manage payment history</p>
                </div>
                <button onClick={load} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted/50 transition-all disabled:opacity-60">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        icon: <Clock className="h-5 w-5 text-amber-500 dark:text-amber-400" />,
                        label: "Pending Verification",
                        value: String(pending.length),
                        sub: formatLKR(totalPendingAmount),
                        bg: "bg-card dark:bg-gradient-to-br dark:from-amber-500/15 dark:to-orange-600/5",
                        border: "border-border dark:border-amber-500/20",
                        urgent: pending.length > 0
                    },
                    {
                        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />,
                        label: "Total Verified",
                        value: formatLKR(totalVerifiedAmount),
                        sub: `${payments.filter(p => p.verificationStatus === "VERIFIED").length} payments`,
                        bg: "bg-card dark:bg-gradient-to-br dark:from-emerald-500/15 dark:to-green-600/5",
                        border: "border-border dark:border-emerald-500/20",
                        urgent: false
                    },
                    {
                        icon: <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />,
                        label: "Rejected",
                        value: String(rejectedCount),
                        sub: rejectedCount > 0 ? "Client notified" : "None",
                        bg: "bg-card dark:bg-gradient-to-br dark:from-red-500/15 dark:to-rose-600/5",
                        border: "border-border dark:border-red-500/20",
                        urgent: false
                    },
                    {
                        icon: <DollarSign className="h-5 w-5 text-primary" />,
                        label: "Total Payments",
                        value: String(payments.length),
                        sub: "All time records",
                        bg: "bg-card dark:bg-gradient-to-br dark:from-blue-500/15 dark:to-indigo-600/5",
                        border: "border-border dark:border-blue-500/20",
                        urgent: false
                    },
                ].map(({ icon, label, value, sub, bg, border, urgent }) => (
                    <div key={label} className={`${bg} border ${border} rounded-2xl p-4 shadow-sm transition-all ${urgent ? "ring-2 ring-amber-400/50" : ""}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-background/50 dark:bg-background/20">
                                {icon}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                            {urgent && <span className="ml-auto text-[9px] font-black bg-amber-400 text-black px-1.5 py-0.5 rounded-full">URGENT</span>}
                        </div>
                        <p className="text-lg font-black text-foreground leading-tight">{value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                    </div>
                ))}
            </div>

            {/* Pending alert banner */}
            {pending.length > 0 && tab === "queue" && (
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">
                        <strong>{pending.length} payment{pending.length > 1 ? "s" : ""} awaiting verification.</strong>
                        {" "}Click <strong>Verify</strong> on any row to review the proof and approve or reject.
                    </p>
                </div>
            )}

            {/* Tabs & Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit border border-border/50">
                    {(["queue", "history"] as const).map(t => (
                        <button key={t} onClick={() => { setTab(t); setPage(1); setSearch(""); setStatusFilter("ALL"); }}
                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                }`}>
                            {t === "queue"
                                ? `Verification Queue${pending.length > 0 ? ` (${pending.length})` : ""}`
                                : "Payment History"
                            }
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleAction("send-payment-reminders", "Payment reminders sent.")}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Payment Reminders
                    </Button>
                    <Button variant="outline" onClick={() => handleAction("send-overdue-notices", "Overdue notices sent.")}>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Send Overdue Notices
                    </Button>
                </div>
            </div>

            {/* Search + filters */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Client, invoice # or transaction ref…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="pl-9 pr-4 py-2 text-sm border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-72 text-foreground placeholder:text-muted-foreground"
                        />
                    </div>
                    {tab === "history" && (
                        <div className="flex gap-1.5">
                            {["ALL", "PENDING", "VERIFIED", "REJECTED"].map(s => (
                                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === s
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}>
                                    {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {err && <p className="text-red-600 text-sm">{err}</p>}

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border/50 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                <th className="px-5 py-3.5 text-left">Client</th>
                                <th className="px-5 py-3.5 text-center">Invoice #</th>
                                <th className="px-5 py-3.5 text-center">Amount</th>
                                <th className="px-5 py-3.5 text-center hidden sm:table-cell">Payment Date</th>
                                <th className="px-5 py-3.5 text-center hidden md:table-cell">Transaction Ref</th>
                                <th className="px-5 py-3.5 text-center">Uploaded</th>
                                {tab === "history" && <th className="px-5 py-3.5 text-center">Status</th>}
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-16 text-center">
                                        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-16 text-center">
                                        <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm text-gray-400 font-medium">
                                            {tab === "queue" ? "No pending payments — all clear!" : "No payment records found"}
                                        </p>
                                    </td>
                                </tr>
                            ) : paginated.map((p: any) => (
                                <tr key={p.paymentId}
                                    className={`transition-colors hover:bg-muted/30 ${p.verificationStatus === "REJECTED" ? "bg-red-50/20" : ""
                                        }`}>
                                    <td className="px-5 py-4 text-left">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-black text-xs shrink-0">
                                                {(p.companyName || "?").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
                                            </div>
                                            <span className="font-medium text-sm text-foreground whitespace-nowrap">{p.companyName}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 font-bold text-sm text-foreground whitespace-nowrap text-center">
                                        {p.invoiceNumber ?? `INV-${p.invoiceId}`}
                                    </td>
                                    <td className="px-5 py-4 font-bold text-sm text-foreground whitespace-nowrap text-center">
                                        {formatLKR(p.amountPaid ?? 0)}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-muted-foreground hidden sm:table-cell text-center">
                                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-LK") : "—"}
                                    </td>
                                    <td className="px-5 py-4 text-xs font-mono text-muted-foreground hidden md:table-cell text-center">
                                        {p.transactionReference ?? "—"}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap text-center">
                                        {timeAgo(p.proofUploadedAt)}
                                    </td>
                                    {tab === "history" && (
                                        <td className="px-5 py-4 text-center">
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${verificationBadge(p.verificationStatus)}`}>
                                                {p.verificationStatus}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                if (onVerifyClick) {
                                                    onVerifyClick(p.paymentId);
                                                } else {
                                                    navigate(`/accountant/payments/${p.paymentId}`);
                                                }
                                            }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ml-auto ${tab === "queue"
                                                ? "bg-yellow-400 hover:bg-yellow-500 text-black shadow-sm"
                                                : "border border-border text-foreground hover:bg-muted/50"
                                                }`}
                                        >
                                            {tab === "queue" ? <ShieldCheck className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                            {tab === "queue" ? "Verify" : "View"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border/40">
                        <p className="text-xs text-muted-foreground">
                            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setPage(pg => Math.max(1, pg - 1))} disabled={page === 1}
                                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pg => (
                                <button key={pg} onClick={() => setPage(pg)}
                                    className={`w-7 h-7 text-xs rounded-lg font-semibold transition-all ${pg === page ? "bg-primary text-primary-foreground" : "hover:bg-muted/80 text-muted-foreground transition-colors"
                                        }`}>{pg}</button>
                            ))}
                            <button onClick={() => setPage(pg => Math.min(totalPages, pg + 1))} disabled={page === totalPages}
                                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountantPayments;
