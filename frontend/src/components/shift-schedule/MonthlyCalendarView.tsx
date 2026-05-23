import { useEffect, useState } from "react";
import { shiftScheduleApi } from "@/lib/shiftScheduleApi";
import { ShiftAssignmentModal } from "./ShiftAssignmentModal";

type Assignment = {
    id: number;
    shiftId: number;
    securityOfficerId: number;
    securityOfficerName: string;
};

type ShiftItem = {
    id: number;
    scheduleId: number;
    date: string;
    shiftType: "DAY" | "NIGHT";
    assignments: Assignment[];
};

type ScheduleData = {
    id: number;
    clientId: number;
    clientName: string;
    month: number;
    year: number;
    status: string;
    shifts?: ShiftItem[];
};

export const MonthlyCalendarView = ({
                                        scheduleId,
                                        month,
                                        year,
                                        isReadOnly = false,
                                        mode = "JSO",
                                    }: {
    scheduleId: number;
    month: number;
    year: number;
    isReadOnly?: boolean;
    mode?: "JSO" | "AREA_MANAGER";
}) => {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [shiftType, setShiftType] = useState<"DAY" | "NIGHT" | null>(null);
    const [schedule, setSchedule] = useState<ScheduleData | null>(null);
    const [searchOfficerId, setSearchOfficerId] = useState<string>("");

    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const loadSchedule = async () => {
        try {
            const data = await shiftScheduleApi.getScheduleById(scheduleId);
            setSchedule(data);
        } catch (error) {
            console.error("Failed to load schedule", error);
        }
    };

    useEffect(() => {
        loadSchedule();
    }, [scheduleId]);

    const openModal = (day: number, type: "DAY" | "NIGHT") => {
        if (isReadOnly) return;

        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        setSelectedDate(dateStr);
        setShiftType(type);
    };

    const getShiftForDay = (day: number, type: "DAY" | "NIGHT") => {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return schedule?.shifts?.find(
            (shift) => shift.date === dateStr && shift.shiftType === type
        );
    };

    const isMatchingShift = (assignments: Assignment[]) => {
        if (!searchOfficerId.trim()) return false;

        return assignments.some(
            (a) => String(a.securityOfficerId) === searchOfficerId.trim()
        );
    };

    const getShiftButtonClass = (
        assignments: Assignment[],
        type: "DAY" | "NIGHT"
    ) => {
        const count = assignments.length;
        const matching = isMatchingShift(assignments);

        if (matching) {
            // "Perfectly matching color" - High visibility Gold with glow and dark text
            return "bg-[#D4AF37] text-black font-extrabold ring-2 ring-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]";
        }

        if (count > 0) {
            return type === "DAY"
                ? "bg-amber-100 text-amber-700 border border-amber-200 font-bold"
                : "bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold";
        }

        return "bg-slate-50 text-slate-400 border border-slate-100 font-medium";
    };

    return (
        <div className="bg-white text-slate-900 p-6 rounded-3xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Calendar Map</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage and view officer shift assignments</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search Officer ID..."
                            value={searchOfficerId}
                            onChange={(e) => setSearchOfficerId(e.target.value)}
                            className="bg-slate-50 text-slate-900 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all min-w-[240px]"
                        />
                    </div>
                    {searchOfficerId && (
                        <button
                            onClick={() => setSearchOfficerId("")}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all font-bold text-sm"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                    const dayShift = getShiftForDay(day, "DAY");
                    const nightShift = getShiftForDay(day, "NIGHT");

                    const dayAssignments = dayShift?.assignments || [];
                    const nightAssignments = nightShift?.assignments || [];

                    return (
                        <div
                            key={day}
                            className="border border-slate-100 bg-slate-50/30 rounded-2xl p-3 flex flex-col items-center min-h-[160px] hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group/cell"
                        >
                            <span className="text-slate-400 font-black text-xs mb-3 group-hover/cell:text-[#D4AF37] transition-colors">{day}</span>

                            <div className="w-full flex flex-col gap-2 mt-auto">
                                <button
                                    onClick={() => openModal(day, "DAY")}
                                    disabled={isReadOnly}
                                    className={`w-full text-[10px] uppercase tracking-widest font-black py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${getShiftButtonClass(
                                        dayAssignments,
                                        "DAY"
                                    )}`}
                                >
                                    Day {dayAssignments.length > 0 && `(${dayAssignments.length})`}
                                </button>

                                {dayAssignments.length ? (
                                    <div className="text-[10px] text-slate-500 space-y-1.5 mt-1 border-t border-slate-100 pt-2 w-full">
                                        {dayAssignments.map((a) => (
                                            <div
                                                key={a.id}
                                                className={`truncate px-1 rounded ${
                                                    searchOfficerId.trim() &&
                                                    String(a.securityOfficerId) === searchOfficerId.trim()
                                                        ? "bg-[#D4AF37] text-black font-black"
                                                        : ""
                                                }`}
                                            >
                                                {a.securityOfficerName}
                                            </div>
                                        ))}
                                    </div>
                                ) : null}

                                <button
                                    onClick={() => openModal(day, "NIGHT")}
                                    disabled={isReadOnly}
                                    className={`w-full text-[10px] uppercase tracking-widest font-black py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${getShiftButtonClass(
                                        nightAssignments,
                                        "NIGHT"
                                    )}`}
                                >
                                    Night {nightAssignments.length > 0 && `(${nightAssignments.length})`}
                                </button>

                                {nightAssignments.length ? (
                                    <div className="text-[10px] text-slate-500 space-y-1.5 mt-1 border-t border-slate-100 pt-2 w-full">
                                        {nightAssignments.map((a) => (
                                            <div
                                                key={a.id}
                                                className={`truncate px-1 rounded ${
                                                    searchOfficerId.trim() &&
                                                    String(a.securityOfficerId) === searchOfficerId.trim()
                                                        ? "bg-[#D4AF37] text-black font-black"
                                                        : ""
                                                }`}
                                            >
                                                {a.securityOfficerName}
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedDate && shiftType && (
                <ShiftAssignmentModal
                    isOpen={!!selectedDate}
                    onClose={() => {
                        setSelectedDate(null);
                        setShiftType(null);
                        loadSchedule();
                    }}
                    scheduleId={scheduleId}
                    date={selectedDate}
                    shiftType={shiftType}
                    isReadOnly={isReadOnly}
                />
            )}
        </div>
    );
};