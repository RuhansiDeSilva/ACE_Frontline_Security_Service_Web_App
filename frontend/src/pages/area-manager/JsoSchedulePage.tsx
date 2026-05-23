import { useEffect, useState } from "react";
import { shiftScheduleApi } from "@/lib/shiftScheduleApi";
import { MonthlyCalendarView } from "@/components/shift-schedule/MonthlyCalendarView";
import { authApi } from "@/lib/authApi";

type UserInfo = {
    id: number;
    email: string;
    role: string;
    designation: string | null;
    clientId: number | null;
    clientName: string | null;
    branchId: number | null;
    branchName: string | null;
};

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
    editedByAreaManager: boolean;
    areaManagerEditedAt: string | null;
};

export default function JsoSchedulePage() {
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

    const loadCurrentUser = async (): Promise<UserInfo | null> => {
        try {
            const user: UserInfo = await authApi.me();
            setCurrentUser(user);
            return user;
        } catch (error) {
            console.error(error);
            alert("Failed to load current user details.");
            return null;
        }
    };

    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const isPastMonth =
        selectedYear < currentYear ||
        (selectedYear === currentYear && selectedMonth < currentMonth);

    const isFutureMonth =
        selectedYear > currentYear ||
        (selectedYear === currentYear && selectedMonth > currentMonth);

    const isCurrentMonth =
        selectedYear === currentYear && selectedMonth === currentMonth;

    const canEditDraft = selectedSchedule?.status === "DRAFT" && !isPastMonth;



    const loadScheduleForMonth = async (
        user: UserInfo,
        month: number,
        year: number
    ): Promise<void> => {
        if (!user.clientId) {
            setSelectedSchedule(null);
            return;
        }

        try {
            const schedule: ScheduleData =
                await shiftScheduleApi.getScheduleByCompanyAndMonthYear(
                    user.clientId,
                    month,
                    year
                );

            setSelectedSchedule(schedule);
        } catch {
            setSelectedSchedule(null);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const user = await loadCurrentUser();
                if (user) {
                    await loadScheduleForMonth(user, selectedMonth, selectedYear);
                }
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    useEffect(() => {
        const reload = async () => {
            if (!currentUser) return;

            setLoading(true);
            try {
                await loadScheduleForMonth(currentUser, selectedMonth, selectedYear);
            } finally {
                setLoading(false);
            }
        };

        reload();
    }, [selectedMonth, selectedYear]);

    const handlePreviousMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear((prev) => prev - 1);
        } else {
            setSelectedMonth((prev) => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear((prev) => prev + 1);
        } else {
            setSelectedMonth((prev) => prev + 1);
        }
    };

    const handleCreate = async (): Promise<void> => {
        if (!currentUser?.clientId) {
            alert("Current JSO is not assigned to any client company.");
            return;
        }

        try {
            setLoading(true);

            const data: ScheduleData = await shiftScheduleApi.createSchedule({
                clientId: currentUser.clientId,
                month: selectedMonth,
                year: selectedYear,
            });

            setSelectedSchedule(data);
            alert("Schedule draft created successfully!");
        } catch (error) {
            console.error(error);
            alert("Schedule already exists or error occurred.");
            await loadScheduleForMonth(currentUser, selectedMonth, selectedYear);
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

            alert("Auto generation complete!");
        } catch (error) {
            console.error(error);
            alert("Error during auto generation.");
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

            alert("Schedule submitted successfully!");
        } catch (error) {
            console.error(error);
            alert("Error submitting schedule.");
        } finally {
            setLoading(false);
        }
    };

    const renderStatusMessage = () => {
        if (!selectedSchedule) return null;

        if (selectedSchedule.status === "DRAFT") {
            if (isPastMonth) {
                return (
                    <p className="text-sm text-yellow-400">
                        This is a past month draft. You can only view it now.
                    </p>
                );
            }

            if (isCurrentMonth) {
                return (
                    <p className="text-sm text-yellow-400">
                        This current month schedule is saved as a draft. You can continue editing, auto-generate, and submit it.
                    </p>
                );
            }

            if (isFutureMonth) {
                return (
                    <p className="text-sm text-yellow-400">
                        This future month schedule is saved as a draft. You can continue editing, auto-generate, and submit it.
                    </p>
                );
            }
        }

        if (selectedSchedule.status === "SUBMITTED") {
            return (
                <p className="text-sm text-blue-400">
                    This schedule has been submitted and is pending area manager approval. You can view it, but cannot edit it.
                </p>
            );
        }

        if (selectedSchedule.status === "APPROVED") {
            return (
                <p className="text-sm text-green-400">
                    This schedule has been approved. You can view it, but cannot edit it.
                </p>
            );
        }

        return null;
    };

    return (
        <div className="p-6 bg-[#ffffff] min-h-screen text-white">
            <h1 className="text-3xl font-bold text-[#FFDF00] mb-6">
                Shift Scheduling (JSO)
            </h1>

            {currentUser && (
                <div className="mb-4 text-sm text-gray-400">
                    Logged in as: {currentUser.email} | Company:{" "}
                    {currentUser.clientName || "Not assigned"}
                </div>
            )}

            <div className="flex items-center justify-between bg-[#fffff0] border border-yellow-400 rounded p-4 mb-6">
                <button
                    onClick={handlePreviousMonth}
                    className="px-4 py-2 rounded bg-[#ffffff] border border-[#FFDF00] text-gray-400 hover:bg-[#FFDF00] hover:text-black transition"
                >
                    ← Previous
                </button>

                <div className="text-center">
                    <p className="text-lg font-bold text-[#FFDF00]">
                        {selectedMonth}/{selectedYear}
                    </p>
                    <p className="text-sm text-gray-400">
                        {isPastMonth
                            ? "Past month"
                            : isCurrentMonth
                                ? "Current month"
                                : "Future month"}
                    </p>
                </div>

                <button
                    onClick={handleNextMonth}
                    className="px-4 py-2 rounded bg-[#ffffff] border border-[#FFDF00] text-gray-400 hover:bg-[#FFDF00] hover:text-black transition"
                >
                    Next →
                </button>
            </div>

            {loading && !selectedSchedule ? (
                <p className="text-gray-400">Loading...</p>
            ) : !selectedSchedule ? (
                <div className="space-y-4">
                    <p className="text-gray-400">
                        No schedule found for {selectedMonth}/{selectedYear}.
                    </p>

                    {!isPastMonth ? (
                        <button
                            onClick={handleCreate}
                            disabled={loading || !currentUser?.clientId}
                            className="bg-[#FFDF00] text-black px-6 py-2 rounded font-bold hover:bg-yellow-600 disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create New Draft"}
                        </button>
                    ) : (
                        <p className="text-sm text-gray-500">
                            Past months can only be viewed. New schedules cannot be created for past months.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-[#ffffff] p-4 rounded border border-[#FFDF00] space-y-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl text-[#ffdf00]">
                                    Schedule for {selectedSchedule.month}/{selectedSchedule.year}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    Company: {selectedSchedule.clientName}
                                </p>
                                <p className="text-sm text-gray-400">
                                    Status: {selectedSchedule.status}
                                </p>
                                {selectedSchedule.editedByAreaManager && selectedSchedule.areaManagerEditedAt && (
                                    <p className="text-sm text-blue-400">
                                        This schedule was updated by the Area Manager on{" "}
                                        {new Date(selectedSchedule.areaManagerEditedAt).toLocaleString()}.
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleAutoGenerate}
                                    disabled={loading || !canEditDraft}
                                    className="bg-[#fffff0] text-[#ffdf00] border border-[#ffdf00] px-4 py-2 rounded hover:bg-[#ffdf00] hover:text-black font-semibold transition disabled:opacity-50"
                                >
                                    {loading ? "Processing..." : "Auto Generate"}
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !canEditDraft}
                                    className="bg-[#ffdf00] text-black px-4 py-2 rounded hover:bg-yellow-400 font-bold disabled:opacity-50"
                                >
                                    Submit Schedule
                                </button>
                            </div>
                        </div>

                        {renderStatusMessage()}
                    </div>

                    <MonthlyCalendarView
                        scheduleId={selectedSchedule.id}
                        month={selectedSchedule.month}
                        year={selectedSchedule.year}
                        isReadOnly={!canEditDraft}
                        mode="JSO"
                    />
                </div>
            )}
        </div>
    );
}