import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { invoiceApi, paymentApi } from "@/lib/api";
import type { Invoice } from "@/utils/client";
import {
    ChevronRight, CloudUpload, Paperclip, CheckCircle2,
    AlertCircle, Shield, ExternalLink, ArrowLeft, X
} from "lucide-react";

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

const ClientUploadPaymentProof = () => {
    const { id } = useParams<{ id: string }>();
    const navigate  = useNavigate();
    const fileRef   = useRef<HTMLInputElement>(null);

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr]         = useState("");

    // form fields
    const [txRef,    setTxRef]   = useState("");
    const [payDate,  setPayDate] = useState("");
    const [amtPaid,  setAmtPaid] = useState("");
    const [bankName, setBankName]= useState("");
    const [file,     setFile]    = useState<File | null>(null);
    const [dragOver, setDragOver]= useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await invoiceApi.getByIdForClient(Number(id));
                setInvoice(data);
                // Pre-fill amount
                setAmtPaid(String(data.balanceAmount ?? data.totalAmount ?? ""));
            } catch (e: any) {
                setErr(e?.message ?? "Invoice not found");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) validateAndSetFile(dropped);
    };

    const validateAndSetFile = (f: File) => {
        const allowed = ["image/jpeg","image/png","application/pdf"];
        if (!allowed.includes(f.type)) {
            alert("Only JPG, PNG, or PDF files are accepted.");
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            alert("File must be under 5 MB.");
            return;
        }
        setFile(f);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoice || !file || !txRef || !payDate || !amtPaid) return;

        setSubmitting(true);
        setResult(null);
        try {
            const fd = new FormData();
            fd.append("invoiceId",            String(invoice.invoiceId));
            fd.append("amountPaid",           amtPaid);
            fd.append("paymentDate",          payDate);
            fd.append("transactionReference", txRef);
            fd.append("paymentMethod",        "BANK_TRANSFER");
            if (bankName) fd.append("bankName", bankName);
            fd.append("paymentProof",         file);
            await paymentApi.upload(fd);
            setResult({ ok: true, text: "Payment proof submitted successfully! Our team will verify within 24–48 hours." });
        } catch (e: any) {
            setResult({ ok: false, text: e?.message ?? "Upload failed. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Loading ────────────────────────────────────────────────────────────

    if (loading) return (
        <div className="min-h-screen bg-background">
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    );

    if (err || !invoice) return (
        <div className="min-h-screen bg-background">
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-red-600 dark:text-red-400 font-semibold">{err || "Invoice not found"}</p>
                <button onClick={() => navigate("/client/invoices")}
                    className="text-sm font-semibold text-primary underline">← Back to Invoices</button>
            </div>
        </div>
    );

    const totalDue  = invoice.balanceAmount ?? invoice.totalAmount ?? 0;
    const period    = invoice.billingMonth
        ? `${MONTHS[(invoice.billingMonth ?? 1) - 1]} ${invoice.billingYear}`
        : "—";
    const canUpload = ["ISSUED","PAYMENT_REJECTED","OVERDUE"].includes(invoice.status);

    // ── Success screen ────────────────────────────────────────────────────

    if (result?.ok) return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
                <div className="w-full max-w-2xl">
                    <div className="bg-card border border-border/60 rounded-3xl shadow-sm px-8 sm:px-10 py-10 text-center -mt-8">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-3xl font-black text-foreground mt-5">Proof Submitted!</h2>
                        <p className="text-muted-foreground text-base mt-2">{result.text}</p>

                        <div className="mt-7 bg-muted/40 border border-border/60 rounded-2xl p-6 text-left">
                            <p className="font-semibold text-foreground">What happens next?</p>
                            <ul className="text-muted-foreground space-y-2 list-disc list-inside text-sm mt-3">
                                <li>Our accountant will review your proof within 24–48 business hours</li>
                                <li>You will be notified by email once verified</li>
                                <li>After approval, your invoice status updates to <strong>Paid</strong></li>
                                <li>A receipt PDF will be available in your Payments tab</li>
                            </ul>
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => navigate("/client/invoices")}
                                className="px-6 py-3 rounded-xl border border-border text-base font-semibold text-muted-foreground hover:bg-muted transition-all"
                            >
                                Back to Invoices
                            </button>
                            <button
                                onClick={() => navigate("/client/payments")}
                                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-base font-bold hover:bg-primary/90 transition-all"
                            >
                                View Payments
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── Not eligible ──────────────────────────────────────────────────────

    if (!canUpload) return (
        <div className="min-h-screen bg-background">
            <div className="max-w-xl mx-auto py-20 text-center space-y-4 px-4 sm:px-6">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                <h2 className="text-xl font-black text-foreground">Cannot Upload Proof</h2>
                <p className="text-sm text-muted-foreground">
                    This invoice has status <strong>{invoice.status}</strong> and does not accept payment proof uploads.
                    {invoice.status === "PAID" && " This invoice is already marked as paid."}
                    {invoice.status === "PAYMENT_UPLOADED" && " A proof has already been submitted and is awaiting verification."}
                </p>
                <button onClick={() => navigate(`/client/invoices/${invoice.invoiceId}`)}
                    className="text-sm font-semibold text-primary underline">← View Invoice</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8 lg:pt-4 lg:pb-10 space-y-5">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Link to="/client/dashboard" className="hover:text-primary transition-colors">Home</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link to="/client/invoices" className="hover:text-primary transition-colors">Invoices</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-semibold">Upload Payment Proof</span>
                </nav>

                {/* Page header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/client/invoices/${invoice.invoiceId}`)}
                        className="p-2 rounded-xl hover:bg-muted transition-colors">
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-foreground">Confirm Your Payment</h1>
                        <p className="text-base text-muted-foreground mt-1">
                            Please provide details of your transaction. Verification typically takes 24–48 business hours.
                        </p>
                    </div>
                </div>

                {/* PAYMENT_REJECTED banner */}
                {invoice.status === "PAYMENT_REJECTED" && (
                    <div className="flex items-start gap-3 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4">
                        <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-orange-800 dark:text-orange-300 text-sm">Previous proof was rejected</p>
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">Please upload a clear copy of your bank receipt or transfer confirmation.</p>
                        </div>
                    </div>
                )}

                <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-12">

                        {/* ── Left: Invoice Summary ── */}
                        <div className="md:col-span-5 bg-gray-900 text-white p-8 lg:p-10 flex flex-col">
                            <div className="flex-1 space-y-5">
                                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Invoice Summary</p>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Invoice Number</p>
                                    <p className="text-2xl font-black text-primary mt-1">{invoice.invoiceNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Outstanding Balance</p>
                                    <p className="text-4xl lg:text-5xl font-black text-yellow-400 mt-1 leading-none whitespace-nowrap tracking-tight">
                                        LKR {totalDue.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="text-gray-400 uppercase tracking-wide">Period</p>
                                        <p className="font-semibold text-white mt-1">{period}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 uppercase tracking-wide">Due Date</p>
                                        <p className={`font-semibold mt-1 ${invoice.status === "OVERDUE" ? "text-red-400" : "text-white"}`}>
                                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-LK") : "—"}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => navigate(`/client/invoices/${invoice.invoiceId}`)}
                                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                                    <ExternalLink className="h-3 w-3" /> View full invoice
                                </button>
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3">
                                <Shield className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-yellow-400">Secure Submission</p>
                                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                        Your payment data is encrypted and handled directly by our secure billing system.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Right: Upload Form ── */}
                        <div className="md:col-span-7 p-8 lg:p-10">
                            {result?.ok === false && (
                                <div className="mb-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 flex gap-2 items-start">
                                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700 dark:text-red-400">{result.text}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* Transaction Reference */}
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                                        Transaction Reference Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        value={txRef}
                                        onChange={e => setTxRef(e.target.value)}
                                        required
                                        placeholder="e.g. INV-2005-12-0142"
                                        className="w-full text-base border border-border rounded-xl px-4 py-3 bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Found on your bank receipt or wire transfer confirmation.</p>
                                </div>

                                {/* Date + Amount row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                                            Payment Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={payDate}
                                            onChange={e => setPayDate(e.target.value)}
                                            required
                                            max={new Date().toISOString().split("T")[0]}
                                            className="w-full text-base border border-border rounded-xl px-4 py-3 bg-muted/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                                            Amount Paid (LKR) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">LKR</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={amtPaid}
                                                onChange={e => setAmtPaid(e.target.value)}
                                                required
                                                placeholder="0.00"
                                                className="w-full text-base border border-border rounded-xl pl-11 pr-4 py-3 bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* File Upload */}
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                                        Receipt / Proof of Payment <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        onClick={() => fileRef.current?.click()}
                                        onDrop={handleDrop}
                                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        className={`border-2 border-dashed rounded-xl p-9 lg:p-10 text-center cursor-pointer transition-all ${
                                            file       ? "border-primary bg-primary/5" :
                                            dragOver   ? "border-primary/70 bg-primary/5" :
                                            "border-border hover:border-primary/50 bg-muted/40 hover:bg-muted/60"
                                        }`}
                                    >
                                        {file ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Paperclip className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold text-foreground">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={e => { e.stopPropagation(); setFile(null); }}
                                                    className="ml-2 p-1 hover:bg-muted rounded-full transition-colors"
                                                >
                                                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <CloudUpload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                                <p className="text-sm font-semibold text-foreground">Drag and drop file here</p>
                                                <p className="text-xs text-muted-foreground mt-1">or <span className="text-primary font-semibold underline">browse files</span> from your computer</p>
                                                <div className="flex items-center justify-center gap-2 mt-3">
                                                    {["PDF","JPG","PNG"].map(t => (
                                                        <span key={t} className="text-[10px] font-bold px-2 py-0.5 bg-muted text-muted-foreground rounded">{t}</span>
                                                    ))}
                                                    <span className="text-[10px] text-muted-foreground">Max 5MB</span>
                                                </div>
                                            </>
                                        )}
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            className="hidden"
                                            onChange={e => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/client/invoices/${invoice.invoiceId}`)}
                                        className="flex-1 border border-border text-muted-foreground hover:bg-muted py-3.5 rounded-xl font-bold text-base transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !txRef || !payDate || !amtPaid || !file}
                                        className="flex-[2] flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                                Submitting…
                                            </>
                                        ) : (
                                            <>
                                                <CloudUpload className="h-4 w-4" />
                                                Submit Proof →
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientUploadPaymentProof;

