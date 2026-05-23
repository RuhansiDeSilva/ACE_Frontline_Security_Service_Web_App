import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { format, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Eye,
    Download,
    Calendar,
    Filter,
    CheckCircle2,
    ChevronRight,
    AlertCircle,
    Loader2,
    Search
} from "lucide-react";
// import logo from "@/assets/logo.png"; // Logo removed for public repo
import { PayslipDetailContent } from "./PayslipDetail";
import { toast } from "sonner";

interface SalaryRecord {
    id: number;
    month: string;
    basicSalary: number;
    totalAllowances: number;
    totalDeductions: number;
    netSalary: number;
    status: string;
    paymentDate: string;
}

interface MyPayslipsProps {
    mode?: "latest" | "history";
}

const MyPayslips = ({ mode = "history" }: MyPayslipsProps) => {
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");
    const fullName = localStorage.getItem("fullName") || "User Name";

    const { data: payslips = [], isLoading, isError } = useQuery({
        queryKey: ["payslips", userId],
        queryFn: async () => {
            if (!userId) return [];
            const response = await api.get(`/payroll/officer/payslips/${userId}`);
            return response.data;
        },
        enabled: !!userId,
    });

    // Sort payslips by date descending to find the latest more easily
    const sortedPayslips = [...payslips].sort((a, b) => {
        // Use month as fallback if paymentDate is not available or for better chronological order
        return b.month.localeCompare(a.month);
    });

    // Filter by PAID or CALCULATED status
    const paidPayslips = sortedPayslips.filter(p => p.status === "PAID" || p.status === "CALCULATED");

    const formatCurrency = (val: number) => {
        return "LKR " + (val || 0).toLocaleString("en-US", { minimumFractionDigits: 0 });
    };

    const handleViewDetails = (id: number) => {
        navigate(`/security-officer/payslip/${id}`);
    };

    const handleDownload = async (id: number, month: string) => {
        try {
            toast.info(`Preparing PDF for ${month}...`);
            const response = await api.get(`/payroll/payslip/pdf/${id}`, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payslip_${month}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Payslip downloaded successfully");
        } catch (error: any) {
            console.error("Download error:", error);
            const errorMsg = error.response?.data?.message || error.response?.data || error.message;
            toast.error(`Download failed: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
        }
    };

    const pageTitle = mode === "latest" ? "Latest Paysheet" : "Salary History";
    const headerDescription = mode === "latest"
        ? "View your most recently generated and paid payslip."
        : "Access your past paid salary records for financial tracking.";

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-sm font-black uppercase tracking-widest text-neutral-400">Loading your payslips...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center px-4">
                <div className="bg-red-50 p-4 rounded-full">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-neutral-800 uppercase">Connection Error</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">We encountered an issue while retrieving your payslip records. Please check your connection and try again.</p>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline" className="border-red-200 text-red-600 font-black tracking-widest uppercase">
                    Retry Connection
                </Button>
            </div>
        );
    }

    // New logic for Latest Mode: Show Full Details Directly
    if (mode === "latest") {
        return (
            <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {paidPayslips.length > 0 ? (
                    <div className="animate-in fade-in zoom-in-95 duration-700">
                        {/* We show the full payslip content directly */}
                        <PayslipDetailContent id={paidPayslips[0].id} showEdit={false} />
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-20 text-center shadow-lg border border-neutral-100 space-y-6 flex flex-col items-center animate-in zoom-in-95 duration-500">
                        <div className="h-24 w-24 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-200 shadow-inner">
                            <FileText className="h-12 w-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-neutral-800 uppercase tracking-tight">No Recent Payslip</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                We couldn't find your latest paid salary record associated with your account at this time.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Default History Mode
    const historyPayslips = paidPayslips.slice(1); // All paid payslips except the latest one

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="flex items-center gap-5">
                    {/* Logo image removed for public repo */}
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight text-neutral-800 uppercase">{pageTitle}</h1>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            {headerDescription}
                        </p>
                    </div>
                </div>

            </div>

            {/* Main Content Area - TABLE VIEW */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                    <h2 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Previous Records
                    </h2>
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-neutral-100 shadow-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                            <Search className="h-3 w-3" /> Search
                        </div>
                        <div className="h-4 w-[1px] bg-neutral-100"></div>
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-primary">
                            <Filter className="h-3 w-3 mr-1" /> Filter
                        </Button>
                    </div>
                </div>

                {historyPayslips.length > 0 ? (
                    <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-neutral-100">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50 border-b border-neutral-100">
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Month</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Basic Salary</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Allowances</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Deductions</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-right">Net Salary</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {historyPayslips.map((salary) => (
                                        <tr key={salary.id} className="hover:bg-neutral-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                                                        <Calendar className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-black text-neutral-800 tracking-tight uppercase">{salary.month}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-bold text-neutral-600">
                                                {formatCurrency(salary.basicSalary)}
                                            </td>
                                            <td className="px-6 py-5 text-sm font-bold text-green-600">
                                                +{formatCurrency(salary.totalAllowances)}
                                            </td>
                                            <td className="px-6 py-5 text-sm font-bold text-red-600">
                                                -{formatCurrency(salary.totalDeductions)}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`px-4 py-2 rounded-xl font-black text-sm shadow-lg shadow-neutral-200 transition-all ${salary.status === "PAID"
                                                        ? "bg-neutral-900 text-white group-hover:bg-primary group-hover:text-black"
                                                        : "bg-amber-100 text-amber-700 border border-amber-200"
                                                        }`}>
                                                        {formatCurrency(salary.netSalary)}
                                                    </span>
                                                    {salary.status === "CALCULATED" && (
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 animate-pulse">
                                                            Scheduled: {salary.paymentDate ? format(parseISO(salary.paymentDate), "MMM dd") : "TBD"}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl bg-neutral-50 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-all shadow-sm"
                                                        onClick={() => handleViewDetails(salary.id)}
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl bg-neutral-50 text-neutral-400 hover:bg-primary hover:text-black transition-all shadow-sm"
                                                        onClick={() => handleDownload(salary.id, salary.month)}
                                                        title="Download PDF"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-20 text-center shadow-lg border border-neutral-100 space-y-6 flex flex-col items-center animate-in zoom-in-95 duration-500">
                        <div className="h-24 w-24 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-200 shadow-inner">
                            <FileText className="h-12 w-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-neutral-800 uppercase tracking-tight">No Past Records</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                We couldn't find any historical paid salary records associated with your account.
                            </p>
                        </div>
                        <Button variant="outline" className="border-neutral-200 text-[10px] font-black tracking-widest uppercase h-10 px-6 rounded-xl hover:bg-neutral-50" onClick={() => window.location.reload()}>
                            Refresh Data
                        </Button>
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="bg-neutral-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-neutral-800 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-xs font-medium text-neutral-400">
                        Need assistance? Contact the payroll department for any discrepancies in your records.
                    </p>
                </div>
                <Button
                    className="w-full sm:w-auto bg-primary text-black font-black text-[10px] uppercase tracking-widest px-8 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all h-11"
                    onClick={() => {
                        toast.info("This feature will be available in the next update!");
                    }}
                >
                    <Download className="h-4 w-4 mr-2" /> Download All History
                </Button>
            </div>
        </div>
    );
};

export default MyPayslips;
