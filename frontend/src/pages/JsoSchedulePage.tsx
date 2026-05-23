import { useEffect, useState } from "react";
import { shiftScheduleApi } from "@/lib/shiftScheduleApi";
import { authService, UserProfile } from "@/services/authService";
import { MonthlyCalendarView } from "@/components/shift-schedule/MonthlyCalendarView";

/* ================= TYPES ================= */

type ShiftAssignment = {
    id: number;
    shiftId: number;
    securityOfficerId: number;
    securityOfficerName: string;
};

type Shift = {
    id: number;
    scheduleId: number;
    date: string;
    shiftType: "DAY" | "NIGHT";
    assignments: ShiftAssignment[];
};

type ScheduleData = {
    id: number;
    clientId: number;
    clientName: string;
    month: number;
    year: number;
    status: "DRAFT" | "SUBMITTED" | "APPROVED";
    submittedDate: string | null;
    approvedDate: string | null;
    createdByUserName: string;
    createdAt: string;
    updatedAt: string;
    shifts: Shift[];
};

/* ================= COMPONENT ================= */

export default function JsoSchedulePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [calendarRefreshKey, setCalendarRefreshKey] = useState<number>(0);
    
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const profile = await authService.getMyProfile();
                setUser(profile);
            } catch (error) {
                console.error("Failed to fetch user profile", error);
            }
        };
        fetchUser();
    }, []);

    const fetchSchedule = async (m: number, y: number) => {
        if (!user) return;
        setLoading(true);
        setSelectedSchedule(null);
        try {
            const data: ScheduleData = await shiftScheduleApi.getOfficerCurrentSchedule(m, y);
            setSelectedSchedule(data);
        } catch (error) {
            console.error("Schedule not found or not approved yet.");
            setSelectedSchedule(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchSchedule(selectedMonth, selectedYear);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, selectedMonth, selectedYear]);

    /* ================= MONTH NAVIGATION ================= */

    const handlePrevMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    /* ================= TRANSACTIONS ================= */

    const handleCreate = async (): Promise<void> => {
        try {
            setLoading(true);
            const data: ScheduleData = await shiftScheduleApi.createOfficerSchedule(
                selectedMonth,
                selectedYear
            );
            setSelectedSchedule(data);
            alert("Schedule draft created successfully!");
        } catch (error: any) {
            console.error(error);
            const msg = error?.response?.data?.message || error.message || "Error creating schedule.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoGenerate = async (): Promise<void> => {
        if (!selectedSchedule) return;
        try {
            setLoading(true);
            await shiftScheduleApi.autoGenerate(selectedSchedule.id);
            const updated: ScheduleData = await shiftScheduleApi.getScheduleById(selectedSchedule.id);
            setSelectedSchedule(updated);
            setCalendarRefreshKey((k) => k + 1);
            alert("Schedule auto generated successfully!");
        } catch (error: any) {
            console.error(error);
            const msg = error?.response?.data?.message || error.message || "Error during auto generation.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (): Promise<void> => {
        if (!selectedSchedule) return;
        try {
            setLoading(true);
            await shiftScheduleApi.submitSchedule(selectedSchedule.id);
            const updated: ScheduleData = await shiftScheduleApi.getScheduleById(selectedSchedule.id);
            setSelectedSchedule(updated);
            setCalendarRefreshKey((k) => k + 1);
            alert("Schedule submitted successfully!");
        } catch (error) {
            console.error(error);
            alert("Error submitting schedule.");
        } finally {
            setLoading(false);
        }
    };

    /* ================= UI ================= */

    const isJso = user?.designation === "JSO";
    const monthYearDisplay = `${selectedMonth.toString().padStart(2, "0")}/${selectedYear}`;

    return (
        <div className="p-6 bg-slate-50 min-h-screen text-slate-800">
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                Shift Scheduling
            </h1>
            <p className="text-slate-500 mb-8 text-lg font-medium">{user?.designation || "Loading..."}</p>
            
            {user && (
                <div className="mb-10 flex flex-wrap gap-4 items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged In</span>
                        <span className="text-sm font-bold text-slate-700">{user.email || user.username}</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Company</span>
                         <span className="text-sm font-black text-[#D4AF37]">{user.assignedCompany || "Not Assigned"}</span>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-6 mb-10">
                <button
                    onClick={handlePrevMonth}
                    disabled={loading}
                    className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:border-[#D4AF37] hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="text-3xl font-black text-slate-900 tracking-tighter bg-white px-8 py-3 rounded-2xl border border-slate-200 shadow-sm">
                    {monthYearDisplay}
                </div>
                <button
                    onClick={handleNextMonth}
                    disabled={loading}
                    className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:border-[#D4AF37] hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {loading ? (
                <div className="flex items-center gap-3 text-slate-500 font-medium bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm w-fit">
                     <div className="w-3 h-3 rounded-full bg-[#D4AF37] animate-pulse"></div>
                     Loading current schedule...
                </div>
            ) : !selectedSchedule ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 flex flex-col items-center justify-center gap-6 text-center shadow-xl shadow-slate-200/50">
                    {isJso ? (
                        <>
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-2 border border-slate-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900">Ready to plan?</h3>
                            <p className="text-slate-500 max-w-sm text-lg leading-relaxed">
                                We couldn't find a schedule for <span className="font-bold text-slate-900">{monthYearDisplay}</span> yet.
                            </p>
                            <button
                                onClick={handleCreate}
                                className="bg-[#D4AF37] text-black px-12 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-lg hover:shadow-yellow-600/20 active:scale-95"
                            >
                                CREATE DRAFT
                            </button>
                        </>
                    ) : (
                        <div className="space-y-4">
                             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-slate-400 text-xl font-medium">
                                The shift schedule for this month is not yet available.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 shadow-inner">
                                <span className="text-slate-900 font-black text-xl uppercase italic">
                                    {selectedSchedule.status.charAt(0)}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                    {selectedSchedule.clientName}
                                    <span className="text-sm px-3 py-1 bg-slate-100 rounded-xl text-slate-500 font-bold tracking-tighter">
                                        {monthYearDisplay}
                                    </span>
                                </h2>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className={`text-xs px-4 py-1.5 rounded-xl font-black uppercase tracking-widest border ${
                                        selectedSchedule.status === "APPROVED" ? "bg-green-50 text-green-600 border-green-200" :
                                        selectedSchedule.status === "SUBMITTED" ? "bg-blue-50 text-blue-600 border-blue-200" :
                                        "bg-yellow-50 text-yellow-600 border-yellow-200"
                                    }`}>
                                        {selectedSchedule.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {isJso && selectedSchedule.status === "DRAFT" && (
                            <div className="flex gap-4 w-full md:w-auto">
                                <button
                                    onClick={handleAutoGenerate}
                                    className="flex-1 md:flex-none bg-slate-100 text-slate-900 border border-slate-200 px-6 py-4 rounded-2xl hover:bg-slate-200 transition-all font-black text-sm"
                                >
                                    AUTO GENERATE
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 md:flex-none bg-[#D4AF37] text-black px-10 py-4 rounded-2xl hover:scale-105 font-black text-sm shadow-lg shadow-yellow-600/10 transition-all"
                                >
                                    SUBMIT PLAN
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-4 shadow-xl shadow-slate-200/50">
                        <MonthlyCalendarView
                            key={calendarRefreshKey}
                            scheduleId={selectedSchedule.id}
                            month={selectedSchedule.month}
                            year={selectedSchedule.year}
                            isReadOnly={!isJso || selectedSchedule.status !== "DRAFT"}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
