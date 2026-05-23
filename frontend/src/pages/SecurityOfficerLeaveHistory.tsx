import { useEffect, useState } from "react";
import { leaveRequestApi, LeaveRequestDTO, LeaveSummaryDTO } from "@/lib/leaveRequestApi";

export default function SecurityOfficerLeaveHistory() {
    const [requests, setRequests] = useState<LeaveRequestDTO[]>([]);
    const [summary, setSummary] = useState<LeaveSummaryDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [showAll, setShowAll] = useState(false);

    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(now.getFullYear());

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const reqs = await leaveRequestApi.myRequests();
            if (!Array.isArray(reqs)) throw new Error("Unexpected API response");
            setRequests(reqs);

            const sum = await leaveRequestApi.mySummary(currentMonth, currentYear);
            setSummary(sum);
        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data?.message || err?.message || "Failed to load leave requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentMonth, currentYear]);

    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear((y) => y - 1);
        } else {
            setCurrentMonth((m) => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear((y) => y + 1);
        } else {
            setCurrentMonth((m) => m + 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        try {
            // Setup validation dates
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Validation 1: Past dates not allowed
            if (start < today) {
                setFormError("Leave request cannot start on a past date.");
                return;
            }

            // Validation 2: End date must not be before start date
            if (end < start) {
                setFormError("End date cannot be earlier than start date.");
                return;
            }

            setSubmitting(true);
            await leaveRequestApi.createRequest({ startDate, endDate, reason });
            alert("Leave request submitted successfully");
            setIsFormOpen(false);
            setStartDate("");
            setEndDate("");
            setReason("");
            await loadData();
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this pending leave request?")) {
            return;
        }

        try {
            await leaveRequestApi.deleteRequest(id);
            alert("Leave request deleted successfully.");
            await loadData();
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to delete leave request.");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING":
            case "PENDING_REASSIGNMENT":
                return "text-yellow-400";
            case "APPROVED":
                return "text-green-400";
            case "REJECTED":
                return "text-red-400";
            default:
                return "text-gray-400";
        }
    };

    const filteredRequests = requests.filter((r) => {
        if (showAll) return true;
        const [sy, sm] = r.startDate.split("-").map(Number);
        const [ey, em] = r.endDate.split("-").map(Number);
        const reqStart = sy * 12 + sm;
        const reqEnd = ey * 12 + em;
        const current = currentYear * 12 + currentMonth;
        return current >= reqStart && current <= reqEnd;
    });

    return (
        <div className="p-6 bg-slate-50 min-h-screen text-slate-800">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Leave Requests</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Officer Self-Service Management</p>
                </div>
                <button
                    onClick={() => {
                        setFormError(null);
                        setIsFormOpen(true);
                    }}
                    className="bg-[#D4AF37] text-black px-8 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-yellow-600/10 active:scale-95"
                >
                    + NEW REQUEST
                </button>
            </div>

            {/* Summary Panel */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 mb-10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-slate-200/40">
                <div className="flex items-center space-x-6">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
                        {currentMonth}/{currentYear} Summary
                    </h2>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                {summary && (
                    <div className="flex items-center gap-12">
                        <div className="text-center px-4">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Monthly Limit</p>
                            <p className="text-3xl font-black text-slate-900">{summary.monthlyLimit}</p>
                        </div>
                        <div className="text-center px-4 border-l border-slate-100">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Used</p>
                            <p className="text-3xl font-black text-[#D4AF37]">{summary.usedLeaves}</p>
                        </div>
                        <div className="text-center px-4 border-l border-slate-100">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Remaining</p>
                            <p className="text-3xl font-black text-green-500">{summary.remainingLeaves}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* New Request Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white p-8 rounded-[2rem] w-full max-w-md border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] scale-in-center">
                        <h2 className="text-3xl font-black mb-6 text-slate-900 tracking-tight">Request Leave</h2>
                        {formError && (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {formError}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">End Date</label>
                                <input
                                    type="date"
                                    required
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Reason</label>
                                <textarea
                                    required
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all font-medium h-24 resize-none"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-3 rounded-xl bg-[#D4AF37] text-black font-black hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? "Submitting..." : "SUBMIT"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="flex justify-between items-center mb-6 mt-12">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Request History</h2>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-all">
                    <input
                        id="show-all"
                        type="checkbox"
                        checked={showAll}
                        onChange={(e) => setShowAll(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <label htmlFor="show-all" className="text-xs font-bold text-slate-500 cursor-pointer">
                        SHOW FULL HISTORY
                    </label>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested On</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dates</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-10 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
                                        <p className="text-slate-400 text-sm font-bold">Synchronizing history...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={5} className="p-10 text-center">
                                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl inline-block font-bold">
                                         Error: {error}
                                    </div>
                                </td>
                            </tr>
                        ) : filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-10 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-slate-500 font-black tracking-tighter">
                                            {showAll
                                                ? "No leave requests found."
                                                : `No history available for ${currentMonth}/${currentYear}.`}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((r) => (
                                <tr
                                    key={r.id}
                                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group"
                                >
                                    <td className="p-5 font-medium text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</td>
                                    <td className="p-5 font-bold text-slate-900">
                                        <span className="text-slate-400 font-normal mr-2">From</span>{r.startDate} 
                                        <span className="text-slate-400 font-normal mx-2">to</span>{r.endDate}
                                    </td>
                                    <td className="p-5 max-w-xs truncate text-slate-500 font-medium" title={r.reason}>
                                        {r.reason}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border ${
                                                r.status === "APPROVED" ? "bg-green-50 text-green-600 border-green-100" :
                                                r.status === "REJECTED" ? "bg-red-50 text-red-600 border-red-100" :
                                                "bg-yellow-50 text-[#D4AF37] border-yellow-100"
                                            }`}>
                                                {r.status}
                                            </span>
                                            {r.status === "REJECTED" && r.rejectionReason && (
                                                <p className="text-[10px] text-slate-400 mt-1 max-w-[150px] leading-tight" title={r.rejectionReason}>
                                                    {r.rejectionReason}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        {r.status === "PENDING" && (
                                            <button
                                                onClick={() => handleDelete(r.id)}
                                                className="bg-red-50 text-red-400 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                                title="Cancel Request"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
