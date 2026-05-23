import { useEffect, useState } from "react";
import { feedbackApi } from "@/lib/api";
import {
    Star, Send, MessageSquare, CheckCircle2, AlertCircle,
    ChevronDown, ChevronUp, Plus, X, Shield, Clock, Eye, EyeOff, MessageCircle
} from "lucide-react";

/* ── Types ── */
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

/* ── Helpers ── */
const statusBadge = (s: string) => {
    if (s === "APPROVED")     return "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30";
    if (s === "REJECTED")     return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30";
    if (s === "UNDER_REVIEW") return "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30";
    return "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30";
};
const statusLabel = (s: string) => {
    if (s === "APPROVED")     return "Approved";
    if (s === "REJECTED")     return "Rejected";
    if (s === "UNDER_REVIEW") return "Under Review";
    return "Pending Review";
};
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── Star Rating ── */
const StarRow = ({
    value, onChange, size = "h-5 w-5",
}: {
    value: number;
    onChange?: (n: number) => void;
    size?: string;
}) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
            <button
                key={n}
                type="button"
                onClick={() => onChange?.(n)}
                className={onChange ? "cursor-pointer" : "cursor-default"}
            >
                <Star className={`${size} ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/35"}`} />
            </button>
        ))}
    </div>
);

/* ── Sub-rating tile ── */
const SubRatingTile = ({
    icon: Icon, label, value, onChange,
}: {
    icon: React.ElementType;
    label: string;
    value: number;
    onChange: (n: number) => void;
}) => (
    <div className="flex flex-col gap-1.5 bg-muted/40 rounded-xl p-3 border border-border/60">
        <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
        <StarRow value={value} onChange={onChange} size="h-4 w-4" />
        <span className="text-[10px] text-muted-foreground">Optional</span>
    </div>
);

