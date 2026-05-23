import { useEffect, useState } from "react";
import { leaveRequestApi, LeaveRequestDTO, LeaveSummaryDTO } from "@/lib/leaveRequestApi";
import { getApiErrorMessage } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export default function MyLeaveRequests() {
    const [requests, setRequests] = useState<LeaveRequestDTO[]>([]);
    const [summary, setSummary] = useState<LeaveSummaryDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");

    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(now.getFullYear());

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const reqs = await leaveRequestApi.myRequests();
            if (!Array.isArray(reqs)) throw new Error("API completely failed to yield an array data response for requests");
            setRequests(reqs);

            const sum = await leaveRequestApi.mySummary(currentMonth, currentYear);
            setSummary(sum);
        } catch (err: unknown) {
            console.error(err);
            setError(getApiErrorMessage(err, "Failed to load leave requests"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // Refetch when returning to the window/tab
        const handleFocus = () => loadData();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [currentMonth, currentYear]);

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await leaveRequestApi.createRequest({ startDate, endDate, reason });
            alert("Leave request submitted successfully");
            setIsFormOpen(false);
            setStartDate("");
            setEndDate("");
            setReason("");
            await loadData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to submit request");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "text-yellow-400";
            case "PENDING_REASSIGNMENT": return "text-orange-400";
            case "APPROVED": return "text-green-400";
            case "REJECTED": return "text-red-400";
            default: return "text-gray-400";
        }
    };

    const filteredRequests = requests.filter((r) => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        const monthStart = new Date(currentYear, currentMonth - 1, 1);
        const monthEnd = new Date(currentYear, currentMonth, 0);
        // Show requests that overlap the selected month/year.
        return start <= monthEnd && end >= monthStart;
    });

    return (
        <div className="p-6 bg-[#0D0D0D] min-h-screen text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#D4AF37]">My Leave Requests</h1>
                <div className="flex space-x-4">
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="p-2 rounded border border-gray-700 hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-[#D4AF37] text-black px-4 py-2 rounded font-bold hover:bg-yellow-600"
                    >
                        + New Request
                    </button>
                </div>
            </div>

            {/* Summary Panel */}
            <div className="bg-[#1A1A1A] p-4 rounded border border-[#D4AF37] mb-6 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <button onClick={handlePrevMonth} className="px-3 py-1 border border-gray-600 rounded hover:bg-gray-800">←</button>
                    <h2 className="text-xl font-bold">{currentMonth}/{currentYear} Summary</h2>
                    <button onClick={handleNextMonth} className="px-3 py-1 border border-gray-600 rounded hover:bg-gray-800">→</button>
                </div>
                {summary && (
                    <div className="flex space-x-8">
                        <div className="text-center">
                            <p className="text-gray-400 text-sm">Monthly Limit</p>
                            <p className="text-2xl font-bold">{summary.monthlyLimit}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-400 text-sm">Used Leaves</p>
                            <p className="text-2xl font-bold text-orange-400">{summary.usedLeaves}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-400 text-sm">Remaining</p>
                            <p className="text-2xl font-bold text-green-400">{summary.remainingLeaves}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1A1A] p-6 rounded-lg w-full max-w-md border border-[#D4AF37]">
                        <h2 className="text-xl font-bold mb-4 text-[#D4AF37]">Request Leave</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">End Date</label>
                                <input
                                    type="date"
                                    required
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Reason</label>
                                <textarea
                                    required
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white h-24"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 rounded bg-[#D4AF37] text-black font-bold hover:bg-yellow-600 disabled:opacity-50"
                                >
                                    {loading ? "Submitting..." : "Submit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="bg-[#1A1A1A] rounded border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#0D0D0D] border-b border-gray-800">
                    <tr>
                        <th className="p-4 text-gray-400 font-normal">Requested On</th>
                        <th className="p-4 text-gray-400 font-normal">Dates</th>
                        <th className="p-4 text-gray-400 font-normal">Reason</th>
                        <th className="p-4 text-gray-400 font-normal">Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {error ? (
                        <tr>
                            <td colSpan={4} className="p-4 text-center text-red-500 bg-red-900/20">
                                Error loading requests: {error}
                            </td>
                        </tr>
                    ) : filteredRequests.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="p-4 text-center text-gray-500">
                                No leave requests found for {currentMonth}/{currentYear}.
                            </td>
                        </tr>
                    ) : (
                        filteredRequests.map((r) => (
                            <tr key={r.id} className="border-b border-gray-800 last:border-0 hover:bg-[#222]">
                                <td className="p-4">{new Date(r.createdAt).toLocaleDateString()}</td>
                                <td className="p-4">
                                    {r.startDate} to {r.endDate}
                                </td>
                                <td className="p-4 max-w-xs truncate" title={r.reason}>{r.reason}</td>
                                <td className={`p-4 font-medium ${getStatusColor(r.status)}`}>
                                    {r.status === "PENDING_REASSIGNMENT" ? "PENDING (Replacement)" : r.status}
                                    {r.status === "REJECTED" && r.rejectionReason && (
                                        <p className="text-xs text-gray-400 mt-1" title={r.rejectionReason}>
                                            Reason: {r.rejectionReason}
                                        </p>
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
