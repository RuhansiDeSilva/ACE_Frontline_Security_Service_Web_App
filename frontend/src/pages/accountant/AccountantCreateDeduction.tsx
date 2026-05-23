import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deductionApi, clientApi, invoiceApi } from "@/lib/api";
import {
    Building2, CalendarDays, AlertCircle, CheckCircle2,
    ChevronLeft, Info, TrendingDown, User,
} from "lucide-react";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const fmtLKR = (n: number) =>
    n.toLocaleString("en-LK", { minimumFractionDigits: 2 });

const DEDUCTION_TYPES = [
    { value: "ABSENCE", label: "Absence", desc: "Officer absent without approved replacement" },
    { value: "MISCONDUCT", label: "Misconduct", desc: "Reported behavioral or conduct issue" },
    { value: "SLA_BREACH", label: "SLA Breach", desc: "Failure to meet service level agreement" },
    { value: "EQUIPMENT_NON_COMPLIANCE", label: "Equipment / Uniform", desc: "Uniform or equipment non-compliance" },
    { value: "CUSTOM", label: "Custom", desc: "Enter a custom amount and reason" },
];

interface AccountantCreateDeductionProps {
    onCancel?: () => void;
    onSuccess?: () => void;
}

const AccountantCreateDeduction = ({ onCancel, onSuccess }: AccountantCreateDeductionProps) => {
    const navigate = useNavigate();

    /* ── Form state ── */
    const [clientId, setClientId] = useState<number | "">("");
    const [deductionType, setDeductionType] = useState("");
    const [amount, setAmount] = useState("");
    const [incidentDate, setIncidentDate] = useState("");
    const [officerName, setOfficerName] = useState("");
    const [description, setDescription] = useState("");
    const [targetMonth, setTargetMonth] = useState<number>(new Date().getMonth() + 1);
    const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());

    /* ── Data state ── */
    const [clients, setClients] = useState<any[]>([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [clientsErr, setClientsErr] = useState("");
    const [clientSearch, setClientSearch] = useState("");
    const [showClientDrop, setShowClientDrop] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any | null>(null);

    /* ── Invoice preview state ── */
    const [previewInvoice, setPreviewInvoice] = useState<any | null>(null);
    const [pendingDeductions, setPendingDeductions] = useState(0);
    const [willBeQueued, setWillBeQueued] = useState(false);

    /* ── Submission ── */
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formErr, setFormErr] = useState("");

    /* Load clients once */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setClientsLoading(true);
            setClientsErr("");
            try {
                const data = await clientApi.getActive();
                if (!cancelled) setClients(data);
            } catch (e: any) {
                if (!cancelled) {
                    setClientsErr(e?.message || "Failed to load clients. Please login again.");
                }
            } finally {
                if (!cancelled) setClientsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    /* When client + period changes, load invoice preview */
    useEffect(() => {
        if (!clientId) {
            setPreviewInvoice(null);
            setPendingDeductions(0);
            setWillBeQueued(false);
            return;
        }
        (async () => {
            try {
                const [invoices, unapplied] = await Promise.all([
                    invoiceApi.getByClient(clientId as number),
                    deductionApi.getUnapplied(clientId as number),
                ]);
                const match = invoices.find(
                    (inv: any) => inv.billingMonth === targetMonth && inv.billingYear === targetYear
                );
                setPreviewInvoice(match ?? null);
                setWillBeQueued(match?.status === "ISSUED" || match?.status === "PAID" || match?.status === "APPROVED");
                setPendingDeductions(
                    unapplied.reduce((s: number, d: any) => s + (Number(d.amount) || 0), 0)
                );
            } catch {
                setPreviewInvoice(null);
            }
        })();
    }, [clientId, targetMonth, targetYear]);

    /* Client search dropdown */
    const filteredClients = clients.filter(c =>
        c.companyName?.toLowerCase().includes(clientSearch.toLowerCase())
    ).slice(0, 8);

    const selectClient = (c: any) => {
        const resolvedClientId = Number(c?.clientId ?? c?.id);
        if (!Number.isFinite(resolvedClientId) || resolvedClientId <= 0) {
            setFormErr("Client selection is invalid. Please select a client from the list.");
            setClientId("");
            setSelectedClient(null);
            return;
        }
        setSelectedClient(c);
        setClientId(resolvedClientId);
        setClientSearch(c.companyName);
        setShowClientDrop(false);
    };

    /* ── Validate ── */
    const hasValidClientId = typeof clientId === "number" && Number.isFinite(clientId) && clientId > 0;
    const canSubmit = hasValidClientId && deductionType && amount && Number(amount) > 0 && incidentDate;

    const missingFields: string[] = [];
    if (!hasValidClientId) missingFields.push("Select a client");
    if (!deductionType) missingFields.push("Choose a deduction type");
    if (!amount || Number(amount) <= 0) missingFields.push("Enter a valid amount");
    if (!incidentDate) missingFields.push("Pick an incident date");

    /* ── Submit ── */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) {
            if (clientsErr) {
                setFormErr(clientsErr);
                return;
            }
            if (!clientsLoading && clients.length === 0) {
                setFormErr("No active clients are available. Start by registering a client, then try again.");
                return;
            }
            setFormErr(`Please complete: ${missingFields.join(", ")}`);
            return;
        }
        setSubmitting(true);
        setFormErr("");
        try {
            const finalDescription = description.trim() || `Deduction (${deductionType || "CUSTOM"}) on ${incidentDate}`;
            await deductionApi.create({
                clientId: clientId as number,
                deductionType,
                amount: Number(amount),
                incidentDate,
                description: finalDescription,
                officerName: officerName.trim() || undefined,
                targetBillingMonth: targetMonth,
                targetBillingYear: targetYear,
            });
            setSuccess(true);
            setTimeout(() => {
                if (onSuccess) onSuccess();
                else navigate("/accountant/deductions");
            }, 1800);
        } catch (e: any) {
            setFormErr(e?.message ?? "Failed to create deduction");
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Preview values ── */
    const amountNum = Number(amount) || 0;
    const invoiceTotal = previewInvoice?.totalAmount ?? 0;
    const adjustedTotal = Math.max(0, invoiceTotal - pendingDeductions - amountNum);

    if (success) return (
        <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-12 w-12" />
                <p className="text-lg font-bold">Deduction Created</p>
                <p className="text-sm text-muted-foreground">Redirecting to deductions list…</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-5 px-6 pb-10 max-w-5xl mx-auto">

            {/* ── Breadcrumb + Header ── */}
            <div>
                <button
                    onClick={() => {
                        if (onCancel) onCancel();
                        else navigate("/accountant/deductions");
                    }}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" /> Back to Deductions
                </button>
                <h2 className="text-2xl font-black text-foreground">Create New Deduction</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Record a financial penalty against a client account due to a service incident.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── Form ── */}
                <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">

                    {/* Client + Type */}
                    <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6 space-y-4">
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <span className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </span>
                            Incident Details
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Client search */}
                            <div className="sm:col-span-2 relative">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
                                    Select Client *
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input
                                        value={clientSearch}
                                        onChange={e => {
                                            setClientSearch(e.target.value);
                                            setShowClientDrop(true);
                                            if (!e.target.value) { setClientId(""); setSelectedClient(null); }
                                        }}
                                        onFocus={() => setShowClientDrop(true)}
                                        onBlur={() => setTimeout(() => setShowClientDrop(false), 150)}
                                        placeholder="Search clients (e.g. Grand Plaza…)"
                                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-muted/50 text-foreground placeholder:text-muted-foreground"
                                    />
                                </div>

                                {clientsLoading && (
                                    <div className="mt-2 text-xs text-gray-400">Loading clients…</div>
                                )}
                                {!clientsLoading && clientsErr && (
                                    <div className="mt-2 text-xs text-red-600">{clientsErr}</div>
                                )}
                                {!clientsLoading && !clientsErr && clients.length === 0 && (
                                    <div className="mt-2 text-xs text-amber-600">
                                        No active clients available (or you’re not authenticated).
                                    </div>
                                )}

                                {showClientDrop && filteredClients.length > 0 && (
                                    <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                        {filteredClients.map(c => (
                                            <button
                                                key={c.clientId ?? c.id}
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    selectClient(c);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left text-sm"
                                            >
                                                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 font-bold text-xs text-primary">
                                                    {c.companyName?.[0] ?? "C"}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{c.companyName}</p>
                                                    <p className="text-[11px] text-gray-400">{c.serviceLocation ?? "—"}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {clientSearch.length >= 2 && filteredClients.length === 0 && showClientDrop && (
                                    <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">
                                        No matching clients
                                    </div>
                                )}
                            </div>

                            {/* Deduction type */}
                            <div className="sm:col-span-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
                                    Deduction Type *
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {DEDUCTION_TYPES.map(t => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setDeductionType(t.value)}
                                            className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${deductionType === t.value
                                                ? "border-primary bg-primary/10 text-foreground"
                                                : "border-border bg-muted/50 text-muted-foreground hover:border-border/80 hover:bg-muted"
                                                }`}
                                        >
                                            <p className="font-bold">{t.label}</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Amount + Dates + Officer */}
                    <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6 space-y-4">
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <span className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center">
                                <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                            </span>
                            Amount &amp; Timing
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {/* Amount */}
                            <div>
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
                                    Amount (LKR) *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">Rs.</span>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-muted/50 text-foreground"
                                    />
                                </div>
                            </div>

                            {/* Incident date */}
                            <div>
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
                                    Incident Date *
                                </label>
                                <input
                                    type="date"
                                    value={incidentDate}
                                    onChange={e => setIncidentDate(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-muted/50 text-foreground"
                                />
                            </div>

                            {/* Target billing month */}
                            <div>
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
                                    Target Billing Month *
                                </label>
                                <select
                                    value={targetMonth}
                                    onChange={e => setTargetMonth(Number(e.target.value))}
                                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-muted/50 text-foreground"
                                >
                                    {MONTH_NAMES.map((m, i) => (
                                        <option key={i + 1} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Target billing year */}
                            <div>
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                                    Target Billing Year *
                                </label>
                                <select
                                    value={targetYear}
                                    onChange={e => setTargetYear(Number(e.target.value))}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50"
                                >
                                    {[2024, 2025, 2026, 2027].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Officer name */}
                            <div className="sm:col-span-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                                    Officer Involved (optional)
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <input
                                        value={officerName}
                                        onChange={e => setOfficerName(e.target.value)}
                                        placeholder="Officer name"
                                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
                            Incident Description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Provide detailed notes regarding the deduction reason, what happened, and any supporting context…"
                            className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-muted/50 text-foreground resize-none"
                        />
                        <p className="text-[11px] text-muted-foreground mt-2">
                            If left empty, a default description will be saved.
                        </p>
                    </div>

                    {/* Error */}
                    {formErr && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <div className="space-y-0.5">
                                {String(formErr)
                                    .split("\n")
                                    .filter(Boolean)
                                    .map((line, idx) => (
                                        <div key={idx} className="leading-snug">
                                            {line}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={!canSubmit || submitting}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-black font-black px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-primary/20"
                        >
                            {submitting ? (
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            Create Deduction
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (onCancel) onCancel();
                                else navigate("/accountant/deductions");
                            }}
                            className="px-5 py-2.5 text-sm font-semibold text-muted-foreground border border-border rounded-xl hover:bg-muted transition-all"
                        >Cancel</button>
                    </div>

                    {!canSubmit && !submitting && missingFields.length > 0 && (
                        <div className="text-xs text-gray-400">
                            To enable Create: {missingFields.join(" • ")}
                        </div>
                    )}
                </form>

                {/* ── Right Panel ── */}
                <div className="space-y-4">

                    {/* Invoice Impact Preview */}
                    <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
                            <span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                <TrendingDown className="h-3.5 w-3.5 text-primary" />
                            </span>
                            Invoice Impact Preview
                        </h3>

                        {!selectedClient ? (
                            <p className="text-xs text-muted-foreground text-center py-4">Select a client to see invoice preview</p>
                        ) : (
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-border/40">
                                    <span className="text-muted-foreground">
                                        {MONTH_NAMES[targetMonth - 1]} {targetYear} Invoice
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {previewInvoice ? fmtLKR(invoiceTotal) : "No invoice yet"}
                                    </span>
                                </div>
                                {previewInvoice && (
                                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                                        <span>Pending Deductions</span>
                                        <span className="font-semibold">− LKR {fmtLKR(pendingDeductions)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-red-500">
                                    <span>New Deduction</span>
                                    <span className="font-semibold">− LKR {amountNum > 0 ? fmtLKR(amountNum) : "0.00"}</span>
                                </div>
                                {previewInvoice && (
                                    <>
                                        <div className="h-px border-t border-dashed border-border/60 my-1" />
                                        <div className="flex justify-between">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Adjusted Total</span>
                                            <span className="text-base font-black text-foreground">LKR {fmtLKR(adjustedTotal)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Queuing notice */}
                    {willBeQueued && (
                        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
                            <div className="flex items-start gap-2.5">
                                <Info className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-sky-700">Invoice Already Issued</p>
                                    <p className="text-xs text-sky-600 mt-0.5 leading-relaxed">
                                        The invoice for {MONTH_NAMES[targetMonth - 1]} {targetYear} is already{" "}
                                        <strong>{previewInvoice?.status}</strong>. This deduction will be automatically
                                        queued for the next month's invoice.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Policy note */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <div className="flex items-start gap-2.5">
                            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-700">Approval Policy</p>
                                <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                                    All deductions are created with <strong>PENDING</strong> status and must be
                                    approved before they are applied to an invoice. Deductions over LKR 25,000
                                    should be reviewed carefully.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Selected client context */}
                    {selectedClient && (
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Client Context</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 font-bold text-sm text-primary">
                                    {selectedClient.companyName?.[0] ?? "C"}
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">{selectedClient.companyName}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{selectedClient.serviceLocation ?? "—"}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountantCreateDeduction;
