import { useState, useEffect } from "react";
import { shiftScheduleApi } from "@/lib/shiftScheduleApi";
import { MonthlyCalendarView } from "@/components/shift-schedule/MonthlyCalendarView";

type ScheduleItem = {
    id: number;
    clientId: number;
    clientName: string;
    month: number;
    year: number;
    status: string;
    submittedDate: string | null;
    approvedDate: string | null;
};

type ViewMode = "submitted" | "approved";

export default function AreaManagerSchedulePage() {
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [approvedSchedules, setApprovedSchedules] = useState<ScheduleItem[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
    const [loading, setLoading] = useState(false);

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [viewMode, setViewMode] = useState<ViewMode>("submitted");

    const loadSchedules = async () => {
        try {
            setLoading(true);

            if (viewMode === "submitted") {
                // Server-side filters by area manager's assignedArea automatically
                const submittedData = await shiftScheduleApi.getAreaManagerSchedulesForMonth(
                    selectedMonth,
                    selectedYear
                );
                const approvedData = await shiftScheduleApi.getAreaManagerApprovedHistory(
                    selectedMonth,
                    selectedYear
                );

                const approvedClientIds = new Set(
                    (Array.isArray(approvedData) ? approvedData : []).map(
                        (s: ScheduleItem) => s.clientId
                    )
                );

                const filteredSubmitted = (Array.isArray(submittedData) ? submittedData : []).filter(
                    (s: ScheduleItem) =>
                        s.clientId != null && !approvedClientIds.has(s.clientId)
                );

                setApprovedSchedules(Array.isArray(approvedData) ? approvedData : []);
                setSchedules(filteredSubmitted);
            } else {
                const approvedData = await shiftScheduleApi.getAreaManagerApprovedHistory(
                    selectedMonth,
                    selectedYear
                );
                setApprovedSchedules([]);
                setSchedules(Array.isArray(approvedData) ? approvedData : []);
            }
        } catch (error) {
            console.error(error);
            alert(
                viewMode === "submitted"
                    ? "Failed to load submitted schedules."
                    : "Failed to load approved schedules."
            );
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(prev => prev - 1);
        } else {
            setSelectedMonth(prev => prev - 1);
        }
        setSelectedSchedule(null);
    };

    const handleNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(prev => prev + 1);
        } else {
            setSelectedMonth(prev => prev + 1);
        }
        setSelectedSchedule(null);
    };

    useEffect(() => {
        setSelectedYear(currentYear);
        setSelectedMonth(currentMonth);
    }, []);

    // Build lookup maps by clientId for rendering
    const scheduleByClientId = new Map<number, ScheduleItem>();
    schedules.forEach((s) => {
        if (s?.clientId == null) return;
        if (viewMode === "submitted" && s.status !== "SUBMITTED") return;
        if (viewMode === "approved" && s.status !== "APPROVED") return;
        scheduleByClientId.set(s.clientId, s);
    });

    const approvedByClientId = new Map<number, ScheduleItem>();
    approvedSchedules.forEach((s) => {
        if (s?.clientId == null) return;
        approvedByClientId.set(s.clientId, s);
    });

    const visibleSchedules = viewMode === "approved"
        ? schedules
        : schedules.filter((s) => !approvedByClientId.has(s.clientId));

    const handleSelectOrCreateSchedule = async (schedule: ScheduleItem) => {
        await handleSelectSchedule(schedule);
    };

    useEffect(() => {
        loadSchedules();
    }, [viewMode, selectedMonth, selectedYear]);

    const handleSelectSchedule = async (schedule: ScheduleItem) => {
        try {
            setLoading(true);
            const fullSchedule = await shiftScheduleApi.getScheduleById(schedule.id);
            setSelectedSchedule(fullSchedule);
        } catch (error) {
            console.error(error);
            alert("Failed to load schedule details.");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedSchedule) return;

        try {
            setLoading(true);
            await shiftScheduleApi.approveSchedule(selectedSchedule.id);
            alert("Schedule Approved!");
            setSelectedSchedule(null);
            setViewMode("approved");
        } catch (error: unknown) {
            let message = "Error approving schedule.";

            if (typeof error === "object" && error !== null && "response" in error) {
                const err = error as {
                    response?: { data?: { message?: string } };
                };
                message = err.response?.data?.message || message;
            }

            alert(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen text-slate-800">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    {viewMode === "submitted" ? "Submitted Schedules Review" : "Approved Schedules History"}
                </h1>
                <p className="text-slate-500 mt-1 font-medium italic">
                    {viewMode === "submitted" ? "Verify and finalize client shift schedules" : "View authorized schedule history"}
                </p>
            </div>

            {!selectedSchedule ? (
                <div className="space-y-6">
                    <div className="flex gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 inline-flex shadow-sm">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedSchedule(null);
                                setViewMode("submitted");
                            }}
                            className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                viewMode === "submitted"
                                    ? "bg-[#D4AF37] text-black shadow-lg shadow-yellow-600/10"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            Pending Review
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedSchedule(null);
                                setViewMode("approved");
                            }}
                            className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                viewMode === "approved"
                                    ? "bg-[#D4AF37] text-black shadow-lg shadow-yellow-600/10"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            Approved History
                        </button>
                    </div>

                    <div className="grid grid-cols-1">
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-slate-200/40">
                            <div className="flex items-center space-x-6">
                                <button 
                                    onClick={handlePrevMonth}
                                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-400 hover:text-[#D4AF37]"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
                                    {selectedMonth}/{selectedYear} Period
                                </h2>
                                <button 
                                    onClick={handleNextMonth}
                                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-400 hover:text-[#D4AF37]"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                                {viewMode === "submitted" ? "QUEUE: PENDING APPROVAL" : "ARCHIVE: AUTHORIZED SCHEDULES"}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-20 text-center flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing schedules...</p>
                        </div>
                    ) : visibleSchedules.length === 0 ? (
                        <div className="p-20 text-center bg-white rounded-[2rem] border border-slate-200 shadow-sm opacity-60">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-slate-500 font-black tracking-tight text-xl">
                                {viewMode === "submitted"
                                    ? "No schedules pending review."
                                    : "No approved history for this period."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {visibleSchedules.map((s) => (
                                <div
                                    key={s.id}
                                    onClick={() => handleSelectOrCreateSchedule(s)}
                                    className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-[#D4AF37] flex justify-between items-center transition-all cursor-pointer group hover:shadow-xl hover:shadow-yellow-600/5 active:scale-[0.99]"
                                >
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                            {s.clientName}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Period:</span>
                                            <span className="text-sm font-bold text-slate-600 italic">
                                                {s.month}/{s.year}
                                            </span>
                                            <span className="text-slate-300 mx-2">|</span>
                                            <p className="text-xs font-medium text-slate-500 transition-colors group-hover:text-slate-900">
                                                {s.submittedDate
                                                    ? `Submitted: ${new Date(s.submittedDate).toLocaleDateString()}`
                                                    : s.approvedDate
                                                    ? `Approved: ${new Date(s.approvedDate).toLocaleDateString()}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 text-slate-400 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                                        {viewMode === "submitted" ? "OPEN REVIEW" : "VIEW DETAILS"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <button
                        onClick={() => setSelectedSchedule(null)}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-black text-[10px] uppercase tracking-widest group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to queue
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 gap-6">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                {selectedSchedule.clientName}
                            </h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="bg-[#D4AF37] text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    {selectedSchedule.status}
                                </span>
                                <span className="text-slate-400 font-bold italic">
                                    Period: {selectedSchedule.month}/{selectedSchedule.year}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleApprove}
                            disabled={loading || viewMode !== "submitted"}
                            className="bg-[#D4AF37] text-black px-12 py-3.5 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-yellow-600/10 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "AUTHORIZING..." : "APPROVE SCHEDULE"}
                        </button>
                    </div>

                    <MonthlyCalendarView
                        scheduleId={selectedSchedule.id}
                        month={selectedSchedule.month}
                        year={selectedSchedule.year}
                        isReadOnly={
                            viewMode === "approved"
                        }
                        mode="AREA_MANAGER"
                    />
                </div>
            )}
        </div>
    );
}