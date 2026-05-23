import { useState, useEffect } from "react";
import { shiftScheduleApi } from "@/lib/shiftScheduleApi";
import { MonthlyCalendarView } from "@/components/shift-schedule/MonthlyCalendarView";

export default function ExecutiveSchedulePage() {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
    const [filters, setFilters] = useState({ branch: "", company: "", month: "" });

    const handleSearch = async () => {
        try {
            const data = await shiftScheduleApi.getFilter(filters);
            setSchedules(data);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-6 bg-[#0D0D0D] min-h-screen text-white">
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-6">Shift Schedules Overview</h1>

            {!selectedSchedule ? (
                <div className="space-y-6">
                    <div className="bg-[#1A1A1A] p-4 rounded border border-gray-800 flex gap-4 items-end">
                        <div className="flex-grow">
                            <label className="text-xs text-[#D4AF37]">Branch ID</label>
                            <input type="text" onChange={e => setFilters({...filters, branch: e.target.value})} className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white" />
                        </div>
                        <div className="flex-grow">
                            <label className="text-xs text-[#D4AF37]">Company ID</label>
                            <input type="text" onChange={e => setFilters({...filters, company: e.target.value})} className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white" />
                        </div>
                        <div className="flex-grow">
                            <label className="text-xs text-[#D4AF37]">Month (1-12)</label>
                            <input type="number" onChange={e => setFilters({...filters, month: e.target.value})} className="w-full bg-[#0D0D0D] border border-gray-700 rounded p-2 text-white" />
                        </div>
                        <button onClick={handleSearch} className="bg-[#D4AF37] text-black px-6 py-2 rounded font-bold hover:bg-yellow-600 h-[42px]">
                            Search
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {schedules.map(s => (
                            <div key={s.id} onClick={() => setSelectedSchedule(s)} className="bg-[#1A1A1A] p-4 rounded border border-gray-800 hover:border-[#D4AF37] cursor-pointer">
                                <h3 className="text-xl text-white">{s.clientName}</h3>
                                <p className="text-gray-400">{s.month}/{s.year} - Status: {s.status}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <button onClick={() => setSelectedSchedule(null)} className="text-[#D4AF37] hover:text-white">
                        ← Back to Search
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
