import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { paymentApi, API_BASE } from "@/lib/api";
import {
    ChevronRight, ArrowLeft, CheckCircle2, XCircle, Download,
    ShieldCheck, Clock, FileText, User, Hash, Calendar, CreditCard,
    AlertCircle, Building2, Eye
} from "lucide-react";

const formatLKR = (n: number) =>
    `LKR ${n.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

interface AccountantPaymentVerifyProps {
    paymentIdProp?: number;
    onBack?: () => void;
}

const AccountantPaymentVerify = ({ paymentIdProp, onBack }: AccountantPaymentVerifyProps) => {
    const { paymentId: paramId } = useParams<{ paymentId: string }>();
    const paymentId = paymentIdProp || Number(paramId);
    const navigate = useNavigate();

    const [payment, setPayment] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // checklist
    const [checks, setChecks] = useState({
        amountMatch: false,
        bankFound: false,
        refCorrect: false,
        legit: false,
    });

    // decision panel
    const [decision, setDecision] = useState<"VERIFIED" | "REJECTED" | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{ ok: boolean; text: string } | null>(null);

    // proof viewer
    const [proofMode, setProofMode] = useState<"embed" | "link">("embed");
    const [proofBlobUrl, setProofBlobUrl] = useState<string | null>(null);
    const [proofFetching, setProofFetching] = useState(false);

    const allChecked = Object.values(checks).every(Boolean);

    useEffect(() => {
        (async () => {
            try {
                const data = await paymentApi.getById(Number(paymentId));
                setPayment(data);
            } catch (e: any) {
                setErr(e?.message ?? "Payment not found");
            } finally {
                setLoading(false);
            }
        })();
    }, [paymentId]);

    // Fetch proof file with auth token → blob URL so iframe/img can render it
    useEffect(() => {
        if (!payment?.paymentId || !payment?.paymentProofPath) return;
        let objectUrl: string | null = null;
        setProofFetching(true);
        const token = localStorage.getItem("token");
        fetch(`${API_BASE}/payments/${payment.paymentId}/proof`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(res => { if (!res.ok) throw new Error("Failed"); return res.blob(); })
            .then(blob => { objectUrl = URL.createObjectURL(blob); setProofBlobUrl(objectUrl); })
            .catch(() => setProofBlobUrl(null))
            .finally(() => setProofFetching(false));
        return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [payment?.paymentId]);

    const handleSubmit = async () => {
        if (!payment || !decision) return;
        if (decision === "REJECTED" && !rejectionReason.trim()) {
            alert("Please enter a rejection reason.");
            return;
        }
        setSubmitting(true);
        setSubmitResult(null);
        try {
            await paymentApi.verify({
                paymentId: payment.paymentId,
                verificationStatus: decision,
                rejectionReason: decision === "REJECTED" ? rejectionReason : undefined,
                remarks: remarks || undefined,
            });
            setSubmitResult({
                ok: true,
                text: decision === "VERIFIED"
                    ? "Payment verified successfully. Invoice marked as PAID and client has been notified."
                    : "Payment rejected. Client has been notified and must re-upload their proof.",
            });
            // Refresh payment data
            const updated = await paymentApi.getById(payment.paymentId);
            setPayment(updated);
        } catch (e: any) {
            setSubmitResult({ ok: false, text: e?.message ?? "Verification failed. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadReceipt = async () => {
        if (!payment) return;
        try {
            await paymentApi.downloadReceipt(payment.invoiceId, payment.invoiceNumber ?? String(payment.invoiceId));
        } catch {
            alert("Could not download receipt.");
        }
    };

    // ── Loading / error ────────────────────────────────────────────────────

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (err || !payment) return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-red-600 font-semibold">{err || "Payment not found"}</p>
            <button onClick={() => onBack ? onBack() : navigate("/account-executive/payments")}
                className="text-sm font-semibold text-primary underline">← Back to Payments</button>
        </div>
    );

    const isAlreadyDecided = payment.verificationStatus !== "PENDING";
    const proofUrl = paymentApi.proofUrl(payment.paymentId);
    const isImage = (payment.paymentProofPath ?? "").match(/\.(jpg|jpeg|png)$/i);
    const isPdf = (payment.paymentProofPath ?? "").endsWith(".pdf");

    return (
        <div className="space-y-5 pb-8">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link to="/account-executive" className="hover:text-primary transition-colors">Dashboard</Link>
                <ChevronRight className="h-3 w-3" />
                <Link to="/account-executive/payments" className="hover:text-primary transition-colors">Payments</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-semibold">Verify #{payment.paymentId}</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => onBack ? onBack() : navigate("/account-executive/payments")}
                        className="p-2 rounded-xl hover:bg-muted transition-colors">
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-foreground">
                            Verify Payment #{payment.paymentId}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Reviewing payment from: <strong className="text-foreground">{payment.companyName}</strong>
                        </p>
                    </div>
                </div>
                {isAlreadyDecided && (
                    <button onClick={handleDownloadReceipt}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
                        <Download className="h-3.5 w-3.5" /> Download Invoice PDF
                    </button>
                )}
            </div>

            {/* Already decided banner */}
            {isAlreadyDecided && (
                <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${payment.verificationStatus === "VERIFIED"
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                    }`}>
                    {payment.verificationStatus === "VERIFIED"
                        ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        : <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                    }
                    <div>
                        <p className={`font-bold text-sm ${payment.verificationStatus === "VERIFIED" ? "text-emerald-800" : "text-red-800"}`}>
                            This payment has been {payment.verificationStatus === "VERIFIED" ? "verified" : "rejected"}
                        </p>
                        {payment.verificationStatus === "REJECTED" && payment.rejectionReason && (
                            <p className="text-xs text-red-600 mt-0.5">Reason: {payment.rejectionReason}</p>
                        )}
                        {payment.verifiedAt && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                {new Date(payment.verifiedAt).toLocaleString("en-LK")}
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── Left + Middle: Invoice Details + Proof ── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Invoice + Payment Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Invoice Details */}
                        <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Invoice Details</p>
                            </div>
                            {[
                                { icon: <User className="h-3.5 w-3.5" />, label: "Client", value: payment.companyName },
                                { icon: <Hash className="h-3.5 w-3.5" />, label: "Invoice", value: payment.invoiceNumber ?? `INV-${payment.invoiceId}` },
                                { icon: <CreditCard className="h-3.5 w-3.5" />, label: "Invoice Total", value: payment.invoiceTotal != null ? formatLKR(payment.invoiceTotal) : payment.invoiceTotalAmount != null ? formatLKR(payment.invoiceTotalAmount) : "—" },
                                { icon: <Calendar className="h-3.5 w-3.5" />, label: "Due Date", value: payment.invoiceDueDate ? new Date(payment.invoiceDueDate).toLocaleDateString("en-LK") : payment.dueDate ? new Date(payment.dueDate).toLocaleDateString("en-LK") : "—" },
                            ].map(({ icon, label, value }) => (
                                <div key={label} className="flex items-start gap-2.5">
                                    <span className="text-muted-foreground mt-0.5">{icon}</span>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
                                        <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Payment Details */}
                        <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Payment Details</p>
                                </div>
                            </div>
                            {[
                                { icon: <Hash className="h-3.5 w-3.5" />, label: "Ref #", value: payment.transactionReference ?? "—" },
                                { icon: <Calendar className="h-3.5 w-3.5" />, label: "Date", value: payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("en-LK") : "—" },
                                { icon: <Building2 className="h-3.5 w-3.5" />, label: "Bank", value: payment.bankName ?? "Not specified" },
                                { icon: <CreditCard className="h-3.5 w-3.5" />, label: "Method", value: (payment.paymentMethod ?? "").replace(/_/g, " ") },
                            ].map(({ icon, label, value }) => (
                                <div key={label} className="flex items-start gap-2.5">
                                    <span className="text-muted-foreground mt-0.5">{icon}</span>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
                                        <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mt-4">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Amount Received</p>
                                <p className="text-2xl font-black text-foreground mt-0.5">{formatLKR(payment.amountPaid ?? 0)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Proof Viewer */}
                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
                            <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-primary" />
                                <p className="text-sm font-bold text-foreground">Proof of Payment</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {payment.paymentProofPath ? (
                                    <a href={`${proofUrl}?t=${Date.now()}`} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                                        <Download className="h-3 w-3" /> Open in new tab
                                    </a>
                                ) : (
                                    <span className="text-xs text-muted-foreground">No file attached</span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-muted/30 min-h-[300px] flex items-center justify-center">
                            {!payment.paymentProofPath ? (
                                <div className="text-center text-muted-foreground">
                                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No proof file attached</p>
                                </div>
                            ) : isPdf ? (
                                <div className="w-full">
                                    {proofFetching ? (
                                        <div className="flex items-center justify-center" style={{ height: "500px" }}>
                                            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : proofBlobUrl ? (
                                        <iframe
                                            src={proofBlobUrl}
                                            className="w-full rounded-xl border"
                                            style={{ height: "560px" }}
                                            title="Payment Proof PDF"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-3" style={{ height: "400px" }}>
                                            <FileText className="h-10 w-10 text-gray-300" />
                                            <p className="text-sm text-gray-400">Could not load proof file.</p>
                                            <a href={proofUrl} target="_blank" rel="noreferrer"
                                                className="text-xs font-semibold text-primary underline">Open in new tab</a>
                                        </div>
                                    )}
                                </div>
                            ) : isImage ? (
                                <img
                                    src={proofBlobUrl ?? proofUrl}
                                    alt="Payment Proof"
                                    className="max-w-full max-h-[500px] rounded-xl border shadow-sm object-contain"
                                    onError={() => setProofMode("link")}
                                />
                            ) : (
                                <div className="text-center">
                                    <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                                    <a href={proofUrl} target="_blank" rel="noreferrer"
                                        className="text-sm font-semibold text-primary hover:underline">
                                        Click to view proof file
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-5">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Activity Log</p>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Client Uploaded Proof</p>
                                    <p className="text-xs text-gray-400">
                                        {payment.proofUploadedAt ? new Date(payment.proofUploadedAt).toLocaleString("en-LK") : "—"}
                                    </p>
                                </div>
                            </div>
                            {payment.verifiedAt && (
                                <div className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${payment.verificationStatus === "VERIFIED" ? "bg-emerald-500" : "bg-red-500"
                                        }`} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {payment.verificationStatus === "VERIFIED" ? "Payment Verified" : "Payment Rejected"}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(payment.verifiedAt).toLocaleString("en-LK")}
                                        </p>
                                        {payment.rejectionReason && (
                                            <p className="text-xs text-red-600 mt-0.5">Reason: {payment.rejectionReason}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right: Checklist + Decision Panel ── */}
                <div className="space-y-5">

                    {/* Verification Checklist */}
                    <div className="bg-card border border-border/60 rounded-2xl p-5">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                <p className="text-sm font-bold text-foreground">Verification Checklist</p>
                            </div>
                            <button
                                type="button"
                                disabled={isAlreadyDecided || allChecked}
                                onClick={() =>
                                    setChecks({
                                        amountMatch: true,
                                        bankFound: true,
                                        refCorrect: true,
                                        legit: true,
                                    })
                                }
                                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title={allChecked ? "All checklist items are already checked" : "Check all items"}
                            >
                                Check all
                            </button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { key: "amountMatch" as const, label: "Amount matches invoice", sub: `Exact total of ${formatLKR(payment.amountPaid ?? 0)} is reflected in proof` },
                                { key: "bankFound" as const, label: "Bank found in system", sub: "Originating bank matches client profile" },
                                { key: "refCorrect" as const, label: "Reference number correct", sub: `${payment.transactionReference ?? "—"} visible on the receipt` },
                                { key: "legit" as const, label: "Proof is legitimate", sub: "No signs of alteration or tampering" },
                            ].map(({ key, label, sub }) => (
                                <label key={key} className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${isAlreadyDecided ? "opacity-60 cursor-not-allowed" : "hover:bg-muted"
                                    }`}>
                                    <input
                                        type="checkbox"
                                        checked={checks[key]}
                                        disabled={isAlreadyDecided}
                                        onChange={e => setChecks(prev => ({ ...prev, [key]: e.target.checked }))}
                                        className="mt-0.5 accent-primary"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Decision Panel */}
                    {!isAlreadyDecided ? (
                        <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4">
                            <p className="text-sm font-bold text-foreground">Decision Panel</p>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setDecision("VERIFIED")}
                                    disabled={!allChecked}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-bold text-sm transition-all ${decision === "VERIFIED"
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "border-border hover:border-emerald-500/50 text-muted-foreground hover:bg-emerald-500/5 disabled:opacity-40 disabled:cursor-not-allowed"
                                        }`}
                                >
                                    <CheckCircle2 className="h-6 w-6" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => setDecision("REJECTED")}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-bold text-sm transition-all ${decision === "REJECTED"
                                        ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                                        : "border-border hover:border-red-500/50 text-muted-foreground hover:bg-red-500/5"
                                        }`}
                                >
                                    <XCircle className="h-6 w-6" />
                                    Reject
                                </button>
                            </div>

                            {!allChecked && decision !== "REJECTED" && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Complete all checklist items to enable Approve
                                </p>
                            )}

                            {decision === "REJECTED" && (
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                                        Rejection Reason <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-muted/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="">Select a reason…</option>
                                        <option value="Amount does not match the invoice total">Amount mismatch</option>
                                        <option value="Transaction reference not found on receipt">Reference not found</option>
                                        <option value="Receipt image is unclear or unreadable">Unclear receipt</option>
                                        <option value="Proof appears to be altered or tampered">Suspected tampering</option>
                                        <option value="Wrong invoice reference used">Wrong reference</option>
                                        <option value="Duplicate submission">Duplicate submission</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                                    Remarks (Optional)
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                    placeholder="Internal notes for audit trail…"
                                    rows={2}
                                    className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-muted/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>

                            {submitResult && (
                                <div className={`rounded-xl p-3 flex gap-2 items-start text-sm ${submitResult.ok ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"
                                    }`}>
                                    {submitResult.ok
                                        ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                                        : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    }
                                    {submitResult.text}
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !decision || (decision === "REJECTED" && !rejectionReason)}
                                className="w-full bg-primary hover:bg-primary/90 text-black font-black py-3 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        Processing…
                                    </span>
                                ) : (
                                    "SUBMIT DECISION"
                                )}
                            </button>

                            <button onClick={() => onBack ? onBack() : navigate("/account-executive/payments")}
                                className="w-full border border-border text-muted-foreground hover:bg-muted py-2.5 rounded-xl text-sm font-semibold transition-all">
                                Cancel & Return
                            </button>
                        </div>
                    ) : (
                        <div className="bg-card border border-border/60 rounded-2xl p-5">
                            <p className="text-sm font-bold text-foreground mb-3">Decision Summary</p>
                            <div className={`rounded-xl p-4 ${payment.verificationStatus === "VERIFIED"
                                ? "bg-emerald-500/10 border border-emerald-500/20"
                                : "bg-red-500/10 border border-red-500/20"
                                }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {payment.verificationStatus === "VERIFIED"
                                        ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                        : <XCircle className="h-5 w-5 text-red-600" />
                                    }
                                    <span className={`font-bold text-sm ${payment.verificationStatus === "VERIFIED" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                        }`}>
                                        {payment.verificationStatus}
                                    </span>
                                </div>
                                {payment.remarks && (
                                    <p className="text-xs text-muted-foreground mt-1">Notes: {payment.remarks}</p>
                                )}
                            </div>
                            <button onClick={() => onBack ? onBack() : navigate("/account-executive/payments")}
                                className="mt-4 w-full border border-border text-muted-foreground hover:bg-muted py-2.5 rounded-xl text-sm font-semibold transition-all">
                                ← Back to Payments
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountantPaymentVerify;
