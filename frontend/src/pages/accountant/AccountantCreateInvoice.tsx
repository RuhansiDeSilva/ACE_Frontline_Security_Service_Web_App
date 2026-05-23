import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronRight, Plus, Trash2, Save, Send, AlertCircle, Info, CheckCircle } from "lucide-react";
import { invoiceApi, clientApi } from "@/lib/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatLKR = (n: number) =>
    `LKR ${(n ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

const toDateInput = (d: Date) => d.toISOString().split("T")[0];

const today = () => new Date();

const defaultDueDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(10);
    return d;
};

const firstOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    return d;
};

const lastOfMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d;
};

// ── Types ──────────────────────────────────────────────────────────────────────

type LineItem = {
    description: string;
    quantity: string;
    rate: string;
};

type ClientOption = {
    clientId: number;
    companyName: string;
};

// ── Main Component ─────────────────────────────────────────────────────────────

interface AccountantCreateInvoiceProps {
    onCancel?: () => void;
    onSuccess?: () => void;
}

const AccountantCreateInvoice = ({ onCancel, onSuccess }: AccountantCreateInvoiceProps) => {
    const navigate = useNavigate();


    // Form state
    const [clientId, setClientId] = useState<number | null>(null);
    const [billingType, setBillingType] = useState<"REGULAR" | "ONE_TIME">("REGULAR");
    const [issueDate, setIssueDate] = useState(toDateInput(today()));
    const [dueDate, setDueDate] = useState(toDateInput(defaultDueDate()));
    const [periodFrom, setPeriodFrom] = useState(toDateInput(firstOfMonth()));
    const [periodTo, setPeriodTo] = useState(toDateInput(lastOfMonth()));
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { description: "On-site Security Guard Services", quantity: "", rate: "" },
        { description: "", quantity: "", rate: "" },
    ]);

    // Clients
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [clientSearch, setClientSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState("");

    // UI state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState("");

    // Load clients
    useEffect(() => {
        clientApi.getAll().then((data: any[]) => {
            setClients(data.map((c) => ({ clientId: c.clientId, companyName: c.companyName })));
        }).catch(() => {
            setClients([]);
        });
    }, []);

    // ── Line item helpers ──────────────────────────────────────────────────────

    const updateItem = (idx: number, field: keyof LineItem, value: string) => {
        setLineItems((prev) => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], [field]: value };
            return updated;
        });
    };

    const addItem = () => {
        setLineItems((prev) => [...prev, { description: "", quantity: "", rate: "" }]);
    };

    const removeItem = (idx: number) => {
        if (lineItems.length <= 1) return;
        setLineItems((prev) => prev.filter((_, i) => i !== idx));
    };

    const itemAmount = (item: LineItem) => {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        return qty * rate;
    };

    // ── Totals ─────────────────────────────────────────────────────────────────

    const subtotal = lineItems.reduce((sum, item) => sum + itemAmount(item), 0);
    const sscl = subtotal * 0.025;
    const vat = subtotal * 0.18;
    const total = subtotal + sscl + vat;

    // ── Validation ─────────────────────────────────────────────────────────────

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!clientId) errs.client = "Please select a client.";
        if (billingType === "ONE_TIME" && !reason.trim())
            errs.reason = "Reason is required for one-time invoices.";
        if (!periodFrom) errs.periodFrom = "Service period start date is required.";
        if (!periodTo) errs.periodTo = "Service period end date is required.";
        const validItems = lineItems.filter(
            (it) => it.description.trim() && parseFloat(it.quantity) > 0 && parseFloat(it.rate) > 0,
        );
        if (validItems.length === 0)
            errs.items = "At least one line item with description, qty and rate > 0 is required.";
        return errs;
    };

    // ── Submit ─────────────────────────────────────────────────────────────────

    const handleSubmit = async (issueImmediately: boolean) => {
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setErrors({});
        setSubmitting(true);
        setSubmitError("");
        setSubmitSuccess("");

        // Build payload matching ManualInvoiceCreateRequest on the backend
        const payload = {
            clientId,
            billingType,
            issueDate,
            dueDate,
            periodFrom,
            periodTo,
            reason: reason.trim() || (billingType === "REGULAR" ? "Regular manual invoice" : ""),
            notes: notes.trim() || undefined,
            items: lineItems
                .filter((it) => it.description.trim() && parseFloat(it.quantity) > 0 && parseFloat(it.rate) > 0)
                .map((it) => ({
                    description: it.description.trim(),
                    quantity: parseFloat(it.quantity),
                    unitPrice: parseFloat(it.rate),
                })),
        };

        try {
            // Step 1: Create DRAFT invoice via POST /invoices/manual
            const created = await invoiceApi.createManual(payload);
            const newId = created?.invoiceId;
            if (!newId) throw new Error("Invoice creation succeeded but returned no ID.");

            if (issueImmediately) {
                // Step 2: Approve DRAFT → APPROVED
                await invoiceApi.approve(newId);
                // Step 3: Issue APPROVED → ISSUED (sends email to client)
                await invoiceApi.issue(newId);
                setSubmitSuccess("Invoice created and issued to client!");
                if (onSuccess) {
                    setTimeout(onSuccess, 800);
                } else {
                    setTimeout(() => navigate(`/accountant/invoices/review/${newId}`), 800);
                }
            } else {
                setSubmitSuccess("Invoice saved as draft. You can review it in the Invoice Queue.");
                if (onSuccess) {
                    setTimeout(onSuccess, 800);
                } else {
                    setTimeout(() => navigate("/accountant/invoices"), 800);
                }
            }

        } catch (e: any) {
            setSubmitError(e?.message || "Failed to create invoice. Please check all fields and try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Filtered client dropdown ───────────────────────────────────────────────

    const filteredClients = clients.filter((c) =>
        c.companyName.toLowerCase().includes(clientSearch.toLowerCase()),
    );

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                <button onClick={onCancel} className="hover:text-foreground">Invoices</button>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground font-medium">Create New</span>
            </nav>


            <div className="space-y-6 px-8 lg:px-16">
                {/* Page heading */}
                <div>
                    <h1 className="text-2xl font-black">Create Manual Invoice</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Fill in the details below to create a manual invoice for a client.
                        <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">MANUAL</span>
                    </p>
                </div>

                {/* Success / Error alerts */}
                {submitSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        {submitSuccess}
                    </div>
                )}
                {submitError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {submitError}
                    </div>
                )}

                {/* ── Section 1: Billing Details ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <h2 className="font-bold text-base border-b pb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-black text-black">1</span>
                        Billing Details
                    </h2>

                    {/* Client search */}
                    <div className="space-y-1">
                        <label className="text-sm font-semibold">Search Client <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                placeholder="Type company name to search..."
                                value={clientId ? selectedCompany : clientSearch}
                                onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    setClientId(null);
                                    setSelectedCompany("");
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                            />
                            {showDropdown && filteredClients.length > 0 && (
                                <div className="absolute z-20 bg-white border rounded-xl shadow-lg w-full mt-1 max-h-48 overflow-y-auto">
                                    {filteredClients.map((c) => (
                                        <button
                                            key={c.clientId}
                                            type="button"
                                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-yellow-50 hover:text-yellow-900 transition-colors"
                                            onMouseDown={() => {
                                                setClientId(c.clientId);
                                                setSelectedCompany(c.companyName);
                                                setClientSearch(c.companyName);
                                                setShowDropdown(false);
                                                setErrors((e) => { const n = { ...e }; delete n.client; return n; });
                                            }}
                                        >
                                            {c.companyName}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {showDropdown && clientSearch && filteredClients.length === 0 && (
                                <div className="absolute z-20 bg-white border rounded-xl shadow-lg w-full mt-1 px-3 py-3 text-sm text-muted-foreground">
                                    No clients found
                                </div>
                            )}
                        </div>
                        {errors.client && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />{errors.client}
                            </p>
                        )}
                    </div>

                    {/* Billing Type */}
                    <div className="space-y-1">
                        <label className="text-sm font-semibold">Billing Type</label>
                        <div className="flex gap-0 border rounded-xl overflow-hidden w-fit">
                            <button
                                type="button"
                                className={`px-5 py-2 text-sm font-semibold transition-colors ${billingType === "REGULAR" ? "bg-yellow-400 text-black" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                                onClick={() => setBillingType("REGULAR")}
                            >
                                Regular
                            </button>
                            <button
                                type="button"
                                className={`px-5 py-2 text-sm font-semibold transition-colors border-l ${billingType === "ONE_TIME" ? "bg-yellow-400 text-black" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                                onClick={() => setBillingType("ONE_TIME")}
                            >
                                One-time
                            </button>
                        </div>
                    </div>

                    {/* Dates grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold">Issue Date</label>
                            <input
                                type="date"
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold">Due Date</label>
                            <input
                                type="date"
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold">Service Period — From <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                value={periodFrom}
                                onChange={(e) => {
                                    setPeriodFrom(e.target.value);
                                    setErrors((er) => { const n = { ...er }; delete n.periodFrom; return n; });
                                }}
                            />
                            {errors.periodFrom && <p className="text-xs text-red-500">{errors.periodFrom}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold">Service Period — To <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                value={periodTo}
                                onChange={(e) => {
                                    setPeriodTo(e.target.value);
                                    setErrors((er) => { const n = { ...er }; delete n.periodTo; return n; });
                                }}
                            />
                            {errors.periodTo && <p className="text-xs text-red-500">{errors.periodTo}</p>}
                        </div>
                    </div>

                    {/* Reason (one-time only) */}
                    {billingType === "ONE_TIME" && (
                        <div className="space-y-1">
                            <label className="text-sm font-semibold">Reason / Description <span className="text-red-500">*</span></label>
                            <textarea
                                rows={3}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                                placeholder="Reason for this one-time invoice (required for audit trail)"
                                value={reason}
                                onChange={(e) => {
                                    setReason(e.target.value);
                                    setErrors((er) => { const n = { ...er }; delete n.reason; return n; });
                                }}
                            />
                            {errors.reason && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />{errors.reason}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Section 2: Line Items ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h2 className="font-bold text-base border-b pb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-black text-black">2</span>
                        Line Items
                    </h2>

                    {errors.items && (
                        <p className="text-xs text-red-500 flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />{errors.items}
                        </p>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">Description</th>
                                    <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground w-24">Qty</th>
                                    <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground w-36">Rate (LKR)</th>
                                    <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground w-36">Amount</th>
                                    <th className="px-3 py-2.5 w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {lineItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                className="w-full border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                                                placeholder="Item description"
                                                value={item.description}
                                                onChange={(e) => updateItem(idx, "description", e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                className="w-full border rounded-lg px-2.5 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-yellow-400"
                                                placeholder="0"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-full border rounded-lg px-2.5 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-yellow-400"
                                                placeholder="0.00"
                                                value={item.rate}
                                                onChange={(e) => updateItem(idx, "rate", e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right font-semibold text-gray-700 whitespace-nowrap">
                                            {itemAmount(item).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <button
                                                type="button"
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                                                onClick={() => removeItem(idx)}
                                                disabled={lineItems.length <= 1}
                                                title="Remove row"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center gap-2 text-sm font-semibold text-yellow-700 hover:text-yellow-900 transition-colors"
                    >
                        <span className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                            <Plus className="h-3 w-3 text-black" />
                        </span>
                        Add New Line Item
                    </button>
                </div>

                {/* ── Section 3: Notes & Summary ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Notes */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <h2 className="font-bold text-base border-b pb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-black text-black">3</span>
                            Notes &amp; Terms
                        </h2>
                        <textarea
                            rows={5}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                            placeholder="Notes visible on the client invoice PDF. Default: Net 10 days."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                            <Info className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>These notes will be visible on the client's invoice PDF. Default terms: Net 30 days unless otherwise specified.</span>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
                        <h2 className="font-bold text-base border-b pb-3">Invoice Summary</h2>
                        <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-semibold">{formatLKR(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">SSCL (2.5%)</span>
                                <span className="font-semibold">{formatLKR(sscl)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">VAT (18%)</span>
                                <span className="font-semibold">{formatLKR(vat)}</span>
                            </div>
                            <div className="border-t pt-2.5 mt-1 flex justify-between items-center">
                                <span className="font-black text-base uppercase">Total Payable</span>
                                <span className="text-xl font-black text-yellow-600">{formatLKR(total)}</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">Currency: LKR</p>
                    </div>
                </div>
            </div>

            {/* ── Action Bar ── */}
            <div className="bg-card rounded-2xl border shadow-sm px-6 py-4 flex items-center justify-between">
                <button
                    onClick={onCancel}
                    className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                    &larr; Cancel &amp; Discard
                </button>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => handleSubmit(false)}
                        disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold border-2 border-input rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        {submitting ? (
                            <span className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save as Draft
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit(true)}
                        disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-black bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-md"
                    >
                        {submitting ? (
                            <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        Issue Immediately
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountantCreateInvoice;