/* ── Main Component ────────────────────────────────────────────────────────── */
const ClientFeedback = () => {
    const [list, setList]           = useState<FeedbackItem[]>([]);
    const [loading, setLoading]     = useState(true);
    const [err, setErr]             = useState("");
    const [expanded, setExpanded]   = useState<number | null>(null);
    const [showForm, setShowForm]   = useState(false);
    const [visibleCount, setVisibleCount] = useState(4);

    /* form state — matches FeedbackSubmissionRequest */
    const [overallRating, setOverallRating]         = useState(0);
    const [officerRating, setOfficerRating]         = useState(0);
    const [responseTimeRating, setResponseTimeRating] = useState(0);
    const [communicationRating, setCommunicationRating] = useState(0);
    const [comment, setComment]                     = useState("");
    const [improvements, setImprovements]           = useState("");
    const [isAnonymous, setIsAnonymous]             = useState(false);
    const [submitting, setSubmitting]               = useState(false);
    const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const token       = localStorage.getItem("token");
    const clientIdRaw = localStorage.getItem("clientId");
    const clientId    = clientIdRaw ? Number(clientIdRaw) : 0;
    const companyName = localStorage.getItem("companyName") ?? "Client";

    const load = async () => {
        try {
            const data = await feedbackApi.getByClient(clientId);
            setList(data);
        } catch (e: any) {
            setErr(e?.message ?? "Failed to load feedback");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Avoid hitting /api/feedback/client/0 (or any client endpoint) when not logged in as a client.
        if (!token || !clientIdRaw) {
            setErr("Please log in as a client to view and submit feedback.");
            setList([]);
            setLoading(false);
            return;
        }
        setErr("");
        setLoading(true);
        load();
    }, [token, clientIdRaw, clientId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!overallRating || !comment.trim()) return;
        setSubmitting(true);
        setSubmitMsg(null);
        try {
            await feedbackApi.submit(clientId, {
                overallRating,
                ...(officerRating    > 0 && { officerConductRating: officerRating }),
                ...(responseTimeRating > 0 && { responseTimeRating }),
                ...(communicationRating > 0 && { communicationRating }),
                comments: comment,
                improvements: improvements.trim() || undefined,
                isAnonymous,
            });
            setSubmitMsg({ ok: true, text: "Thank you! Your feedback has been submitted and is under review." });
            setOverallRating(0); setOfficerRating(0); setResponseTimeRating(0); setCommunicationRating(0);
            setComment(""); setImprovements(""); setIsAnonymous(false);
            load();
        } catch (e: any) {
            setSubmitMsg({ ok: false, text: e?.message ?? "Submission failed. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 pb-12 space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-foreground">My Feedback</h1>
                    <p className="text-lg text-muted-foreground mt-1">Share your experience with our security services.</p>
                </div>
                <button
                    onClick={() => { setShowForm(v => !v); setSubmitMsg(null); }}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 rounded-xl font-bold text-base transition-all shadow-sm"
                >
                    {showForm
                        ? <><X className="h-4 w-4" /> Cancel</>
                        : <><Plus className="h-4 w-4" /> Submit Feedback</>}
                </button>
            </div>

            {/* ── Submit Form ── */}
            {showForm && (
                <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-border/50 bg-muted/40">
                        <h2 className="text-lg font-black text-foreground uppercase tracking-wide">New Feedback</h2>
                        <p className="text-base text-muted-foreground mt-0.5">Your response will be reviewed before publication.</p>
                    </div>

                    {submitMsg ? (
                        <div className="p-6 space-y-4">
                            <div className={`rounded-xl p-4 flex gap-3 items-start ${submitMsg.ok ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                                {submitMsg.ok
                                    ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                    : <AlertCircle  className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                                    <p className={`text-base font-medium ${submitMsg.ok ? "text-emerald-700" : "text-red-700"}`}>
                                    {submitMsg.text}
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowForm(false); setSubmitMsg(null); }}
                                className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm transition-all"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">

                            {/* Overall rating */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    Overall Rating <span className="text-red-400">*</span>
                                </label>
                                <StarRow value={overallRating} onChange={setOverallRating} size="h-9 w-9" />
                                {overallRating === 0 && (
                                    <p className="text-[11px] text-muted-foreground">Click a star to rate</p>
                                )}
                            </div>

                            {/* Sub-ratings */}
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                                    Detailed Ratings <span className="text-muted-foreground normal-case font-normal">(optional)</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <SubRatingTile icon={Shield}        label="Officer"       value={officerRating}       onChange={setOfficerRating} />
                                    <SubRatingTile icon={Clock}         label="Response"      value={responseTimeRating}  onChange={setResponseTimeRating} />
                                    <SubRatingTile icon={MessageCircle} label="Communication" value={communicationRating} onChange={setCommunicationRating} />
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    Your Experience <span className="text-red-400">*</span>
                                    <span className="text-muted-foreground normal-case font-normal ml-1">(10–500 chars)</span>
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Tell us about your experience…"
                                    rows={5}
                                    minLength={10}
                                    maxLength={500}
                                    required
                                    className="w-full text-base border border-border rounded-xl px-3.5 py-3 bg-muted/50 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <p className="text-[10px] text-muted-foreground text-right">{comment.length}/500</p>
                            </div>

                            {/* Improvements */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    Suggestions <span className="text-muted-foreground normal-case font-normal">(optional)</span>
                                </label>
                                <textarea
                                    value={improvements}
                                    onChange={e => setImprovements(e.target.value)}
                                    placeholder="What could we do better?"
                                    rows={2}
                                    className="w-full text-base border border-border rounded-xl px-3.5 py-3 bg-muted/50 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            {/* Anonymous */}
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <button
                                    type="button"
                                    onClick={() => setIsAnonymous(v => !v)}
                                    className={`relative w-9 h-5 rounded-full transition-colors ${isAnonymous ? "bg-primary" : "bg-muted"}`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isAnonymous ? "left-[18px]" : "left-0.5"}`} />
                                </button>
                                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    {isAnonymous ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                                    Submit anonymously
                                </span>
                            </label>

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setSubmitMsg(null); }}
                                    className="px-5 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted font-bold text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !overallRating || comment.trim().length < 10}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Send className="h-4 w-4" />
                                    {submitting ? "Submitting…" : "Submit Feedback"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* ── Error ── */}
            {err && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {err}
                </div>
            )}

            {/* ── Feedback List ── */}
            {list.length === 0 && !showForm ? (
                <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-14 text-center">
                    <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="font-semibold text-muted-foreground text-base">No feedback yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Share your experience to help us improve our services.</p>
                </div>
            ) : list.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                        Your submissions ({list.length})
                    </h2>
                    {list.slice(0, visibleCount).map(fb => (
                        <div key={fb.feedbackId} className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                            <div className="p-5 sm:p-6">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        {/* Badges */}
                                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusBadge(fb.status)}`}>
                                                {statusLabel(fb.status)}
                                            </span>
                                            {fb.isAnonymous && (
                                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border flex items-center gap-0.5">
                                                    <EyeOff className="h-2.5 w-2.5" /> Anonymous
                                                </span>
                                            )}
                                            {fb.displayOnHomepage && (
                                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                                                    Public
                                                </span>
                                            )}
                                        </div>

                                        {/* Ratings */}
                                        <div className="flex flex-wrap items-center gap-4 mb-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Overall</span>
                                                <StarRow value={fb.overallRating} size="h-4 w-4" />
                                            </div>
                                            {fb.officerConductRating != null && (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Officer</span>
                                                    <StarRow value={fb.officerConductRating} size="h-4 w-4" />
                                                </div>
                                            )}
                                            {fb.responseTimeRating != null && (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Response</span>
                                                    <StarRow value={fb.responseTimeRating} size="h-4 w-4" />
                                                </div>
                                            )}
                                            {fb.communicationRating != null && (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Comm.</span>
                                                    <StarRow value={fb.communicationRating} size="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-base text-foreground leading-relaxed line-clamp-3">{fb.comments}</p>
                                    </div>

                                    <div className="text-right shrink-0 text-[11px] text-muted-foreground">
                                        {fb.submissionMonth && fb.submissionYear
                                            ? `${MONTHS[(fb.submissionMonth ?? 1) - 1]} ${fb.submissionYear}`
                                            : new Date(fb.createdAt).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" })
                                        }
                                    </div>
                                </div>

                                {/* Admin response */}
                                {fb.adminResponse && (
                                    <div className="mt-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Response from Ace Front Line</p>
                                        <p className="text-xs text-foreground leading-relaxed">{fb.adminResponse}</p>
                                    </div>
                                )}
                            </div>

                            {/* Expandable improvements */}
                            {fb.improvements && (
                                <div className="border-t border-border/50">
                                    <button
                                        onClick={() => setExpanded(expanded === fb.feedbackId ? null : fb.feedbackId)}
                                        className="w-full flex items-center justify-between px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/40 transition-colors"
                                    >
                                        <span>Suggestions submitted</span>
                                        {expanded === fb.feedbackId
                                            ? <ChevronUp className="h-3.5 w-3.5" />
                                            : <ChevronDown className="h-3.5 w-3.5" />}
                                    </button>
                                    {expanded === fb.feedbackId && (
                                        <div className="px-5 pb-4">
                                            <p className="text-sm text-muted-foreground leading-relaxed">{fb.improvements}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {list.length > visibleCount && (
                        <button
                            onClick={() => setVisibleCount(v => v + 5)}
                            className="w-full py-3 text-sm font-bold text-muted-foreground hover:text-foreground bg-card rounded-2xl border border-border/60 shadow-sm hover:bg-muted/40 transition-all"
                        >
                            Load More ({list.length - visibleCount} remaining)
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClientFeedback;
