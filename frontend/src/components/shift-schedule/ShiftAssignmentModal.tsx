import { useState, useEffect } from "react";
import { shiftScheduleApi } from "@/lib/shiftScheduleApi";

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

export const ShiftAssignmentModal = ({
                                         isOpen,
                                         onClose,
                                         scheduleId,
                                         date,
                                         shiftType,
                                         isReadOnly = false,
                                         mode = "JSO"
                                     }: {
    isOpen: boolean;
    onClose: () => void;
    scheduleId: number;
    date: string;
    shiftType: "DAY" | "NIGHT";
    isReadOnly?: boolean;
    mode?: "JSO" | "AREA_MANAGER";
}) => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [newOfficerId, setNewOfficerId] = useState("");

    const loadAssignments = async () => {
        try {
            const schedule: ScheduleData = await shiftScheduleApi.getScheduleById(scheduleId);

            const matchingShift = schedule?.shifts?.find(
                (shift: ShiftItem) => shift.date === date && shift.shiftType === shiftType
            );

            setAssignments(matchingShift?.assignments || []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (isOpen && scheduleId && date && shiftType) {
            loadAssignments();
        }
    }, [isOpen, scheduleId, date, shiftType]);

    if (!isOpen) return null;

    const handleAdd = async () => {
        if (!newOfficerId) return;

        try {
            if (mode === "AREA_MANAGER") {
                await shiftScheduleApi.assignOfficersAsAreaManager(scheduleId, {
                    date,
                    shiftType,
                    securityOfficerIds: [parseInt(newOfficerId)],
                });
            } else {
                await shiftScheduleApi.assignOfficers(scheduleId, {
                    date,
                    shiftType,
                    securityOfficerIds: [parseInt(newOfficerId)],
                });
            }

            setNewOfficerId("");
            await loadAssignments();
        } catch (error: unknown) {
            let message =
                "Failed to add officer. They may have reached their limit or need a rest day.";

            if (typeof error === "object" && error !== null && "response" in error) {
                const err = error as {
                    response?: { data?: { message?: string } };
                };
                message = err.response?.data?.message || message;
            }

            alert(message);
        }
    };

    const handleRemove = async (id: number) => {
        try {
            if (mode === "AREA_MANAGER") {
                await shiftScheduleApi.removeAssignmentAsAreaManager(id);
            } else {
                await shiftScheduleApi.removeAssignment(id);
            }

            await loadAssignments();
        } catch (error: unknown) {
            let message = "Failed to remove assignment.";

            if (typeof error === "object" && error !== null && "response" in error) {
                const err = error as {
                    response?: { data?: { message?: string } };
                };
                message = err.response?.data?.message || message;
            }

            alert(message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
            <div className="bg-[#FFFFFF] border border-[#D4AF37] text-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[#D4AF37]">
                        {shiftType} Shift - {date}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-black">
                        ✕
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    {assignments.length === 0 ? (
                        <p className="text-gray-500">No officers assigned.</p>
                    ) : (
                        assignments.map((a: Assignment) => (
                            <div
                                key={a.id}
                                className="flex justify-between items-center bg-[#FFFFF0] border border-[#ffdf00] text-black p-3 rounded"
                            >
                                <span>{a.securityOfficerName || `Officer #${a.securityOfficerId}`}</span>
                                {!isReadOnly && (
                                    <button
                                        onClick={() => handleRemove(a.id)}
                                        className="text-red-500 hover:text-red-400"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {!isReadOnly && (
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Officer ID"
                            value={newOfficerId}
                            onChange={(e) => setNewOfficerId(e.target.value)}
                            className="bg-[#fffff0] text-gray-600 border border-yellow-400 rounded px-3 py-2 flex-grow focus:outline-none focus:border-[#D4AF37]"
                        />
                        <button
                            onClick={handleAdd}
                            className="bg-[#D4AF37] text-black px-4 py-2 rounded hover:bg-yellow-400 font-semibold"
                        >
                            + Add
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};