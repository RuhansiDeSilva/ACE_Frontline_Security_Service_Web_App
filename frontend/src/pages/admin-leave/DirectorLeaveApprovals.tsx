import { useEffect, useState } from "react";
import { adminLeaveApi, AdminLeaveRequestDTO } from "../../lib/adminLeaveApi";
import { Check, X } from "lucide-react";

export default function DirectorLeaveApprovals() {
    const [requests, setRequests] = useState<AdminLeaveRequestDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<AdminLeaveRequestDTO | null>(null);

    const [statusFilter, setStatusFilter] = useState("ALL");
    const [useDateFilter, setUseDateFilter] = useState(false);
    
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(now.getFullYear());

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const monthParam = useDateFilter ? currentMonth : undefined;
            const yearParam = useDateFilter ? currentYear : undefined;
            
            const reqs = await adminLeaveApi.directorRequests(statusFilter, monthParam, yearParam);
            if (!Array.isArray(reqs)) throw new Error("API invalid response");
            setRequests(reqs);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load admin leave requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [statusFilter, currentMonth, currentYear, useDateFilter]);

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

    const handleApprove = async (id: number) => {
        if (!window.confirm("Are you sure you want to approve this admin leave request?")) return;
        try {
            await adminLeaveApi.approve(id);
            alert("Leave approved successfully");
            await loadData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to approve leave");
        }
    };

    const handleRejectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;
        try {
            await adminLeaveApi.reject(selectedRequest.id, rejectionReason);
            alert("Leave rejected successfully");
            setSelectedRequest(null);
            setRejectionReason("");
            await loadData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to reject leave");
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen text-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Leave Approvals</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Review and manage administrative personnel requests</p>
                </div>
                <div className="flex flex-col items-end space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-all">
                            <input 
                                id="date-filter-toggle"
                                type="checkbox" 
                                checked={useDateFilter} 
                                onChange={(e) => setUseDateFilter(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                            />
                            <label htmlFor="date-filter-toggle" className="text-xs font-black text-slate-500 cursor-pointer uppercase tracking-widest">
                                Filter by Month
                            </label>
                        </div>
                        
                        {useDateFilter && (
                            <div className="flex items-center space-x-4 bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm">
                                <button onClick={handlePrevMonth} className="p-1 px-3 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-[#D4AF37] transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <span className="text-sm font-black text-slate-900 min-w-[60px] text-center tracking-tighter">{currentMonth}/{currentYear}</span>
                                <button onClick={handleNextMonth} className="p-1 px-3 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-[#D4AF37] transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none shadow-sm cursor-pointer"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white p-8 rounded-[2rem] w-full max-w-md border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] scale-in-center">
                        <h2 className="text-3xl font-black mb-6 text-red-600 tracking-tight">Reject Request</h2>
                        <form onSubmit={handleRejectSubmit} className="space-y-5">
                            <div>
                                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Reason for Rejection</label>
                                <textarea 
                                    required
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all font-medium h-24 resize-none"
                                    placeholder="Enter detailed reason..."
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-8">
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedRequest(null)}
                                    className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-8 py-3 rounded-xl bg-red-600 text-white font-black hover:bg-red-700 transition-all shadow-lg active:scale-95 shadow-red-600/10"
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Approvals Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested On</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dates</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="p-10 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
                                        <p className="text-slate-400 text-sm font-bold">Synchronizing requests...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={7} className="p-10 text-center">
                                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl inline-block font-bold">
                                         Error: {error}
                                    </div>
                                </td>
                            </tr>
                        ) : requests.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-10 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <p className="text-slate-500 font-black tracking-tighter">
                                            No pending administrative leave requests found.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            requests.map((r) => (
                                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-5 font-medium text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</td>
                                    <td className="p-5 font-bold text-slate-900 font-mono text-sm tracking-tight">{r.employeeId}</td>
                                    <td className="p-5">
                                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-500 font-bold text-[10px] uppercase tracking-widest border border-slate-200">
                                            {r.employeeRole.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="p-5 font-bold text-slate-900 text-sm">
                                        {r.startDate} <span className="text-slate-400 font-normal mx-1">to</span> {r.endDate}
                                    </td>
                                    <td className="p-5 max-w-xs truncate text-slate-500 font-medium" title={r.reason}>{r.reason}</td>
                                    <td className="p-5 text-center">
                                        <span className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border ${
                                            r.status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-100' : 
                                            r.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' : 
                                            'bg-yellow-50 text-yellow-600 border-yellow-100'
                                        }`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right space-x-3 whitespace-nowrap">
                                        {r.status === "PENDING" ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleApprove(r.id)}
                                                    className="inline-flex items-center px-4 py-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl border border-green-100 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm"
                                                    title="Approve"
                                                >
                                                    <Check className="w-3.5 h-3.5 mr-1" /> Approve
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedRequest(r)}
                                                    className="inline-flex items-center px-4 py-2 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl border border-red-100 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm"
                                                    title="Reject"
                                                >
                                                    <X className="w-3.5 h-3.5 mr-1" /> Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg italic">Resolved</span>
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
