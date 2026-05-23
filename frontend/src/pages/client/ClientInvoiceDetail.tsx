import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { invoiceApi } from "@/lib/api";
import type { Invoice } from "@/lib/client";
import {
    ChevronRight, Download, Printer, CloudUpload, Phone, Shield
} from "lucide-react";

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

const statusBadge = (s: string) => {
    const m: Record<string, string> = {
        PAID: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        PENDING: "bg-blue-100 text-blue-700 border border-blue-200",
        ISSUED:  "bg-amber-100 text-amber-700 border border-amber-200",
        OVERDUE: "bg-red-100 text-red-700 border border-red-200",
        DRAFT:   "bg-gray-100 text-gray-600 border border-gray-200",
    };
    return m[s] ?? "bg-gray-100 text-gray-600 border border-gray-200";
};

const ClientInvoiceDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr]         = useState("");

    const companyName = localStorage.getItem("companyName") ?? "Client";

    useEffect(() => {
        (async () => {
            try {
                const data = await invoiceApi.getByIdForClient(Number(id));
                setInvoice(data);
            } catch (e: any) {
                setErr(e?.message ?? "Failed to load invoice");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleDownload = async () => {
        if (!invoice) return;
        try {
            const blob = await invoiceApi.downloadPdf(invoice.invoiceId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${invoice.invoiceNumber ?? "invoice"}.pdf`;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.setTimeout(() => URL.revokeObjectURL(url), 0);
        } catch { alert("Could not download PDF."); }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (err || !invoice) return (
        <div className="flex items-center justify-center py-20">
            <p className="text-red-600 text-sm">{err || "Invoice not found"}</p>
        </div>
    );

    const period = `${MONTHS[(invoice.billingMonth ?? 1) - 1]} ${invoice.billingYear ?? ""}`;
    const invSubtotal   = invoice.subtotal        ?? 0;
    const vat           = invoice.vatAmount        ?? 0;
    const withholding   = invoice.deductionsTotal  ?? 0;
    const total         = invoice.totalAmount      ?? 0;
    const sscl          = invoice.ssclAmount       ?? 0;

    return (
        <div className="space-y-5">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Link to="/client/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link to="/client/invoices" className="hover:text-primary transition-colors">Invoices</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-semibold">{invoice.invoiceNumber ?? `INV-${invoice.invoiceId}`}</span>
                </nav>

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-black text-foreground">
                            Invoice {invoice.invoiceNumber ?? `#${invoice.invoiceId}`}
                        </h1>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${statusBadge(invoice.status)}`}>
                            {invoice.status}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => window.print()}
                            className="flex items-center gap-1.5 border border-border text-muted-foreground hover:bg-muted px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                            <Printer className="h-3.5 w-3.5" /> Print
                        </button>
                        <button onClick={handleDownload}
                            className="flex items-center gap-1.5 border border-border text-muted-foreground hover:bg-muted px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                            <Download className="h-3.5 w-3.5" /> Download
                        </button>
                        {invoice.status !== "PAID" && (
                            <button onClick={() => navigate(`/client/invoices/${id}/upload-proof`)}
                                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">
                                <CloudUpload className="h-3.5 w-3.5" /> Upload Payment Proof
                            </button>
                        )}
                    </div>
                </div>

                {/* Invoice Document Card */}
                <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden print:shadow-none">

                    {/* Company header + meta */}
                    <div className="p-6 border-b border-border/50">
                        <div className="flex flex-col sm:flex-row justify-between gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <img
                                        src="/logo.png"
                                        alt="Ace Front Line Security Logo"
                                        className="w-10 h-10 rounded-lg object-cover"
                                    />
                                    <div>
                                        <p className="font-black text-sm leading-tight text-foreground">ACE FRONT LINE SECURITY SOLUTIONS (PVT) LTD</p>
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
                                    <span className="font-bold text-foreground">{invoice.invoiceNumber}</span>
                                </div>
                                <div className="flex sm:justify-end gap-3 text-sm">
                                    <span className="text-muted-foreground">Period</span>
                                    <span className="text-foreground">
                                        {period}
                                    </span>
                                </div>
                                <div className="flex sm:justify-end gap-3 text-sm">
                                    <span className="text-muted-foreground">Issue Date</span>
                                    <span className="text-foreground">{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span>
                                </div>
                                <div className="flex sm:justify-end gap-3 text-sm">
                                    <span className="text-muted-foreground">Due Date</span>
                                    <span className="font-bold text-foreground">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 pt-4 border-t border-border/50">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Bill To</p>
                            <p className="font-bold text-foreground">{companyName}</p>
                        </div>
                    </div>

                    <div className="px-8 py-6 space-y-6">
                        {/* Dates Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            {[
                                { label: "Billing Period", value: period },
                                { label: "Issue Date", value: invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("en-LK") : "—" },
                                { label: "Due Date", value: invoice.dueDate  ? new Date(invoice.dueDate).toLocaleDateString("en-LK")  : "—", red: invoice.status === "OVERDUE" },
                                { label: "Invoice Status", value: invoice.status },
                            ].map(({ label, value, red }) => (
                                <div key={label}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                                    <p className={`font-semibold mt-0.5 ${red ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Bill To + Total Due */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="bg-muted/40 rounded-xl p-4 border border-border/40">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Bill To</p>
                                <p className="font-bold text-foreground">{companyName}</p>
                                <p className="text-sm text-muted-foreground mt-0.5">Client Portal</p>
                            </div>
                            <div className="bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 dark:border-primary/30 rounded-xl p-4 flex flex-col justify-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Total Amount Due</p>
                                <p className="text-3xl font-black text-foreground">
                                    LKR {total.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                                </p>
                                {invoice.balanceAmount != null && invoice.balanceAmount < total && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                        Balance: LKR {invoice.balanceAmount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Line Items */}
                        {invoice.items && invoice.items.length > 0 && (
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Service Details</p>
                                <div className="rounded-xl border border-border/40 overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/40">
                                        <tr className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3 text-right">QTY / HRS</th>
                                            <th className="px-4 py-3 text-right">Rate (LKR)</th>
                                            <th className="px-4 py-3 text-right">Amount (LKR)</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                        {invoice.items.map((item: any, i: number) => (
                                            <tr key={i} className="hover:bg-muted/30">
                                                <td className="px-4 py-3 font-medium text-foreground">{item.description}</td>
                                                <td className="px-4 py-3 text-right text-muted-foreground">{item.quantity ?? item.hours ?? "—"}</td>
                                                <td className="px-4 py-3 text-right text-muted-foreground">
                                                    {(item.unitPrice ?? item.rate ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-foreground">
                                                    {(item.lineTotal ?? item.amount ?? item.total ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Totals Block */}
                        <div className="flex justify-end">
                            <div className="w-full sm:w-80 space-y-2 text-sm">
                                {[
                                    { label: "Subtotal",            value: invSubtotal, cls: "" },
                                    { label: "SSCL (2.5%)",         value: sscl,        cls: "" },
                                    { label: "VAT (18%)",           value: vat,         cls: "" },
                                    { label: "Less Withholding Tax",value: -withholding, cls: "text-emerald-700" },
                                ].map(({ label, value, cls }) => (
                                    <div key={label} className="flex justify-between text-muted-foreground">
                                        <span>{label}</span>
                                        <span className={cls}>
                                            {value < 0 ? "−" : ""}LKR {Math.abs(value).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                                <div className="border-t-2 border-foreground pt-2 mt-2 flex justify-between font-black text-base text-foreground">
                                    <span>TOTAL DUE</span>
                                    <span>LKR {total.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Instructions */}
                        <div className="border border-border/40 rounded-xl p-5 space-y-4 bg-muted/30 dark:bg-muted/20">
                            <p className="font-bold text-sm text-foreground">Payment Instructions</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                {[
                                    { label: "Bank", value: "Bank of Ceylon" },
                                    { label: "Branch", value: "Lake View (612)" },
                                    { label: "Account #", value: "79289055" },
                                    { label: "Account Name", value: "Ace Front Line Security Solutions (PVT) Ltd" },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
                                        <p className="font-semibold text-foreground mt-0.5 text-xs">{value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-primary/10 dark:bg-primary/15 border border-primary/30 dark:border-primary/40 rounded-lg p-3">
                                <p className="text-[11px] font-bold text-primary uppercase tracking-wide mb-1">⚠ Mandatory Reference</p>
                                <p className="font-black text-foreground text-base">{invoice.invoiceNumber ?? `INV-${invoice.invoiceId}`}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Always include this reference in your bank transfer description.</p>
                            </div>
                        </div>

                        {/* Notes */}
                        {invoice.notes && (
                            <div className="text-xs text-muted-foreground border-t border-border/40 pt-4">
                                <p className="font-semibold mb-1">Notes</p>
                                <p>{invoice.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Support CTA */}
                <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="font-bold text-sm text-foreground">Have questions about this invoice?</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Contact our billing support team for assistance.</p>
                    </div>
                    <a href="tel:0114848177"
                        className="flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0">
                        <Phone className="h-3.5 w-3.5" /> Contact Support
                    </a>
                </div>

        </div>
    );
};

export default ClientInvoiceDetail;
