import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { feedbackApi } from "@/lib/api";
import {
    Star, CheckCircle, XCircle, Flag, MessageSquare, Download,
    ChevronDown, ChevronUp, Search, X, Eye, EyeOff,
    Shield, Clock, MessageCircle, ThumbsUp, AlertTriangle,
    Building2, Calendar, RefreshCw, Send
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface FeedbackItem {
    feedbackId: number;
    clientId: number;
    companyName?: string;
    overallRating: number;
    officerConductRating?: number;
    responseTimeRating?: number;
    communicationRating?: number;
    comments: string;
    improvements?: string;
    isAnonymous?: boolean;
    submissionMonth?: number;
    submissionYear?: number;
    status: string;
    isApproved?: boolean;
    displayOnHomepage?: boolean;
    adminResponse?: string | null;
    createdAt: string;
    reviewedAt?: string | null;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const statusBadge = (s: string) => {
    if (s === "APPROVED") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (s === "REJECTED") return "bg-red-500/10 text-red-500 border-red-500/20";
    if (s === "FLAGGED") return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    return "bg-amber-500/10 text-amber-500 border-amber-500/20"; // PENDING
};
const statusLabel = (s: string) =>
    ({ APPROVED: "Approved", REJECTED: "Rejected", FLAGGED: "Flagged", PENDING: "Pending" }[s] ?? s);

const StarDisplay = ({ value, size = "h-4 w-4" }: { value?: number | null; size?: string }) => {
    if (!value) return <span className="text-xs text-muted-foreground">—</span>;
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} className={`${size} ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
            ))}
        </div>
    );
};

/* ── Review Modal ─────────────────────────────────────────────────────────── */
interface ReviewModalProps {
    fb: FeedbackItem;
    onClose: () => void;
    onRefresh: () => void;
}

const ReviewModal = ({ fb, onClose, onRefresh }: ReviewModalProps) => {
    const [action, setAction] = useState<"approve_home" | "approve_internal" | "reject" | "flag" | "reply" | null>(null);
    const [notes, setNotes] = useState(fb.adminResponse ?? "");
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const handleSubmit = async () => {
        if (!action) return;
        setSubmitting(true);
        setMsg(null);
        try {
            if (action === "approve_home") {
                await feedbackApi.approve(fb.feedbackId, true);
                setMsg({ ok: true, text: "Feedback approved and set to display on homepage." });
            } else if (action === "approve_internal") {
                await feedbackApi.approve(fb.feedbackId, false);
                setMsg({ ok: true, text: "Feedback approved (internal only)." });
            } else if (action === "reject") {
                await feedbackApi.reject(fb.feedbackId, notes || undefined);
                setMsg({ ok: true, text: "Feedback rejected." });
            } else if (action === "flag") {
                await feedbackApi.flag(fb.feedbackId, notes || undefined);
                setMsg({ ok: true, text: "Feedback flagged as inappropriate." });
            } else if (action === "reply") {
                if (!notes.trim()) { setMsg({ ok: false, text: "Reply message is required." }); setSubmitting(false); return; }
                await feedbackApi.reply(fb.feedbackId, notes);
                setMsg({ ok: true, text: "Reply sent to client." });
            }
            onRefresh();
        } catch (e: any) {
            setMsg({ ok: false, text: e?.message ?? "Action failed." });
        } finally {
            setSubmitting(false);
        }
    };

    const period = fb.submissionMonth && fb.submissionYear
        ? `${MONTHS[fb.submissionMonth - 1]} ${fb.submissionYear}`
        : new Date(fb.createdAt).toLocaleDateString("en-LK", { month: "short", year: "numeric" });

    const modal = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-lg p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto border">
                {/* Modal header */}
                <div className="flex items-start justify-between p-5 border-b">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold">Review Feedback</h2>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadge(fb.status)}`}>
                                {statusLabel(fb.status)}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Issue #{fb.feedbackId} • Capturd {period}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Client info + ratings */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 rounded-lg p-4 border space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-bold">
                                    {fb.isAnonymous ? "Protected Entry" : (fb.companyName ?? "Unknown Entity")}
                                </span>
                            </div>
                            {fb.isAnonymous && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase">
                                    <EyeOff className="h-3.5 w-3.5" /> Anonymous submission
                                </div>
                            )}
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4 border space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cumulative Rating</p>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold">{fb.overallRating}</span>
                                <div>
                                    <StarDisplay value={fb.overallRating} size="h-4 w-4" />
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase mt-0.5">Weighted Score / 5.0</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sub-ratings */}
                    {(fb.officerConductRating || fb.responseTimeRating || fb.communicationRating) && (
                        <div className="grid grid-cols-3 gap-4">
                            {fb.officerConductRating != null && (
                                <div className="bg-card rounded-lg p-3 border shadow-sm text-center">
                                    <Shield className="h-4 w-4 text-primary mx-auto mb-1" />
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Officers</p>
                                    <div className="flex justify-center"><StarDisplay value={fb.officerConductRating} size="h-3 w-3" /></div>
                                </div>
                            )}
                            {fb.responseTimeRating != null && (
                                <div className="bg-card rounded-lg p-3 border shadow-sm text-center">
                                    <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Latency</p>
                                    <div className="flex justify-center"><StarDisplay value={fb.responseTimeRating} size="h-3 w-3" /></div>
                                </div>
                            )}
                            {fb.communicationRating != null && (
                                <div className="bg-card rounded-lg p-3 border shadow-sm text-center">
                                    <MessageCircle className="h-4 w-4 text-primary mx-auto mb-1" />
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Clarity</p>
                                    <div className="flex justify-center"><StarDisplay value={fb.communicationRating} size="h-3 w-3" /></div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Feedback Content */}
                    <div className="space-y-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Full Testimony
                        </p>
                        <blockquote className="bg-muted/20 rounded-xl p-4 text-sm text-foreground border leading-relaxed">
                            "{fb.comments}"
                        </blockquote>
                    </div>

                    {fb.improvements && (
                        <div className="space-y-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Modernization Directives</p>
                            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 flex gap-4">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <RefreshCw className="h-4 w-4 text-primary" />
                                </div>
                                <p className="text-sm text-foreground font-medium italic">
                                    {fb.improvements}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Existing admin response */}
                    {fb.adminResponse && action !== "reply" && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-primary mb-1">Previous Response</p>
                            <p className="text-sm text-foreground">{fb.adminResponse}</p>
                        </div>
                    )}

                    {/* Success/Error message */}
                    {msg && (
                        <div className={`rounded-lg p-3 flex gap-2 text-sm font-medium ${msg.ok ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}`}>
                            {msg.ok ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
                            {msg.text}
                        </div>
                    )}

                    {/* Action selector */}
                    {!msg?.ok && (
                        <div className="space-y-4 pt-4 border-t">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Moderation Decision</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                {[
                                    { id: "approve_home" as const, icon: <ThumbsUp className="h-4 w-4" />, label: "Approve & Display Home", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500" },
                                    { id: "approve_internal" as const, icon: <CheckCircle className="h-4 w-4" />, label: "Internal Approval Only", color: "border-primary/20 bg-primary/5 text-primary" },
                                    { id: "reject" as const, icon: <XCircle className="h-4 w-4" />, label: "Reject Feedback", color: "border-destructive/20 bg-destructive/5 text-destructive" },
                                    { id: "flag" as const, icon: <Flag className="h-4 w-4" />, label: "Flag / Escalate", color: "border-orange-500/20 bg-orange-500/5 text-orange-500" },
                                    { id: "reply" as const, icon: <Send className="h-4 w-4" />, label: "Direct Correspondent", color: "border-indigo-500/20 bg-indigo-500/5 text-indigo-500" },
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setAction(opt.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all
                                            ${action === opt.id ? opt.color + " border-transparent ring-2 ring-current ring-offset-2 ring-offset-card" : "border-border hover:bg-muted text-muted-foreground"}`}
                                    >
                                        <div className={`p-1.5 rounded-lg ${action === opt.id ? 'bg-current opacity-10' : 'bg-muted'}`}>
                                            {opt.icon}
                                        </div>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {(action === "reject" || action === "flag" || action === "reply") && (
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-muted-foreground uppercase">
                                        {action === "reply" ? "Correspondence Content *" : "Internal Justification (optional)"}
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder={
                                            action === "reply"
                                                ? "Draft your professional response..."
                                                : "Provide context for this moderation action..."
                                        }
                                        rows={3}
                                        className="w-full text-sm border rounded-lg px-4 py-3 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal footer */}
                <div className="flex gap-3 p-4 border-t bg-muted/10">
                    <button
                        onClick={onClose}
                        className="flex-1 border text-sm font-semibold hover:bg-muted py-2.5 rounded-lg transition-colors"
                    >
                        {msg?.ok ? "Return to Queue" : "Cancel"}
                    </button>
                    {!msg?.ok && (
                        <button
                            onClick={handleSubmit}
                            disabled={!action || submitting}
                            className="flex-[2] bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                        >
                            {submitting
                                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Committing…</>
                                : "Commit Decision"
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    if (typeof document === "undefined") return modal;
    return createPortal(modal, document.body);
};

/* ── Main Component ──────────────────────────────────────────────────────── */
const OperationalManagerFeedback = () => {
    const [list, setList] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED">("ALL");
    const [search, setSearch] = useState("");
    const [selectedFb, setSelectedFb] = useState<FeedbackItem | null>(null);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [downloading, setDownloading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await feedbackApi.getAll();
            setList(data);
        } catch (e: any) {
            setErr(e?.message ?? "Failed to load feedback");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDownloadReport = async () => {
        setDownloading(true);
        try { await feedbackApi.downloadReport(); }
        catch (e: any) { alert(e?.message ?? "Download failed"); }
        finally { setDownloading(false); }
    };

    const filtered = list.filter(fb => {
        const matchStatus = filter === "ALL" || fb.status === filter;
        const q = search.toLowerCase();
        const matchSearch = !q
            || (fb.companyName ?? "").toLowerCase().includes(q)
            || (fb.comments ?? "").toLowerCase().includes(q)
            || String(fb.feedbackId).includes(q);
        return matchStatus && matchSearch;
    }).sort((a, b) => {
        const taRaw = Date.parse(b.createdAt ?? "");
        const tbRaw = Date.parse(a.createdAt ?? "");
        const ta = Number.isNaN(taRaw) ? 0 : taRaw;
        const tb = Number.isNaN(tbRaw) ? 0 : tbRaw;
        return (ta - tb) || (b.feedbackId - a.feedbackId);
    });

    /* Stats */
    const pending = list.filter(f => f.status === "PENDING").length;
    const approved = list.filter(f => f.status === "APPROVED").length;
    const rejected = list.filter(f => f.status === "REJECTED").length;
    const flagged = list.filter(f => f.status === "FLAGGED").length;
    const avgRating = list.length
        ? (list.reduce((s, f) => s + (f.overallRating ?? 0), 0) / list.length).toFixed(1)
        : "—";
    const onHomepage = list.filter(f => f.displayOnHomepage).length;

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 px-16 pb-10">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Client Feedback</h1>
                    <p className="text-sm text-muted-foreground mt-1">Review and moderate partner feedback metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={load}
                        className="h-10 px-4 rounded-lg bg-card border text-sm font-semibold hover:bg-muted transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                    <button
                        onClick={handleDownloadReport}
                        disabled={downloading}
                        className="h-10 px-4 bg-yellow-400 text-black hover:bg-yellow-500 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                    >
                        <Download className="h-4 w-4" />
                        {downloading ? "Downloading…" : "Download Report"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: "TOTAL", value: list.length, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/10" },
                    { label: "PENDING", value: pending, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/10" },
                    { label: "APPROVED", value: approved, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/10" },
                    { label: "REJECTED", value: rejected, color: "text-rose-500", bg: "bg-rose-500/5", border: "border-rose-500/10" },
                    { label: "FLAGGED", value: flagged, color: "text-orange-500", bg: "bg-orange-500/5", border: "border-orange-500/10" },
                    { label: "AVG RATING", value: avgRating, color: "text-primary", bg: "bg-primary/5", border: "border-primary/10" },
                ].map(({ label, value, color, bg, border }) => (
                    <div key={label} className={`${bg} ${border} rounded-xl border p-4 flex flex-col items-center text-center group transition-colors`}>
                        <p className={`text-xl font-bold ${color}`}>{value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Homepage display notice */}
            {onHomepage > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Eye className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium">
                        <span className="font-bold text-emerald-600">{onHomepage}</span> feedback{onHomepage > 1 ? "s are" : " is"} currently appearing in the public testimonials section.
                    </p>
                </div>
            )}

            {/* Filters + Search */}
            <div className="bg-card rounded-xl border shadow-sm p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Identify testimony by keyword, company, or ID…"
                            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {(["ALL", "PENDING", "APPROVED", "REJECTED", "FLAGGED"] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border
                                    ${filter === f ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card border-border text-muted-foreground hover:bg-muted"}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error */}
            {err && <p className="text-destructive text-sm font-bold">{err}</p>}

            {/* Feedback list */}
            {
                filtered.length === 0 ? (
                    <div className="bg-card rounded-xl border border-dashed p-12 text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted mb-4 opacity-30" />
                        <p className="text-lg font-bold">No Testimonials Found</p>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">The intelligence queue is currently clear. Refine your filters or search parameters.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(fb => {
                            const period = fb.submissionMonth && fb.submissionYear
                                ? `${MONTHS[fb.submissionMonth - 1]} ${fb.submissionYear}`
                                : new Date(fb.createdAt).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" });

                            return (
                                <div key={fb.feedbackId} className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/10 group-hover:bg-primary transition-colors" />
                                    <div className="p-6">
                                        <div className="flex flex-col lg:flex-row items-start gap-6">
                                            {/* Left: company initial */}
                                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 font-bold text-lg border-2 border-background shadow-sm ${statusBadge(fb.status)}`}>
                                                {fb.isAnonymous ? "?" : (fb.companyName?.[0] ?? "C")}
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-bold text-base tracking-tight">
                                                        {fb.isAnonymous ? "Anonymous Security Partner" : (fb.companyName ?? "Unidentified Client")}
                                                    </h3>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadge(fb.status)}`}>
                                                        {statusLabel(fb.status)}
                                                    </span>
                                                    {fb.displayOnHomepage && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                                                            <Eye className="h-3 w-3" /> Showcase
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Ratings row */}
                                                <div className="flex flex-wrap gap-4 items-center py-1">
                                                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-lg border border-border/50">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Score</span>
                                                        <StarDisplay value={fb.overallRating} size="h-3.5 w-3.5" />
                                                        <span className="text-sm font-bold">{fb.overallRating}.0</span>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        {fb.officerConductRating != null && (
                                                            <div className="flex items-center gap-1.5 group/sub" title="Officers">
                                                                <Shield className="h-3.5 w-3.5 text-muted-foreground group-hover/sub:text-primary transition-colors" />
                                                                <StarDisplay value={fb.officerConductRating} size="h-3 w-3" />
                                                            </div>
                                                        )}
                                                        {fb.responseTimeRating != null && (
                                                            <div className="flex items-center gap-1.5 group/sub" title="Latency">
                                                                <Clock className="h-3.5 w-3.5 text-muted-foreground group-hover/sub:text-primary transition-colors" />
                                                                <StarDisplay value={fb.responseTimeRating} size="h-3 w-3" />
                                                            </div>
                                                        )}
                                                        {fb.communicationRating != null && (
                                                            <div className="flex items-center gap-1.5 group/sub" title="Clarity">
                                                                <MessageCircle className="h-3.5 w-3.5 text-muted-foreground group-hover/sub:text-primary transition-colors" />
                                                                <StarDisplay value={fb.communicationRating} size="h-3 w-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-sm text-foreground/80 font-medium italic border-l-2 border-primary/10 pl-4 py-0.5">
                                                    "{fb.comments}"
                                                </p>

                                                {/* Admin response */}
                                                {fb.adminResponse && (
                                                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex gap-3 transition-colors hover:bg-primary/10 group/resp">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                                            <Send className="w-3.5 h-3.5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">Architecture Response</p>
                                                            <p className="text-sm font-semibold leading-snug">{fb.adminResponse}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="shrink-0 flex items-center gap-2 w-full lg:w-auto mt-4 lg:mt-0 lg:ml-auto">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" /> {period}
                                                </span>
                                                <button
                                                    onClick={() => setSelectedFb(fb)}
                                                    className="h-10 px-4 bg-yellow-400 text-black hover:bg-yellow-500 rounded-lg font-bold text-[11px] transition-colors shadow-sm flex items-center justify-center gap-1.5"
                                                >
                                                    <Eye className="h-3.5 w-3.5" /> Review
                                                </button>
                                                <button
                                                    onClick={() => setExpanded(expanded === fb.feedbackId ? null : fb.feedbackId)}
                                                    className={`h-10 w-10 rounded-lg border flex items-center justify-center transition-colors ${expanded === fb.feedbackId ? 'bg-muted shadow-inner' : 'bg-card'}`}
                                                >
                                                    {expanded === fb.feedbackId
                                                        ? <ChevronUp className="h-4 w-4" />
                                                        : <ChevronDown className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable details */}
                                    {expanded === fb.feedbackId && (
                                        <div className="border-t px-6 pb-6 pt-4 space-y-4 bg-muted/20">
                                            {fb.improvements && (
                                                <div className="bg-card rounded-lg p-4 border shadow-sm">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                                        <RefreshCw className="h-3.5 w-3.5" /> Modernization Directives
                                                    </p>
                                                    <p className="text-sm font-medium italic">{fb.improvements}</p>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-card p-3 rounded-lg border shadow-sm">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">Traceability ID</span>
                                                    <span className="text-sm font-bold">TEST-{fb.feedbackId}</span>
                                                </div>
                                                <div className="bg-card p-3 rounded-lg border shadow-sm">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">Partner Entity</span>
                                                    <span className="text-sm font-bold">ENT-{fb.clientId}</span>
                                                </div>
                                                <div className="bg-card p-3 rounded-lg border shadow-sm">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">Operational Review</span>
                                                    <span className="text-sm font-bold">{fb.reviewedAt ? new Date(fb.reviewedAt).toLocaleDateString("en-LK", { month: 'short', day: 'numeric', year: 'numeric' }) : "PENDING AUDIT"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            }

            {
                selectedFb && (
                    <ReviewModal
                        fb={selectedFb}
                        onClose={() => setSelectedFb(null)}
                        onRefresh={() => { load(); setSelectedFb(null); }}
                    />
                )
            }
        </div >
    );
};

export default OperationalManagerFeedback;
