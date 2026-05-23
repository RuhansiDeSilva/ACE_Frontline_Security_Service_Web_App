import { useEffect, useState } from "react";
import { leaveRequestApi, LeaveRequestDTO, AffectedShiftDTO, EligibleReplacementDTO } from "@/lib/leaveRequestApi";
import { getApiErrorMessage } from "@/lib/utils";

export default function AreaManagerLeaveApprovals() {
    const [requests, setRequests] = useState<LeaveRequestDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reassignment flow state
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequestDTO | null>(null);
    const [affectedShifts, setAffectedShifts] = useState<AffectedShiftDTO[]>([]);
    const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
    const [eligibleReplacements, setEligibleReplacements] = useState<EligibleReplacementDTO[]>([]);
    const [replacementOfficerId, setReplacementOfficerId] = useState<number | "">("");

    /** Before approve: shifts on APPROVED schedules + replacement picks */
    const [approvePreviewLeave, setApprovePreviewLeave] = useState<LeaveRequestDTO | null>(null);
    const [approvePreviewShifts, setApprovePreviewShifts] = useState<AffectedShiftDTO[]>([]);
    const [approvePreviewEligible, setApprovePreviewEligible] = useState<Record<number, EligibleReplacementDTO[]>>({});
    const [approvePreviewChoices, setApprovePreviewChoices] = useState<Record<number, number | "">>({});
    const [approvePreviewLoading, setApprovePreviewLoading] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const reqs = await leaveRequestApi.branchRequests();
            if (!Array.isArray(reqs)) throw new Error("API returned an invalid data format for branch leave requests");
            setRequests(reqs);
        } catch (err: unknown) {
            console.error(err);
            setError(getApiErrorMessage(err, "Failed to load branch leave requests"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const closeApprovePreview = () => {
        setApprovePreviewLeave(null);
        setApprovePreviewShifts([]);
        setApprovePreviewEligible({});
        setApprovePreviewChoices({});
        setApprovePreviewLoading(false);
    };

    const openApprovePreview = async (leave: LeaveRequestDTO) => {
        setApprovePreviewLeave(leave);
        setApprovePreviewLoading(true);
        setApprovePreviewShifts([]);
        setApprovePreviewEligible({});
        setApprovePreviewChoices({});
        try {
            const shifts = await leaveRequestApi.getAffectedShifts(leave.id);
            if (!Array.isArray(shifts)) throw new Error("Invalid shifts response");
            const sorted = [...shifts].sort((a, b) => a.date.localeCompare(b.date));
            setApprovePreviewShifts(sorted);
            const elig: Record<number, EligibleReplacementDTO[]> = {};
            const choices: Record<number, number | ""> = {};
            for (const s of sorted) {
                elig[s.assignmentId] = await leaveRequestApi.getEligibleReplacements(leave.id, s.assignmentId);
                choices[s.assignmentId] = "";
            }
            setApprovePreviewEligible(elig);
            setApprovePreviewChoices(choices);
        } catch (err: unknown) {
            console.error(err);
            alert(getApiErrorMessage(err, "Failed to load shifts for approval"));
            closeApprovePreview();
        } finally {
            setApprovePreviewLoading(false);
        }
    };

    const setChoiceForAssignment = (assignmentId: number, value: number | "") => {
        setApprovePreviewChoices((prev) => ({ ...prev, [assignmentId]: value }));
    };

    const confirmApproveFromPreview = async () => {
        if (!approvePreviewLeave) return;
        const leave = approvePreviewLeave;
        const shifts = approvePreviewShifts;

        if (shifts.length > 0) {
            for (const s of shifts) {
                const choice = approvePreviewChoices[s.assignmentId];
                if (choice === "" || choice === undefined) {
                    alert("Select a replacement officer for every listed shift (approved schedules only).");
                    return;
                }
                const list = approvePreviewEligible[s.assignmentId] ?? [];
                if (list.length === 0) {
                    alert(
                        `No eligible replacement for ${s.date} (${s.shiftType}). Resolve coverage before approving.`
                    );
                    return;
                }
            }
        }

        try {
            setLoading(true);
            await leaveRequestApi.approveLeave(leave.id);
            if (shifts.length > 0) {
                for (const s of shifts) {
                    const rid = Number(approvePreviewChoices[s.assignmentId]);
                    await leaveRequestApi.reassignShift(leave.id, s.assignmentId, {
                        replacementOfficerId: rid,
                    });
                }
            }
            alert("Leave approved successfully.");
            closeApprovePreview();
            await loadData();
        } catch (err: unknown) {
            console.error(err);
            alert(getApiErrorMessage(err, "Approval or reassignment failed"));
            await loadData();
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (id: number) => {
        const reason = prompt("Enter a reason for rejection (optional):");
        if (reason === null) return; // Cancelled

        try {
            setLoading(true);
            await leaveRequestApi.rejectLeave(id, reason);
            alert("Leave rejected");
            await loadData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to reject leave");
        } finally {
            setLoading(false);
        }
    };

    const openReassignmentFlow = async (leave: LeaveRequestDTO) => {
        try {
            setLoading(true);
            const shifts = await leaveRequestApi.getAffectedShifts(leave.id);
            if (!Array.isArray(shifts)) throw new Error("API returned an invalid shifts format");
            setSelectedLeave(leave);
            setAffectedShifts(shifts);
            setSelectedShiftId(null);
            setSelectedAssignmentId(null);
            setEligibleReplacements([]);
        } catch (err: unknown) {
            alert(getApiErrorMessage(err, "Failed to load affected shifts"));
        } finally {
            setLoading(false);
        }
    };

    const handleSelectShiftForReassign = async (shift: AffectedShiftDTO) => {
        if (!selectedLeave) return;
        try {
            setLoading(true);
            setSelectedShiftId(shift.shiftId);
            setSelectedAssignmentId(shift.assignmentId);
            const replacements = await leaveRequestApi.getEligibleReplacements(selectedLeave.id, shift.assignmentId);
            if (!Array.isArray(replacements)) throw new Error("API returned an invalid replacements format");
            setEligibleReplacements(replacements);
            setReplacementOfficerId("");
        } catch (err: unknown) {
            alert(getApiErrorMessage(err, "Failed to load eligible replacements"));
        } finally {
            setLoading(false);
        }
    };

    const submitReassignment = async () => {
        if (!selectedLeave || !selectedAssignmentId || replacementOfficerId === "") return;
        try {
            setLoading(true);
            await leaveRequestApi.reassignShift(selectedLeave.id, selectedAssignmentId, {
                replacementOfficerId: Number(replacementOfficerId)
            });
            alert("Shift reassigned successfully!");

            // Reload shifts for this leave to see what's remaining
            const shifts = await leaveRequestApi.getAffectedShifts(selectedLeave.id);
            if (shifts.length === 0) {
                // All shifts reassigned, leave is now fully approved
                alert("All shifts fully reassigned. Leave is now APPROVED.");
                setSelectedLeave(null);
                await loadData();
            } else {
                if (!Array.isArray(shifts)) throw new Error("API returned an invalid shifts format after reassignment");
                setAffectedShifts(shifts);
                setSelectedShiftId(null);
                setEligibleReplacements([]);
            }
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to reassign shift");
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

    return (
        <div className="p-6 bg-slate-50 min-h-screen text-slate-800">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Leave Management</h1>
                <p className="text-slate-500 mt-1 font-medium italic">Security Officer personnel requests & coverage reassignment</p>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Officer</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dates</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Reason</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {error ? (
                        <tr>
                            <td colSpan={6} className="p-10 text-center text-red-600 bg-red-50 font-bold">
                                Error loading requests: {error}
                            </td>
                        </tr>
                    ) : requests.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-10 text-center">
                                <div className="flex flex-col items-center gap-2 opacity-40">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p className="text-slate-500 font-black tracking-tighter uppercase text-xs">
                                        No branch leave requests found.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        requests.map((r) => (
                            <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                <td className="p-5 font-bold text-slate-900">{r.employeeName}</td>
                                <td className="p-5 font-medium text-slate-600 italic">{r.clientName}</td>
                                <td className="p-5 text-sm font-bold text-slate-900">
                                    {r.startDate} <span className="text-slate-400 font-normal mx-1">to</span> {r.endDate}
                                </td>
                                <td className="p-5 max-w-xs truncate text-slate-500 font-medium" title={r.reason}>{r.reason}</td>
                                <td className="p-5">
                                    <span className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border ${
                                        r.status === "APPROVED" ? "bg-green-50 text-green-600 border-green-100" :
                                        r.status === "REJECTED" ? "bg-red-50 text-red-600 border-red-100" :
                                        r.status === "PENDING_REASSIGNMENT" ? "bg-orange-50 text-orange-600 border-orange-100" :
                                        "bg-yellow-50 text-yellow-600 border-yellow-100"
                                    }`}>
                                        {r.status === "PENDING_REASSIGNMENT" ? "REASSIGNMENT REQUIRED" : r.status}
                                    </span>
                                </td>
                                <td className="p-5 text-right space-x-2 whitespace-nowrap">
                                    {r.status === "PENDING" && (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openApprovePreview(r)}
                                                disabled={loading || approvePreviewLoading}
                                                className="px-4 py-2 bg-[#D4AF37] text-black font-black hover:scale-105 transition-all rounded-xl text-[10px] uppercase tracking-widest disabled:opacity-50 shadow-sm"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(r.id)}
                                                disabled={loading}
                                                className="px-4 py-2 bg-white text-slate-400 border border-slate-200 hover:text-red-600 hover:border-red-100 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                    {r.status === "PENDING_REASSIGNMENT" && (
                                        <button
                                            onClick={() => openReassignmentFlow(r)}
                                            disabled={loading}
                                            className="px-4 py-2 bg-orange-600 text-white font-black hover:bg-orange-500 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 shadow-orange-600/10"
                                        >
                                            Reassign Shifts
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Approve: assign replacements first (APPROVED schedules only, from API) */}
            {approvePreviewLeave && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl border border-slate-200 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] max-h-[90vh] overflow-y-auto scale-in-center">
                        <div className="mb-6">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Coverage Validation</h2>
                            <p className="text-slate-500 text-sm mt-1 font-medium">Reassigning shifts on <span className="text-slate-900 font-bold italic">authorized</span> schedules before approval</p>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 border-l-4 border-l-[#D4AF37]">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Requesting Officer</p>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-black text-slate-900 tracking-tight">{approvePreviewLeave.employeeName}</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-sm font-bold text-slate-600">{approvePreviewLeave.clientName}</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-sm font-bold text-[#D4AF37] italic">{approvePreviewLeave.startDate} → {approvePreviewLeave.endDate}</span>
                            </div>
                        </div>

                        {approvePreviewLoading ? (
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Filtering eligible coverage...</p>
                            </div>
                        ) : approvePreviewShifts.length === 0 ? (
                            <>
                                <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100 mb-8 border-l-4 border-l-green-500">
                                    <p className="text-green-800 font-black text-sm mb-1 tracking-tight">No Schedule Impact</p>
                                    <p className="text-green-600 text-xs font-medium"> No shifts on authorized schedules fall in this period. You can approve this request without reassignment.</p>
                                </div>
                                <div className="flex justify-end gap-3 sticky bottom-0 bg-white/80 backdrop-blur-sm pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={closeApprovePreview}
                                        className="px-6 py-3 rounded-xl border border-slate-200 text-slate-400 font-bold hover:bg-slate-50 transition-all uppercase text-[10px] tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmApproveFromPreview}
                                        disabled={loading}
                                        className="px-8 py-3 rounded-xl bg-[#D4AF37] text-black font-black hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50 uppercase text-[10px] tracking-widest shadow-yellow-600/10"
                                    >
                                        AUTHORIZE LEAVE
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-4 mb-8">
                                    {approvePreviewShifts.map((s) => {
                                        const options = approvePreviewEligible[s.assignmentId] ?? [];
                                        const choice = approvePreviewChoices[s.assignmentId];
                                        return (
                                            <div
                                                key={s.assignmentId}
                                                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[#D4AF37]"
                                            >
                                                <div>
                                                    <div className="font-black text-slate-900 text-lg tracking-tight lowercase first-letter:uppercase">
                                                        {s.date} <span className="text-slate-300 font-normal mx-1">·</span> {s.shiftType}
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Current: {s.currentOfficerName}</div>
                                                </div>
                                                <div className="min-w-[240px]">
                                                    {options.length === 0 ? (
                                                        <div className="px-4 py-2 bg-red-50 rounded-xl border border-red-100 text-red-600 font-black text-[10px] uppercase tracking-widest">
                                                            NO ELIGIBLE COVERAGE FOUND
                                                        </div>
                                                    ) : (
                                                        <select
                                                            value={choice === "" ? "" : String(choice)}
                                                            onChange={(e) =>
                                                                setChoiceForAssignment(
                                                                    s.assignmentId,
                                                                    e.target.value === "" ? "" : Number(e.target.value)
                                                                )
                                                            }
                                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all outline-none"
                                                        >
                                                            <option value="">— Select replacement —</option>
                                                            {options.map((o) => (
                                                                <option key={o.officerId} value={o.officerId}>
                                                                    {o.officerName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-end gap-3 sticky bottom-0 bg-white/80 backdrop-blur-sm pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={closeApprovePreview}
                                        className="px-6 py-3 rounded-xl border border-slate-200 text-slate-400 font-bold hover:bg-slate-50 transition-all uppercase text-[10px] tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmApproveFromPreview}
                                        disabled={loading}
                                        className="px-8 py-3 rounded-xl bg-[#D4AF37] text-black font-black hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50 uppercase text-[10px] tracking-widest shadow-yellow-600/10"
                                    >
                                        AUTHORIZE & APPLY COVERAGE
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Reassignment Modal (PENDING_REASSIGNMENT continuation) */}
            {selectedLeave && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-5xl border border-slate-200 flex overflow-hidden max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.1)] scale-in-center">
                        {/* Left Side: Affected Shifts */}
                        <div className="w-1/2 p-8 border-r border-slate-100 overflow-y-auto bg-slate-50/50">
                            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Affected Shifts</h2>
                            <p className="text-sm font-medium text-slate-500 mb-8 italic">Choose a listed shift to prioritize reassignment</p>

                            <div className="space-y-3">
                                {affectedShifts.length === 0 ? (
                                    <p className="text-gray-500">No remaining shifts to reassign.</p>
                                ) : (
                                    affectedShifts.map(shift => (
                                        <div
                                            key={shift.shiftId}
                                            onClick={() => handleSelectShiftForReassign(shift)}
                                            className={`p-5 border-[1.5px] rounded-2xl cursor-pointer transition-all ${selectedShiftId === shift.shiftId ? 'border-[#D4AF37] bg-white shadow-lg shadow-yellow-600/5 ring-4 ring-[#D4AF37]/5 translate-x-1' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                        >
                                            <p className={`font-black tracking-tight text-lg ${selectedShiftId === shift.shiftId ? 'text-slate-900' : 'text-slate-700'}`}>{shift.date} <span className="text-slate-300 font-normal mx-1">·</span> {shift.shiftType}</p>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${selectedShiftId === shift.shiftId ? 'text-[#D4AF37]' : 'text-slate-400 italic'}`}>
                                                Officer: {shift.currentOfficerName}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Side: Eligible Replacements */}
                        <div className="w-1/2 p-8 flex flex-col bg-white">
                            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Eligible Replacements</h2>

                            {!selectedShiftId ? (
                                <div className="flex-grow flex flex-col items-center justify-center opacity-30 gap-3 grayscale">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                    </svg>
                                    <p className="text-slate-500 font-black tracking-widest text-[10px] uppercase text-center max-w-[200px]">Select a shift on the left to analyze coverage</p>
                                </div>
                            ) : (
                                <div className="flex-grow flex flex-col">
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-8 border-l-4 border-l-[#D4AF37]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Vulnerability Warning</p>
                                        <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
                                            These officers have been validated against the <span className="text-slate-900 font-bold tracking-tight">60-shifts/month, 7-consecutive-day, and duplicate-shift</span> organizational rules.
                                        </p>
                                    </div>

                                    {eligibleReplacements.length === 0 ? (
                                        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex flex-col items-center gap-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <span className="text-center italic">No eligible replacement officers available for this shift. Resolve organizational conflicts manually.</span>
                                        </div>
                                    ) : (
                                        <select
                                            value={replacementOfficerId}
                                            onChange={(e) => setReplacementOfficerId(e.target.value === "" ? "" : Number(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl text-sm font-bold focus:ring-4 focus:ring-[#D4AF37]/10 focus:border-[#D4AF37] outline-none transition-all"
                                        >
                                            <option value="" disabled>--- Select Replacement Officer ---</option>
                                            {eligibleReplacements.map(officer => (
                                                <option key={officer.officerId} value={officer.officerId}>
                                                    {officer.officerName} (ID: {officer.officerId})
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    <div className="mt-auto pt-6 flex justify-end">
                                        <button
                                            onClick={submitReassignment}
                                            disabled={loading || replacementOfficerId === ""}
                                            className="px-10 py-3.5 bg-[#D4AF37] text-black font-black rounded-2xl hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50 uppercase text-[10px] tracking-widest shadow-yellow-600/10"
                                        >
                                            {loading ? "Reassigning..." : "COMMIT REASSIGNMENT"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setSelectedLeave(null)}
                                    className="px-6 py-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors"
                                >
                                    Cancel & Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
