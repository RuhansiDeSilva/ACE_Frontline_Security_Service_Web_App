import { useState, useEffect } from "react";
import { shiftScheduleApi } from "@/lib/shiftScheduleApi";
import { MonthlyCalendarView } from "@/components/shift-schedule/MonthlyCalendarView";

export default function OfficerSchedulePage() {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);

    const loadHistory = async () => {
        try {
            const data = await shiftScheduleApi.getMyApproved();
            setSchedules(data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    return (
        <div className="p-6 bg-[#0D0D0D] min-h-screen text-white">
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-6">Shift Scheduling (JSO)</h1>

            {!selectedSchedule ? (
                <div className="space-y-4">
                    <h2 className="text-xl text-gray-200 border-b border-gray-800 pb-2">Approved Schedules</h2>
                    {schedules.length === 0 ? (
                        <p className="text-gray-500">No schedules available yet.</p>
                    ) : (
                        <div className="grid lg:grid-cols-2 gap-4">
                            {schedules.map(s => (
                                <div key={s.id} onClick={() => setSelectedSchedule(s)} className="bg-[#1A1A1A] p-4 rounded border border-gray-800 hover:border-[#D4AF37] cursor-pointer">
                                    <h3 className="text-lg text-white">{s.month}/{s.year} - {s.clientName}</h3>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <button onClick={() => setSelectedSchedule(null)} className="text-gray-400 hover:text-white">
                        ← Back to List
                    </button>
                    <MonthlyCalendarView
                        scheduleId={selectedSchedule.id}
                        month={selectedSchedule.month}
                        year={selectedSchedule.year}
                        isReadOnly={true}
                    />
                </div>
            )}
        </div>
    );
}
