import { useState, useEffect } from "react";
import { shiftScheduleApi } from "@/lib/shiftScheduleApi";
import { MonthlyCalendarView } from "@/components/shift-schedule/MonthlyCalendarView";

export default function ClientSchedulePage() {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);

    const loadCompanySchedules = async () => {
        try {
            // Mocking company ID 1 for testing
            const data = await shiftScheduleApi.getCompanyCurrent(1);
            setSchedules(data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadCompanySchedules();
    }, []);

    return (
        <div className="p-6 bg-[#0D0D0D] min-h-screen text-white">
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-6">Company Shift Schedules</h1>

            {!selectedSchedule ? (
                <div className="space-y-4">
                    {schedules.length === 0 ? (
                        <p className="text-gray-500">No approved schedules available for your company.</p>
                    ) : (
                        <div className="grid gap-4">
                            {schedules.map(s => (
                                <div key={s.id} onClick={() => setSelectedSchedule(s)} className="bg-[#1A1A1A] p-4 rounded border border-[#D4AF37] cursor-pointer hover:bg-gray-900 transition flex justify-between">
                                    <span className="text-lg text-white">Schedule - {s.month}/{s.year}</span>
                                    <span className="text-[#D4AF37]">View</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <button onClick={() => setSelectedSchedule(null)} className="text-gray-400 hover:text-white">
                        ← Back
                    </button>
                    <h2 className="text-xl text-[#D4AF37]">{selectedSchedule.month}/{selectedSchedule.year} Schedule</h2>
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
