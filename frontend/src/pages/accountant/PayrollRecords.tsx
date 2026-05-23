import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Search,
    Plus,
    FileText,
    Edit,
    Trash2,
    CheckCircle,
    Download,
    Eye,
    ArrowUpRight,
    TrendingUp,
    History,
    AlertCircle,
    Calendar,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

interface SalaryRecord {
    id: string;
    officer: {
        officerId: string;
        fullName: string;
    };
    month: string;
    basicSalary: number;
    totalAllowances: number;
    totalDeductions: number;
    netSalary: number;
    paymentDate?: string;
    status: "CALCULATED" | "PAID";
}

const mockCalculatedSalaries: SalaryRecord[] = [
    {
        id: "REC001",
        officer: { officerId: "EMP001", fullName: "Aman Gupta" },
        month: "February 2026",
        basicSalary: 35000,
        totalAllowances: 8500,
        totalDeductions: 6050,
        netSalary: 37450,
        status: "CALCULATED"
    },
    {
        id: "REC002",
        officer: { officerId: "EMP005", fullName: "Priya Sharma" },
        month: "February 2026",
        basicSalary: 28000,
        totalAllowances: 4200,
        totalDeductions: 840,
        netSalary: 31360,
        status: "CALCULATED"
    }
];

const mockPaidSalaries: SalaryRecord[] = [
    {
        id: "REC-P-001",
        officer: { officerId: "EMP002", fullName: "Sunil Perera" },
        month: "January 2026",
        basicSalary: 30000,
        totalAllowances: 5000,
        totalDeductions: 900,
        netSalary: 34100,
        paymentDate: "2026-01-28",
        status: "PAID"
    },
    {
        id: "REC-P-002",
        officer: { officerId: "EMP003", fullName: "Kamal Silva" },
        month: "January 2026",
        basicSalary: 32000,
        totalAllowances: 6000,
        totalDeductions: 960,
        netSalary: 37040,
        paymentDate: "2026-01-29",
        status: "PAID"
    }
];

