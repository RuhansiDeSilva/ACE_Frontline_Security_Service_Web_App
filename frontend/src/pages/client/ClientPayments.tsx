import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { paymentApi, invoiceApi } from "@/lib/api";
import {
    CreditCard, CheckCircle2, Clock, AlertTriangle, Calendar,
    Search, Download, Eye, ChevronLeft, ChevronRight, FileText,
    CloudUpload, RotateCcw
} from "lucide-react";

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

/* ── Status helpers ── */
const verificationBadge = (s: string) => {
    const m: Record<string, string> = {
        VERIFIED: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
        PENDING:  "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
        REJECTED: "bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
    };
    return m[s] ?? "bg-gray-100 text-gray-500 border border-gray-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30";
};
const verificationLabel = (s: string) => {
    if (s === "VERIFIED") return "Verified";
    if (s === "REJECTED") return "Rejected";
    if (s === "PENDING")  return "Pending Review";
    return s;
};

const formatLKR = (n: number) => `LKR ${n.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

const ClientPayments = () => {
    const navigate = useNavigate();
    const token       = localStorage.getItem("token");
    const clientIdRaw = localStorage.getItem("clientId");
    const clientId    = clientIdRaw ? Number(clientIdRaw) : 0;

    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading]   = useState(true);
    const [err, setErr]           = useState("");
    const [search, setSearch]     = useState("");
    const [filter, setFilter]     = useState("ALL");
    const [page, setPage]         = useState(1);
    const [downloading, setDownloading] = useState<number | null>(null);
    const [rejectionReasonModal, setRejectionReasonModal] = useState<string | null>(null);

    useEffect(() => {
        if (!token || !clientIdRaw) {
            setErr("Please log in as a client to view payment history.");
            setPayments([]);
            setLoading(false);
            return;
        }
        (async () => {
            try {
                setErr("");
                const data = await paymentApi.getByClient(clientId);
                setPayments(data);
            } catch (e: any) {
                setErr(e?.message ?? "Failed to load payment history");
            } finally {
                setLoading(false);
            }
        })();
    }, [token, clientIdRaw, clientId]);

    /* ── Stats ── */
    const totalVerified = useMemo(() =>
        payments.filter(p => p.verificationStatus === "VERIFIED")
                .reduce((s: number, p: any) => s + (p.amountPaid ?? 0), 0),
    [payments]);

    const pendingCount  = useMemo(() =>
        payments.filter(p => p.verificationStatus === "PENDING").length, [payments]);

    const rejectedCount = useMemo(() =>
        payments.filter(p => p.verificationStatus === "REJECTED").length, [payments]);

    /* ── Filter ── */
    const filtered = useMemo(() => {
        let list = [...payments];
        if (filter !== "ALL") list = list.filter(p => p.verificationStatus === filter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                (p.invoiceNumber ?? "").toLowerCase().includes(q) ||
                (p.transactionReference ?? "").toLowerCase().includes(q)
            );
        }
        return list.sort((a: any, b: any) => new Date(b.proofUploadedAt ?? 0).getTime() - new Date(a.proofUploadedAt ?? 0).getTime());
    }, [payments, filter, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleDownloadReceipt = async (p: any) => {
        setDownloading(p.paymentId);
        try {
            if (p.verificationStatus === "VERIFIED") {
                await paymentApi.downloadReceipt(p.paymentId, p.invoiceNumber ?? String(p.invoiceId));
            } else {
                const blob = await invoiceApi.downloadPdf(p.invoiceId);
                downloadBlobFile(blob, `invoice-${p.invoiceNumber ?? p.invoiceId}.pdf`);
            }
        } catch (error) {
            console.error("Download failed:", error);
            alert("Could not download the document. Please try again.");
        } finally {
            setDownloading(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 pt-2">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-foreground">Payment History</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Track all your submitted payment proofs and their verification status
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
                        label: "Total Verified",
                        value: formatLKR(totalVerified),
                        sub: `${payments.filter(p => p.verificationStatus === "VERIFIED").length} payments`,
                        bg: "bg-card dark:bg-emerald-500/10", border: "border-border dark:border-emerald-500/20"
                    },
                    {
                        icon: <Clock className="h-5 w-5 text-amber-500" />,
                        label: "Pending Review",
                        value: String(pendingCount),
                        sub: pendingCount > 0 ? "Awaiting accountant review" : "All cleared",
                        bg: "bg-card dark:bg-amber-500/10", border: "border-border dark:border-amber-500/20"
                    },
                    {
                        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
                        label: "Rejected Proofs",
                        value: String(rejectedCount),
                        sub: rejectedCount > 0 ? "Re-upload required" : "None",
                        bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-100 dark:border-red-500/20"
                    },
                    {
                        icon: <Calendar className="h-5 w-5 text-blue-500" />,
                        label: "Last Submission",
                        value: payments.length > 0
                            ? new Date(
                                [...payments].sort((a: any, b: any) =>
                                    new Date(b.proofUploadedAt ?? 0).getTime() - new Date(a.proofUploadedAt ?? 0).getTime()
                                )[0]?.proofUploadedAt
                              ).toLocaleDateString("en-LK")
                            : "—",
                        sub: "Most recent upload",
                        bg: "bg-card dark:bg-blue-500/10", border: "border-border dark:border-blue-500/20"
                    },
                ].map(({ icon, label, value, sub, bg, border }) => (
                    <div key={label} className={`${bg} border ${border} rounded-2xl p-4`}>
                        <div className="flex items-center gap-2 mb-2">
                            {icon}
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                        </div>
                        <p className="text-lg font-black text-foreground leading-tight">{value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-card rounded-2xl shadow-sm border border-border/60 p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search invoice # or reference…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="pl-9 pr-4 py-2 text-sm border border-border rounded-xl bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
                        />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {["ALL","PENDING","VERIFIED","REJECTED"].map(s => (
                            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    filter === s
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}>
                                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {err && <p className="text-red-600 dark:text-red-400 text-sm">{err}</p>}

            {/* Rejection Reason Modal */}
            {rejectionReasonModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={() => setRejectionReasonModal(null)}
                >
                    <div
                        className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold text-foreground mb-3">Rejection Reason</h3>
                        <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4">
                            <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">{rejectionReasonModal}</p>
                        </div>
                        <button
                            onClick={() => setRejectionReasonModal(null)}
                            className="mt-4 w-full py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Table */}
            <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/40 border-b border-border/50">
                        <tr className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            <th className="px-5 py-3 text-center">Invoice #</th>
                            <th className="px-5 py-3 text-center">Amount Paid</th>
                            <th className="px-5 py-3 text-center hidden sm:table-cell">Payment Date</th>
                            <th className="px-5 py-3 text-center hidden md:table-cell">Transaction Ref</th>
                            <th className="px-5 py-3 text-center hidden lg:table-cell">Method</th>
                            <th className="px-5 py-3 text-center">Submitted</th>
                            <th className="px-5 py-3 text-center">Status</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-5 py-16 text-center">
                                    <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground font-medium">No payment records found</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {filter === "ALL"
                                            ? "You haven't submitted any payment proofs yet."
                                            : "No records match this filter."}
                                    </p>
                                    {filter === "ALL" && (
                                        <button onClick={() => navigate("/client/invoices")}
                                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all">
                                            Go to Invoices
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ) : paginated.map((p: any) => (
                            <tr key={p.paymentId}
                                onClick={() => navigate(`/client/invoices/${p.invoiceId}`)}
                                className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                                p.verificationStatus === "REJECTED" ? "bg-red-50/30 dark:bg-red-500/10" : ""
                            }`}>
                                <td className="px-5 py-3 font-semibold text-sm text-foreground text-center">
                                    <button
                                        onClick={() => navigate(`/client/invoices/${p.invoiceId}`)}
                                        className="hover:text-primary hover:underline transition-colors"
                                    >
                                        {p.invoiceNumber ?? `INV-${p.invoiceId}`}
                                    </button>
                                </td>
                                <td className="px-5 py-3 font-bold text-sm text-foreground text-center">
                                    {formatLKR(p.amountPaid ?? 0)}
                                </td>
                                <td className="px-5 py-3 text-sm text-muted-foreground hidden sm:table-cell text-center">
                                    {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-LK") : "—"}
                                </td>
                                <td className="px-5 py-3 text-xs text-muted-foreground hidden md:table-cell font-mono text-center">
                                    {p.transactionReference ?? "—"}
                                </td>
                                <td className="px-5 py-3 text-sm text-muted-foreground hidden lg:table-cell capitalize text-center">
                                    {(p.paymentMethod ?? "").toLowerCase().replace(/_/g, " ")}
                                </td>
                                <td className="px-5 py-3 text-xs text-muted-foreground text-center">
                                    {p.proofUploadedAt
                                        ? new Date(p.proofUploadedAt).toLocaleDateString("en-LK")
                                        : "—"}
                                </td>
                                <td className="px-5 py-3 text-center">
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${verificationBadge(p.verificationStatus)}`}>
                                        {verificationLabel(p.verificationStatus)}
                                    </span>
                                    {p.verificationStatus === "REJECTED" && p.rejectionReason && (
                                        <button
                                            onClick={() => setRejectionReasonModal(p.rejectionReason)}
                                            className="block text-[10px] text-red-500 dark:text-red-400 mt-1 hover:underline w-full text-center"
                                        >
                                            View reason
                                        </button>
                                    )}
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        {p.verificationStatus === "VERIFIED" ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownloadReceipt(p);
                                                }}
                                                disabled={downloading === p.paymentId}
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                                                title="Download Receipt"
                                            >
                                                {downloading === p.paymentId
                                                    ? <span className="w-3 h-3 border-2 border-emerald-700 dark:border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                                    : <Download className="h-3 w-3" />
                                                }
                                                Receipt
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownloadReceipt(p); // This function downloads the invoice by default
                                                }}
                                                disabled={downloading === p.paymentId}
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                                                title="Download Invoice"
                                            >
                                                {downloading === p.paymentId
                                                    ? <span className="w-3 h-3 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                                                    : <Download className="h-3 w-3" />
                                                }
                                                Invoice
                                            </button>
                                        )}
                                        {p.verificationStatus === "REJECTED" && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/client/invoices/${p.invoiceId}/upload-proof`);
                                                }}
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs font-bold transition-colors"
                                                title="Re-upload Proof"
                                            >
                                                <RotateCcw className="h-3 w-3" />
                                                Re-upload
                                            </button>
                                        )}
                                    </div>
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
                                className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                <button key={pg} onClick={() => setPage(pg)}
                                    className={`w-7 h-7 text-xs rounded-lg font-semibold transition-all ${
                                        pg === page ? "bg-primary text-primary-foreground" : "hover:bg-muted/80 text-muted-foreground"
                                    }`}>
                                    {pg}
                                </button>
                            ))}
                            <button onClick={() => setPage(pg => Math.min(totalPages, pg + 1))} disabled={page === totalPages}
                                className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Empty state CTA */}
            {payments.length === 0 && !loading && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="font-bold text-foreground">Ready to make a payment?</p>
                        <p className="text-sm text-muted-foreground mt-0.5">Go to your invoices, open an issued invoice, and click Upload Payment Proof.</p>
                    </div>
                    <button onClick={() => navigate("/client/invoices")}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shrink-0">
                        <CloudUpload className="h-4 w-4" /> Upload Payment Proof
                    </button>
                </div>
            )}
        </div>
    );
};

export default ClientPayments;
