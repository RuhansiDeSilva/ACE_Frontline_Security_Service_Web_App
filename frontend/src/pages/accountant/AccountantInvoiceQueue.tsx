import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronRight, Search, Filter, CheckSquare, Square, AlertCircle } from "lucide-react";
import { invoiceApi } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

type QueueInvoice = {
    invoiceId: number;
    invoiceNumber: string;
    companyName: string;
    billingMonth: number;
    billingYear: number;
    subtotal: number;
    totalAmount: number;
    invoiceType: string;   // "AUTO" | "MANUAL"
    status: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTHS = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const formatLKR = (n: number) =>
    `LKR ${(n ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

const getInitials = (name: string) =>
    name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();



// ── Component ──────────────────────────────────────────────────────────────────

interface AccountantInvoiceQueueProps {
    onBackClick?: () => void;
    onReviewClick?: (id: number) => void;
}

const AccountantInvoiceQueue = ({ onBackClick, onReviewClick }: AccountantInvoiceQueueProps) => {
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState<QueueInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [approvingBatch, setApprovingBatch] = useState(false);
    const [actionMsg, setActionMsg] = useState("");

    const now = new Date();
    const periodLabel = `${MONTHS[now.getMonth() + 1]} ${now.getFullYear()}`;

    useEffect(() => {
        (async () => {
            try {
                const data = await invoiceApi.getDraft();
                setInvoices(Array.isArray(data) ? data : []);
            } catch (e: any) {
                setError(e?.message ?? "Failed to load invoice queue.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = invoices
        .filter((inv) => {
            const matchSearch =
                inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
                inv.companyName.toLowerCase().includes(search.toLowerCase());
            const matchType =
                typeFilter === "ALL" || inv.invoiceType === typeFilter;
            return matchSearch && matchType;
        })
        .sort((a, b) =>
            ((b.billingYear ?? 0) * 100 + (b.billingMonth ?? 0)) - ((a.billingYear ?? 0) * 100 + (a.billingMonth ?? 0))
            || (b.invoiceId - a.invoiceId)
        );

    const toggleSelect = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === filtered.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filtered.map((i) => i.invoiceId)));
        }
    };

    const handleApproveBatch = async () => {
        if (selected.size === 0) return;
        if (!confirm(`Approve ${selected.size} selected invoice(s)?`)) return;
        setApprovingBatch(true);
        setActionMsg("");
        try {
            await invoiceApi.approveBatch(Array.from(selected));
            setActionMsg(`${selected.size} invoice(s) approved and issued to clients.`);
            setSelected(new Set());
            const data = await invoiceApi.getDraft();
            setInvoices(Array.isArray(data) ? data : []);
        } catch {
            setActionMsg("Batch approval failed. Please try again.");
        } finally {
            setApprovingBatch(false);
        }
    };

    const totalAmount = invoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
    const autoCount = invoices.filter((i) => i.invoiceType === "AUTO").length;

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading review queue…</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">

            {/* ── Breadcrumb ── */}
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Link to="/account-executive" className="hover:text-primary">Accountant</Link>

                <ChevronRight className="w-3 h-3" />
                <button onClick={onBackClick} className="hover:text-primary">Invoices</button>

                <ChevronRight className="w-3 h-3" />
                <span className="font-semibold text-foreground">Review Queue</span>
            </nav>

            {/* ── Page header ── */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black">Invoice Review Queue – {periodLabel}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Verify and process monthly billing for the current period.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="border rounded-xl px-4 py-2 text-sm font-semibold hover:bg-muted transition-colors">
                        Change Period
                    </button>
                    <button
                        onClick={handleApproveBatch}
                        disabled={selected.size === 0 || approvingBatch}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
                    >
                        {approvingBatch ? "Approving…" : `APPROVE SELECTED${selected.size > 0 ? ` (${selected.size})` : ""}`}
                    </button>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending Review</p>
                    <p className="text-3xl font-black mt-1">{invoices.length}</p>
                </div>
                <div className="bg-card rounded-xl border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-black mt-1 text-primary">{formatLKR(totalAmount)}</p>
                </div>
                <div className="bg-card rounded-xl border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Auto-Generated</p>
                    <p className="text-3xl font-black mt-1">{autoCount}</p>
                </div>
            </div>

            {/* ── Alerts ── */}
            {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3 flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
            )}
            {actionMsg && (
                <div className={`rounded-lg text-sm p-3 border ${actionMsg.includes("failed")
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-green-50 border-green-200 text-green-700"
                    }`}>
                    {actionMsg}
                </div>
            )}

            {/* ── Search / filter bar ── */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by invoice or client…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                    <option value="ALL">All Types</option>
                    <option value="AUTO">Auto-Generated</option>
                    <option value="MANUAL">Manual</option>
                </select>
                <button className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
                    <Filter className="w-4 h-4" />
                    Filter
                </button>
            </div>

            {/* ── Table ── */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <p className="font-medium">No invoices in the queue</p>
                    <p className="text-sm mt-1">All invoices have been reviewed for this period.</p>
                </div>
            ) : (
                <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b">
                                    <th className="px-4 py-3 w-10">
                                        <button onClick={toggleAll} className="flex items-center justify-center">
                                            {selected.size === filtered.length && filtered.length > 0
                                                ? <CheckSquare className="w-4 h-4 text-primary" />
                                                : <Square className="w-4 h-4 text-muted-foreground" />
                                            }
                                        </button>
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide">Invoice #</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide">Client</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide">Period</th>
                                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide">Base Fee</th>
                                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide">Total</th>
                                    <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wide">Auto-Generated?</th>
                                    <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filtered.map((inv) => (
                                    <tr key={inv.invoiceId} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <button onClick={() => toggleSelect(inv.invoiceId)} className="flex items-center justify-center">
                                                {selected.has(inv.invoiceId)
                                                    ? <CheckSquare className="w-4 h-4 text-primary" />
                                                    : <Square className="w-4 h-4 text-muted-foreground" />
                                                }
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 font-bold">{inv.invoiceNumber}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                                                    {getInitials(inv.companyName)}
                                                </div>
                                                <span className="font-medium">{inv.companyName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {MONTHS[inv.billingMonth]} {inv.billingYear}
                                        </td>
                                        <td className="px-4 py-3 text-right">{formatLKR(inv.subtotal ?? 0)}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{formatLKR(inv.totalAmount)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {inv.invoiceType === "AUTO" ? (
                                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                                    ⚡ Auto
                                                </span>
                                            ) : (
                                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                                    Manual
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => {
                                                    if (onReviewClick) onReviewClick(inv.invoiceId);
                                                    else navigate(`/accountant/invoices/review/${inv.invoiceId}`);
                                                }}
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 py-1.5 rounded-lg transition-colors"
                                            >
                                                REVIEW
                                            </button>

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Floating batch action bar ── */}
            {selected.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-foreground text-background rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
                        <span className="text-sm font-semibold">{selected.size} Invoice{selected.size > 1 ? "s" : ""} Selected</span>
                        <button
                            onClick={() => setSelected(new Set())}
                            className="text-sm text-muted-foreground hover:text-background/80 transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleApproveBatch}
                            disabled={approvingBatch}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {approvingBatch ? "Approving…" : `APPROVE SELECTED (${selected.size})`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountantInvoiceQueue;