const PayrollRecords = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [calculatedSalaries, setCalculatedSalaries] = useState<SalaryRecord[]>([]);
    const [paidSalaries, setPaidSalaries] = useState<SalaryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("calculated");
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
    const [showAllMonths, setShowAllMonths] = useState(true); // Default to All Records as requested
    const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const fetchPayrollData = async (month: string) => {
        setIsLoading(true);
        const queryMonth = showAllMonths ? "ALL" : month;
        try {
            const [calcRes, paidRes] = await Promise.all([
                api.get(`/payroll/list?month=${queryMonth}`),
                api.get(`/payroll/history?month=${queryMonth}`)
            ]);

            if (calcRes.status === 200) {
                const transformed = calcRes.data.map((item: any) => ({
                    ...item,
                    id: item.id.toString(),
                    month: format(parseISO(item.month + "-01"), "MMMM yyyy")
                }));
                setCalculatedSalaries(transformed);
            }
            if (paidRes.status === 200) {
                const transformed = paidRes.data.map((item: any) => ({
                    ...item,
                    id: item.id.toString(),
                    month: format(parseISO(item.month + "-01"), "MMMM yyyy")
                }));
                setPaidSalaries(transformed);
            }
        } catch (error: any) {
            console.error("Error fetching payroll data:", error);
            const errorMsg = error.response?.data?.message || error.response?.data || error.message;
            toast.error(`Failed to fetch payroll records: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPayrollData(selectedMonth);
    }, [selectedMonth, showAllMonths]);

    const formatCurrency = (val: number) => {
        return "LKR " + val.toLocaleString("en-US", { minimumFractionDigits: 0 });
    };

    const handleMarkPaid = async (id: string) => {
        try {
            const response = await api.post(`/payroll/pay/${id}`);
            if (response.status === 200) {
                toast.success("Payroll record marked as paid successfully!");
                fetchPayrollData(selectedMonth); // Refresh both lists
            }
        } catch (error: any) {
            console.error("Error marking payroll as paid:", error);
            const errorMsg = error.response?.data?.message || error.response?.data || error.message;
            toast.error(`Failed to mark as paid: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to permanently delete this payroll record? This action cannot be undone.")) {
            try {
                const response = await api.delete(`/payroll/${id}`);
                if (response.status === 200) {
                    toast.error("Payroll record deleted.");
                    setCalculatedSalaries(calculatedSalaries.filter(s => s.id !== id));
                }
            } catch (error: any) {
                console.error("Error deleting payroll record:", error);
                const errorMsg = error.response?.data?.message || error.response?.data || error.message;
                toast.error(`Delete failed: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
            }
        }
    };

    const handleDownloadPdf = async (id: string, officerName: string, month: string) => {
        toast.info(`Preparing payslip for ${officerName}...`);
        try {
            const response = await api.get(`/payroll/payslip/pdf/${id}`, { responseType: 'blob' });
            const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', `Payslip_${officerName.replace(/\s+/g, '_')}_${month.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
            toast.success("Download started ✓");
        } catch (error: any) {
            console.error("Download error:", error);
            const errorMsg = error.response?.data?.message || error.response?.data || error.message;
            toast.error(`Failed to download payslip: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
        }
    };

    const handleExport = async () => {
        try {
            toast.info(`Attempting to generate bank export...`);
            const response = await api.get(`/payroll/export`, { responseType: 'blob' });

            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const exportMonth = format(lastMonth, "yyyy-MM");

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Bank_Export_${exportMonth}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Bank export CSV downloaded successfully");
        } catch (error: any) {
            console.error("Export error:", error);
            const errorMsg = error.response?.data?.message || error.response?.data || error.message;
            toast.error(`Export failed: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
        }
    };

    const filteredCalculated = calculatedSalaries.filter(s =>
        s.officer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.officer.officerId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPaid = paidSalaries.filter(s =>
        s.officer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.officer.officerId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const EmptyState = ({ message }: { message: string }) => (
        <TableRow>
            <TableCell colSpan={10} className="h-72">
                <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-700">
                    <div className="bg-neutral-50 p-8 rounded-full border border-dashed border-neutral-200 relative">
                        <Search className="h-12 w-12 text-neutral-300" />
                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm border border-neutral-100">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-black text-neutral-800 uppercase tracking-tighter">No Records Found</p>
                        <p className="text-xs font-medium text-neutral-400 mt-2 max-w-[280px] leading-relaxed mx-auto">
                            {message}
                        </p>
                    </div>
                </div>
            </TableCell>
        </TableRow>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-1000">
            {/* Header Redesign to match SalaryTrends style */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img
                        src={logo}
                        alt="Ace Front Line"
                        className="h-12 w-auto object-contain"
                        onError={(e) => {
                            e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/1053/1053155.png";
                        }}
                    />
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-black tracking-tight text-neutral-800 uppercase leading-none">
                                Payroll Records
                            </h1>
                            <Badge className="bg-[#FEF9C3] text-[#854D0E] border-none font-black text-[10px] tracking-widest px-3 py-1 rounded-full shadow-sm">
                                SYSTEM
                            </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">
                            Management & History Overview
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleExport}
                        className="h-14 px-8 bg-black text-white font-black uppercase tracking-widest hover:bg-neutral-800 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-black/10 rounded-2xl gap-3 border-none"
                    >
                        <Download className="h-5 w-5 stroke-[3px]" /> Export CSV
                    </Button>
                    <Button
                        onClick={() => navigate("/account-executive/payroll/generate")}
                        className="h-14 px-8 bg-neutral-950 text-white font-black uppercase tracking-widest hover:bg-neutral-800 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-neutral-200 rounded-2xl gap-3"
                    >
                        <Plus className="h-5 w-5 stroke-[3px]" /> New Payroll
                    </Button>
                </div>
            </div>

            {/* Bottom Row: Controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                {/* Month Picker Card */}
                <div className="flex-1 md:flex-none">
                    <Popover>
                        <PopoverTrigger asChild>
                            <div
                                className={cn(
                                    "bg-white h-20 px-5 rounded-[24px] border shadow-sm flex items-center gap-4 group hover:border-primary/50 transition-all duration-300 relative cursor-pointer min-w-[260px]",
                                    showAllMonths ? 'border-primary shadow-primary/10' : 'border-neutral-100'
                                )}
                            >
                                <div className={cn(
                                    "p-3 rounded-2xl border transition-all",
                                    showAllMonths ? 'bg-primary/20 border-primary/30' : 'bg-neutral-50 border-neutral-100',
                                    "group-hover:bg-primary/10 group-hover:border-primary/20"
                                )}>
                                    <Calendar className={cn("h-6 w-6 transition-colors", showAllMonths ? 'text-primary' : 'text-neutral-400', "group-hover:text-primary")} />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1">
                                        {showAllMonths ? "Showing History Across" : "Payroll Period"}
                                    </span>
                                    <div className="relative flex items-center overflow-hidden h-7">
                                        <span className={cn(
                                            "text-lg font-[900] uppercase tracking-tighter transition-all",
                                            showAllMonths ? 'text-primary' : 'text-neutral-900'
                                        )}>
                                            {showAllMonths ? "All Records" : format(parseISO(selectedMonth + "-01"), "MMMM yyyy")}
                                        </span>
                                    </div>
                                </div>
                                {showAllMonths ? (
                                    <div className="bg-primary/10 text-primary p-1.5 rounded-lg border border-primary/20">
                                        <History className="h-4 w-4" />
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[9px] font-black uppercase tracking-widest h-7 px-3 rounded-lg bg-neutral-100 text-neutral-400 hover:bg-neutral-200 transition-all"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowAllMonths(true);
                                        }}
                                    >
                                        View All
                                    </Button>
                                )}
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-4 rounded-[28px] border-neutral-100 shadow-2xl bg-white/95 backdrop-blur-sm">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg hover:bg-neutral-50"
                                        onClick={() => setPickerYear(prev => prev - 1)}
                                    >
                                        <ChevronLeft className="h-4 w-4 text-neutral-400" />
                                    </Button>
                                    <span className="font-[1000] text-lg uppercase tracking-[0.2em] text-neutral-950">{pickerYear}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg hover:bg-neutral-50"
                                        onClick={() => setPickerYear(prev => prev + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4 text-neutral-400" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5">
                                    {months.map((m, i) => {
                                        const monthCode = String(i + 1).padStart(2, '0');
                                        const monthStr = `${pickerYear}-${monthCode}`;
                                        const isSelected = selectedMonth === monthStr && !showAllMonths;

                                        return (
                                            <Button
                                                key={m}
                                                variant="ghost"
                                                className={cn(
                                                    "h-11 rounded-xl text-[10px] font-[900] uppercase tracking-tighter transition-all duration-300",
                                                    isSelected
                                                        ? "bg-primary text-black shadow-xl shadow-primary/20 scale-105"
                                                        : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950"
                                                )}
                                                onClick={() => {
                                                    setSelectedMonth(monthStr);
                                                    setShowAllMonths(false);
                                                }}
                                            >
                                                {m.substring(0, 3)}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <div className="pt-3 border-t border-neutral-100">
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full h-11 rounded-xl text-[10px] font-[1000] uppercase tracking-[0.1em] transition-all gap-3",
                                            showAllMonths
                                                ? "bg-neutral-950 text-primary shadow-xl"
                                                : "bg-neutral-50 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-950"
                                        )}
                                        onClick={() => setShowAllMonths(true)}
                                    >
                                        <History className={cn("h-4 w-4", showAllMonths ? "text-primary" : "text-neutral-400")} />
                                        All Records
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-focus-within:text-primary transition-colors duration-300" />
                    <Input
                        placeholder="Find by name or ID..."
                        className="pl-16 h-20 w-full border-neutral-100 bg-neutral-50/30 rounded-[28px] focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-base font-bold shadow-sm placeholder:text-neutral-300 placeholder:font-black placeholder:uppercase placeholder:tracking-tighter"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="calculated" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                <div className="flex items-center justify-between">
                    <TabsList className="bg-neutral-100 p-1 rounded-2xl border border-neutral-200">
                        <TabsTrigger value="calculated" className="rounded-xl px-8 h-10 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                            <TrendingUp className="h-3 w-3 mr-2" /> Calculated (Current)
                        </TabsTrigger>
                        <TabsTrigger value="paid" className="rounded-xl px-8 h-10 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                            <History className="h-3 w-3 mr-2" /> Paid Records (History)
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="calculated" className="space-y-6 focus-visible:ring-0">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 animate-in slide-in-from-top-2 duration-500">
                        <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-black text-amber-800 uppercase tracking-tighter">Current Month Status</p>
                            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                Calculated salaries for <span className="font-bold">{showAllMonths ? "All Months" : format(parseISO(selectedMonth + "-01"), "MMMM yyyy")}</span>. You can still modify these records.
                                Move to history by marking as <span className="font-bold underline">Paid</span>.
                            </p>
                        </div>
                    </div>

                    <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
                        <Table>
                            <TableHeader className="bg-neutral-50/50">
                                <TableRow className="hover:bg-transparent border-neutral-100">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Officer ID</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">FullName</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Month</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Basic</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Allowances</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Deductions</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Net Salary</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right pr-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCalculated.map((s) => (
                                    <TableRow key={s.id} className="border-neutral-50 group transition-colors hover:bg-neutral-50/30">
                                        <TableCell className="font-bold text-neutral-800 py-4">{s.officer.officerId}</TableCell>
                                        <TableCell className="font-medium text-neutral-600 py-4">{s.officer.fullName}</TableCell>
                                        <TableCell className="text-neutral-500 py-4">{s.month}</TableCell>
                                        <TableCell className="font-medium py-4">{formatCurrency(s.basicSalary)}</TableCell>
                                        <TableCell className="text-green-600 font-bold py-4">+{formatCurrency(s.totalAllowances)}</TableCell>
                                        <TableCell className="text-red-600 font-bold py-4">-{formatCurrency(s.totalDeductions)}</TableCell>
                                        <TableCell className="font-black text-neutral-900 py-4">{formatCurrency(s.netSalary)}</TableCell>
                                        <TableCell className="text-right pr-8 py-4">
                                            <div className="flex justify-end gap-2 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-neutral-400 hover:text-neutral-900"
                                                    title="View Payslip"
                                                    onClick={() => navigate(`/account-executive/payslip/${s.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-neutral-400 hover:text-primary"
                                                    title="Edit"
                                                    onClick={() => navigate(`/account-executive/payroll-records/edit/${s.id}`)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete" onClick={() => handleDelete(s.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-700 hover:bg-green-50" title="Mark Paid" onClick={() => handleMarkPaid(s.id)}>
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredCalculated.length === 0 && (
                                    <EmptyState message={`We couldn't find any calculated payroll records for "${searchTerm}". Please check the spelling or try searching by Officer ID.`} />
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="paid" className="space-y-6 focus-visible:ring-0">
                    <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
                        <Table>
                            <TableHeader className="bg-neutral-50/50">
                                <TableRow className="hover:bg-transparent border-neutral-100">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Officer</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Month</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Net Salary</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Paid Date</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right pr-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPaid.map((p) => (
                                    <TableRow key={p.id} className="border-neutral-50 group transition-colors hover:bg-neutral-50/30 text-neutral-600">
                                        <TableCell className="font-bold text-neutral-800 py-4">{p.officer.fullName}</TableCell>
                                        <TableCell className="py-4">{p.month}</TableCell>
                                        <TableCell className="font-black text-neutral-900 py-4">{formatCurrency(p.netSalary)}</TableCell>
                                        <TableCell className="py-4 font-medium">{p.paymentDate}</TableCell>
                                        <TableCell className="py-4">
                                            <Badge className="bg-green-100 text-green-700 border-none font-bold text-[9px] uppercase tracking-tighter px-2.5 py-0.5 shadow-none">
                                                FINALIZED
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8 py-4">
                                            <div className="flex justify-end gap-2 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-neutral-400 hover:text-neutral-900"
                                                    title="View Payslip"
                                                    onClick={() => navigate(`/account-executive/payslip/${p.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 border-neutral-200 font-bold uppercase text-[9px] tracking-widest group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all shadow-none"
                                                    onClick={() => handleDownloadPdf(p.id, p.officer.fullName, p.month)}
                                                >
                                                    <Download className="h-3 w-3 mr-2" /> PDF SLIP
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredPaid.length === 0 && (
                                    <EmptyState message={`No finalized records found for "${searchTerm}". Try adjusting your search term or select a different month.`} />
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Footer Summary Info */}
            <div className="bg-neutral-950 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50"></div>
                <div className="space-y-2 relative z-10">
                    <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-primary" /> System Overview
                    </h4>
                    <div className="flex flex-wrap gap-4 text-xs text-neutral-400 font-medium">
                        <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary"></div> Total {activeTab === "calculated" ? "Calculated" : "Finalized"}: {activeTab === "calculated" ? calculatedSalaries.length : paidSalaries.length}</span>
                        <span className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                            Report Period: {format(parseISO(selectedMonth + "-01"), "MMM yyyy")}
                        </span>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Total {activeTab === "calculated" ? "Outgoing" : "Paid"}</p>
                        <p className="text-3xl font-black tabular-nums">
                            {formatCurrency(
                                (activeTab === "calculated" ? calculatedSalaries : paidSalaries).reduce((acc, curr) => acc + curr.netSalary, 0)
                            )}
                        </p>
                    </div>
                    <div className="bg-neutral-800 w-px h-12 hidden md:block opacity-50"></div>
                    <Button variant="ghost" className="h-12 w-12 rounded-2xl hover:bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-primary transition-colors">
                        <ArrowUpRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div >
    );
};

export default PayrollRecords;
