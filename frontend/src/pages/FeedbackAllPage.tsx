import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { feedbackApi } from "@/lib/api";
import { Star, Shield, ArrowLeft, Search, Filter } from "lucide-react";
import logoImage from "@/assets/logo.png";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface FeedbackItem {
    feedbackId: number;
    companyName?: string;
    overallRating: number;
    officerConductRating?: number;
    responseTimeRating?: number;
    communicationRating?: number;
    comments: string;
    isAnonymous?: boolean;
    submissionMonth?: number;
    submissionYear?: number;
    status: string;
    createdAt: string;
}

const StarRow = ({ value, size = "h-4 w-4" }: { value?: number | null; size?: string }) => {
    if (!value) return null;
    return (
        <div className="flex gap-0.5">
            {[1,2,3,4,5].map(n => (
                <Star key={n} className={`${size} ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
            ))}
        </div>
    );
};

const ITEMS_PER_PAGE = 9;

const FeedbackAllPage = () => {
    const [list, setList]   = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [minRating, setMinRating] = useState(1);
    const [page, setPage]   = useState(0);

    useEffect(() => {
        (async () => {
            try {
                const data = await feedbackApi.getApproved();
                setList(data);
            } catch {
                setList([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = list.filter(fb => {
        const q = search.toLowerCase();
        const matchSearch = !q
            || (fb.companyName ?? "").toLowerCase().includes(q)
            || (fb.comments ?? "").toLowerCase().includes(q);
        return matchSearch && (fb.overallRating ?? 0) >= minRating;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const visible = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

    const avgRating = list.length
        ? (list.reduce((s, f) => s + (f.overallRating ?? 0), 0) / list.length).toFixed(1)
        : "—";

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Nav bar */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <img src={logoImage} alt="Ace Front Line" className="h-8 w-8 rounded-full" />
                        <span className="font-black text-gray-900 text-base">Ace Front Line</span>
                    </Link>
                    <Link
                        to="/"
                        className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="bg-gray-900 py-14 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-primary text-xs font-black uppercase tracking-[0.3em] mb-2">Client Testimonials</p>
                    <h1 className="text-4xl font-black text-white mb-3">What Our Clients Say</h1>
                    <p className="text-gray-400 text-base mb-6 max-w-xl mx-auto">
                        Real feedback from the organizations we protect — unfiltered, unedited, and genuinely appreciated.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex">
                            {[1,2,3,4,5].map(n => (
                                <Star key={n} className="h-7 w-7 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>
                        <span className="text-3xl font-black text-white">{avgRating}</span>
                        <span className="text-gray-400 text-sm">/ 5.0 from {list.length} reviews</span>
                    </div>
                </div>
            </section>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(0); }}
                            placeholder="Search reviews by company or keyword…"
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-500 shrink-0">Min. rating:</span>
                        <div className="flex gap-1">
                            {[1,2,3,4,5].map(r => (
                                <button
                                    key={r}
                                    onClick={() => { setMinRating(r); setPage(0); }}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all
                                        ${minRating === r ? "bg-primary border-primary text-primary-foreground" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                                >
                                    {r}+
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results count */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
                <p className="text-sm text-gray-500">
                    Showing <span className="font-bold text-gray-900">{visible.length}</span> of{" "}
                    <span className="font-bold text-gray-900">{filtered.length}</span> reviews
                </p>
            </div>

            {/* Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : visible.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Star className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                        <p className="font-semibold">No reviews match your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {visible.map(fb => {
                            const period = fb.submissionMonth && fb.submissionYear
                                ? `${MONTHS[fb.submissionMonth - 1]} ${fb.submissionYear}`
                                : new Date(fb.createdAt).toLocaleDateString("en-LK", { month: "long", year: "numeric" });
                            const name = fb.isAnonymous ? "Verified Client" : (fb.companyName ?? "Anonymous");

                            return (
                                <div key={fb.feedbackId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md hover:border-primary/20 transition-all">
                                    {/* Company */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 font-black text-primary text-base">
                                            {fb.isAnonymous ? <Shield className="h-5 w-5" /> : (name[0] ?? "C")}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{name}</p>
                                            <p className="text-[11px] text-gray-400">{period}</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <StarRow value={fb.overallRating} size="h-4 w-4" />
                                            <p className="text-xs font-bold text-gray-600 mt-0.5">{fb.overallRating} / 5</p>
                                        </div>
                                    </div>

                                    {/* Quote */}
                                    <blockquote className="text-sm text-gray-600 italic leading-relaxed flex-1">
                                        "{fb.comments}"
                                    </blockquote>

                                    {/* Sub-ratings */}
                                    {(fb.officerConductRating || fb.responseTimeRating || fb.communicationRating) && (
                                        <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-50">
                                            {fb.officerConductRating != null && (
                                                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                    <Shield className="h-3 w-3" /> Officer: <span className="font-bold text-gray-700">{fb.officerConductRating}/5</span>
                                                </div>
                                            )}
                                            {fb.responseTimeRating != null && (
                                                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                    ⏱ Response: <span className="font-bold text-gray-700">{fb.responseTimeRating}/5</span>
                                                </div>
                                            )}
                                            {fb.communicationRating != null && (
                                                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                    💬 Communication: <span className="font-bold text-gray-700">{fb.communicationRating}/5</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-10">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                            ← Previous
                        </button>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i)}
                                className={`w-9 h-9 rounded-xl text-sm font-bold transition-all
                                    ${i === page ? "bg-primary text-primary-foreground" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page === totalPages - 1}
                            className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FeedbackAllPage;
