import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ChevronRight, Printer, Download, Trash2, X, AlertCircle,
    CheckCircle, Zap, FileText,
} from "lucide-react";
import { invoiceApi } from "@/lib/api";
import { Invoice } from "@/lib/client";
import { downloadInvoicePdf } from "@/utils/downloadInvoicePdf";

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatLKR = (n: number) =>
    `LKR ${(n ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
    });
};

const MONTHS = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// ── Component ──────────────────────────────────────────────────────────────────

interface AccountantInvoiceReviewProps {
    invoiceId?: number;
    onBack?: () => void;
}

const AccountantInvoiceReview = ({ invoiceId: propInvoiceId, onBack }: AccountantInvoiceReviewProps) => {
    const { invoiceId: paramInvoiceId } = useParams<{ invoiceId: string }>();
    const invoiceId = propInvoiceId || Number(paramInvoiceId);
    const navigate = useNavigate();


    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [actionMsg, setActionMsg] = useState("");
    const [actionError, setActionError] = useState("");
    const [notes, setNotes] = useState("");
    const [checklist, setChecklist] = useState({
        rates: false,
        periods: false,
        deductions: false,
        tax: false,
    });

    useEffect(() => {
        if (!invoiceId) return;
        (async () => {
            setLoading(true);
            try {
                const data = await invoiceApi.getById(Number(invoiceId));
                setInvoice(data);
                setNotes(data.notes ?? "");
            } catch (e: any) {
                setActionError(e?.message ?? "Failed to load invoice.");
            } finally {
                setLoading(false);
            }
        })();
    }, [invoiceId]);

    const handleApprove = async () => {
        if (!invoice) return;
        if (!confirm("Approve and issue this invoice? An email will be sent to the client.")) return;
        setApproving(true);
        setActionMsg("");
        setActionError("");
        try {
            // 1. Save internal notes
            if (notes !== (invoice.notes ?? "")) {
                await invoiceApi.updateNotes(invoice.invoiceId, notes);
            }
            // 2. DRAFT → APPROVED
            await invoiceApi.approve(invoice.invoiceId);
            // 3. APPROVED → ISSUED (generates PDF and emails client)
            await invoiceApi.issue(invoice.invoiceId);
            setActionMsg("Invoice approved and issued to client. PDF generated and emailed ✓");
            setInvoice({ ...invoice, status: "ISSUED" });
        } catch (e: any) {
            setActionError(e?.message ?? "Approval failed. Please try again.");
        } finally {
            setApproving(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!invoice) return;
        try {
            await invoiceApi.updateNotes(invoice.invoiceId, notes);
            setActionMsg("Notes saved ✓");
        } catch (e: any) {
            setActionError(e?.message ?? "Failed to save notes.");
        }
    };

    const handleDelete = async () => {
        if (!invoice) return;
        if (!confirm("Delete this draft invoice? This action cannot be undone.")) return;
        setDeleting(true);
        try {
            await invoiceApi.deleteDraft(invoice.invoiceId);
            if (onBack) onBack();
            else navigate("/accountant/invoices");

        } catch (e: any) {
            setActionError(e?.message ?? "Delete failed. Please try again.");
            setDeleting(false);
        }
    };

    const handleDownload = async () => {
        if (!invoice) return;
        setDownloading(true);
        setActionError("");
        try {
            await downloadInvoicePdf(invoice.invoiceId, invoice.invoiceNumber);
        } catch (e: any) {
            setActionError(e?.message ?? "Failed to download invoice PDF.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading invoice…</span>
            </div>
        </div>
    );

    if (!invoice) return (
        <div className="text-center py-20 space-y-4 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto opacity-30" />
            <p className="font-medium">Invoice not found.</p>
            {actionError && (
                <p className="text-red-500 text-sm">{actionError}</p>
            )}
            <button onClick={onBack ? onBack : () => navigate("/accountant/invoices")}
                className="text-sm text-yellow-600 underline">
                Back to Invoices
            </button>

        </div>
    );

    const isDraft = invoice.status === "DRAFT";
    const allChecked = Object.values(checklist).every(Boolean);

    // Group items by type for display
    const items = invoice.items || [];
    const displayItems = items.filter((i) => !["SSCL", "VAT", "LATE_FEE"].includes(i.itemType || ""));

    return (
        <div className="space-y-6 pb-8">

            {/* ── Breadcrumb ── */}
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
                <Link to="/accountant" className="hover:text-primary">Accountant</Link>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <button onClick={onBack} className="hover:text-primary">Invoices</button>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <span className="font-semibold text-foreground">{invoice.invoiceNumber}</span>
            </nav>


            {/* ── Alerts ── */}
            {actionMsg && (
                <div className="rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm p-3 flex gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> {actionMsg}
                </div>
            )}
            {actionError && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3 flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {actionError}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left: Invoice Preview ── */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-2xl font-black">Review Invoice</h2>
                            <p className="text-sm text-muted-foreground">
                                Review all details before approving and issuing to client.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase
                                ${isDraft ? "bg-amber-100 text-amber-700" :
                                    invoice.status === "ISSUED" ? "bg-blue-100 text-blue-700" :
                                        "bg-green-100 text-green-700"}`}>
                                {invoice.status}
                            </span>
                            {invoice.invoiceType === "AUTO" && (
                                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> Auto-Generated
                                </span>
                            )}
                            {invoice.invoiceType === "MANUAL" && (
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                                    Manual
                                </span>
                            )}
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-1.5 border rounded-xl px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                Print
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="flex items-center gap-1.5 border rounded-xl px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Download className="w-3.5 h-3.5" />
                                {downloading ? "Downloading..." : "Download"}
                            </button>
                        </div>
                    </div>

                    {/* Invoice card */}
                    <div className="bg-card rounded-2xl border shadow-sm overflow-hidden print:shadow-none">

                        {/* Company header + meta */}
                        <div className="p-6 border-b">
                            <div className="flex flex-col sm:flex-row justify-between gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <img
                                            src="/logo.png"
                                            alt="Ace Front Line Security Logo"
                                            className="w-10 h-10 rounded-lg object-cover"
                                        />
                                        <div>
                                            <p className="font-black text-sm leading-tight">ACE FRONT LINE SECURITY SOLUTIONS (PVT) LTD</p>
                                            <p className="text-xs text-muted-foreground">Professional Security Services</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">No. 123, Security Tower, Colombo 07</p>
                                    <p className="text-xs text-muted-foreground">VAT No: 101127788-7000</p>
                                </div>
                                <div className="space-y-1 text-sm sm:text-right">
                                    <p className="text-2xl font-black text-yellow-500">INVOICE</p>
                                    <div className="flex sm:justify-end gap-3 text-sm">
                                        <span className="text-muted-foreground">Invoice #</span>
                                        <span className="font-bold">{invoice.invoiceNumber}</span>
                                    </div>
                                    <div className="flex sm:justify-end gap-3 text-sm">
                                        <span className="text-muted-foreground">Period</span>
                                        <span>
                                            {invoice.billingMonth
                                                ? `${MONTHS[invoice.billingMonth]} ${invoice.billingYear}`
                                                : `${formatDate(invoice.periodFrom)} – ${formatDate(invoice.periodTo)}`}
                                        </span>
                                    </div>
                                    <div className="flex sm:justify-end gap-3 text-sm">
                                        <span className="text-muted-foreground">Issue Date</span>
                                        <span>{formatDate(invoice.issueDate)}</span>
                                    </div>
                                    <div className="flex sm:justify-end gap-3 text-sm">
                                        <span className="text-muted-foreground">Due Date</span>
                                        <span className="font-bold">{formatDate(invoice.dueDate)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 pt-4 border-t">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Bill To</p>
                                <p className="font-bold">{invoice.companyName || "N/A"}</p>
                                {invoice.serviceLocation && (
                                    <p className="text-sm text-muted-foreground">{invoice.serviceLocation}</p>
                                )}
                                {invoice.clientVatNumber && (
                                    <p className="text-sm text-muted-foreground">VAT: {invoice.clientVatNumber}</p>
                                )}

                            </div>
                        </div>

                        {/* Manual reason banner */}
                        {invoice.manualReason && (
                            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                                <p className="text-sm text-blue-700">
                                    <span className="font-bold">Reason: </span>{invoice.manualReason}
                                </p>
                            </div>
                        )}

                        {/* Line items */}
                        <div className="p-6 border-b">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Line Items</p>
                            <div className="rounded-xl border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/60 border-b">
                                            <th className="text-left px-3 py-2 text-xs font-bold uppercase tracking-wide">Description</th>
                                            <th className="text-center px-3 py-2 text-xs font-bold uppercase tracking-wide hidden sm:table-cell">Type</th>
                                            <th className="text-right px-3 py-2 text-xs font-bold uppercase tracking-wide">Qty</th>
                                            <th className="text-right px-3 py-2 text-xs font-bold uppercase tracking-wide">Unit Price</th>
                                            <th className="text-right px-3 py-2 text-xs font-bold uppercase tracking-wide">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayItems.map((item, idx) => (
                                            <tr key={item.itemId ?? idx}
                                                className={`border-b last:border-0 ${item.itemType === "DEDUCTION" ? "bg-red-50/50 text-red-700" :
                                                    idx % 2 === 1 ? "bg-muted/10" : ""
                                                    }`}>
                                                <td className="px-3 py-2.5 font-medium">{item.description}</td>
                                                <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                                                    <span className="text-xs bg-muted/50 rounded px-1.5 py-0.5 text-muted-foreground">
                                                        {(item.itemType || "").replace("_", " ")}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-right">{item.quantity}</td>
                                                <td className="px-3 py-2.5 text-right">
                                                    {formatLKR(Number(item.unitPrice))}
                                                </td>
                                                <td className={`px-3 py-2.5 text-right font-semibold
                                                ${item.itemType === "DEDUCTION" ? "text-red-600" : ""}`}>
                                                    {item.itemType === "DEDUCTION" ? "-" : ""}
                                                    {formatLKR(Number(item.lineTotal))}
                                                </td>
                                            </tr>
                                        ))}
                                        {displayItems.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground text-sm">
                                                    No line items
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="p-6">
                            <div className="flex justify-end">
                                <div className="w-full max-w-xs space-y-1.5 text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{formatLKR(invoice.subtotal ?? 0)}</span>
                                    </div>
                                    {(invoice.deductionsTotal ?? 0) > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>Deductions</span>
                                            <span>-{formatLKR(invoice.deductionsTotal ?? 0)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t pt-1.5 font-semibold">
                                        <span>Invoice Amount</span>
                                        <span>{formatLKR(invoice.invoiceAmount ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>SSCL (2.5%)</span>
                                        <span>{formatLKR(invoice.ssclAmount ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>VAT (18%)</span>
                                        <span>{formatLKR(invoice.vatAmount ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-between border-t-2 pt-1.5 font-black text-base">
                                        <span>TOTAL PAYABLE</span>
                                        <span className="text-yellow-600">{formatLKR(invoice.totalAmount ?? 0)}</span>
                                    </div>
                                    {(invoice.paidAmount ?? 0) > 0 && (
                                        <>
                                            <div className="flex justify-between text-green-600">
                                                <span>Paid</span>
                                                <span>-{formatLKR(invoice.paidAmount ?? 0)}</span>
                                            </div>
                                            <div className={`flex justify-between font-bold border-t pt-1
                                                ${(invoice.balanceAmount ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                                                <span>Balance Due</span>
                                                <span>{formatLKR(invoice.balanceAmount ?? 0)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: Action Panel ── */}
                <div className="space-y-4">

                    {/* Current Status */}
                    <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-3">
                        <p className="font-bold text-sm uppercase tracking-wide text-muted-foreground">
                            Invoice Status
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className={`text-sm font-bold px-3 py-1.5 rounded-full uppercase
                                ${isDraft ? "bg-amber-100 text-amber-700" :
                                    invoice.status === "ISSUED" ? "bg-blue-100  text-blue-700" :
                                        invoice.status === "APPROVED" ? "bg-indigo-100 text-indigo-700" :
                                            invoice.status === "PAID" ? "bg-green-100 text-green-700" :
                                                "bg-gray-100 text-gray-600"}`}>
                                {invoice.status}
                            </span>
                        </div>
                        {!isDraft && (
                            <p className="text-xs text-muted-foreground">
                                This invoice has been {invoice.status.toLowerCase()} and cannot be modified.
                            </p>
                        )}
                    </div>

                    {/* Review Checklist */}
                    {isDraft && (
                        <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-3">
                            {/* Header row with title + Check All toggle */}
                            <div className="flex items-center justify-between pb-1 border-b">
                                <p className="font-bold text-sm uppercase tracking-wide text-muted-foreground">
                                    Review Checklist
                                </p>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                        {allChecked ? "Uncheck All" : "Check All"}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={allChecked}
                                        onChange={(e) => {
                                            const v = e.target.checked;
                                            setChecklist({ rates: v, periods: v, deductions: v, tax: v });
                                        }}
                                        className="w-4 h-4 accent-yellow-400"
                                    />
                                </label>
                            </div>
                            {[
                                { key: "rates", label: "Verified all rates and unit prices" },
                                { key: "periods", label: "Service period dates are correct" },
                                { key: "deductions", label: "Deductions & credits applied correctly" },
                                { key: "tax", label: "SSCL 2.5% + VAT 18% calculated correctly" },
                            ].map(({ key, label }) => (
                                <label key={key} className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checklist[key as keyof typeof checklist]}
                                        onChange={(e) =>
                                            setChecklist((prev) => ({ ...prev, [key]: e.target.checked }))
                                        }
                                        className="mt-0.5 w-4 h-4 accent-yellow-400 shrink-0"
                                    />
                                    <span className={`text-sm ${checklist[key as keyof typeof checklist]
                                        ? "line-through text-muted-foreground"
                                        : ""
                                        }`}>
                                        {label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}

                    {/* Internal Notes */}
                    <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-2">
                        <p className="font-bold text-sm uppercase tracking-wide text-muted-foreground">
                            Internal Notes
                        </p>
                        <p className="text-xs text-muted-foreground">Visible only to accountants & admins</p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={!isDraft}
                            rows={4}
                            placeholder="Add notes for the finance team..."
                            className="w-full border rounded-xl px-3 py-2 text-sm resize-none
                                       focus:outline-none focus:ring-2 focus:ring-yellow-400
                                       disabled:bg-muted/30 disabled:text-muted-foreground"
                        />
                        {isDraft && (
                            <button
                                onClick={handleSaveDraft}
                                className="text-xs text-yellow-600 hover:underline"
                            >
                                Save notes only
                            </button>
                        )}
                    </div>

                    {/* Approve & Issue button */}
                    {isDraft && (
                        <>
                            <button
                                onClick={handleApprove}
                                disabled={approving || !allChecked}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black text-lg
                                           py-4 rounded-2xl transition-all disabled:opacity-50
                                           shadow-lg shadow-yellow-200"
                            >
                                {approving ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        Approving & Issuing…
                                    </span>
                                ) : "APPROVE & ISSUE"}
                            </button>
                            {!allChecked && (
                                <p className="text-xs text-amber-600 text-center -mt-1">
                                    Complete all checklist items to enable approval.
                                </p>
                            )}

                            {/* Secondary actions */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex items-center justify-center gap-1.5 border border-red-300
                                               text-red-600 hover:bg-red-50 font-semibold text-sm py-2.5
                                               rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {deleting ? "Deleting…" : "Delete Draft"}
                                </button>
                                <button
                                    onClick={onBack ? onBack : () => navigate("/accountant/invoices")}
                                    className="flex items-center justify-center gap-1.5 border hover:bg-muted
                                               font-semibold text-sm py-2.5 rounded-xl transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>

                            </div>
                        </>
                    )}

                    {/* Already issued */}
                    {!isDraft && (
                        <button
                            onClick={onBack ? onBack : () => navigate("/accountant/invoices")}
                            className="w-full border font-semibold text-sm py-3 rounded-2xl hover:bg-muted transition-colors"
                        >
                            Back to Invoices
                        </button>

                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountantInvoiceReview;
