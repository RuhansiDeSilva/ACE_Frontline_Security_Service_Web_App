import React, { useState, useEffect } from "react";
import {
    TrendingUp,
    TrendingDown,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ArrowUpCircle,
    ArrowDownCircle,
    Wallet,
    Activity,
    BarChart3,
    PieChart as PieChartIcon,
    Download,
    RefreshCw,
    User as UserIcon,
    UserCheck,
    Users,
    Calculator
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Legend
} from "recharts";
import { format, setMonth as setDateMonth, setYear, isWithinInterval, parse } from "date-fns";
// import logo from "@/assets/logo.png"; // Logo removed for public repo
import { toast } from "sonner";
import { api } from "@/services/api";

interface TrendData {
    monthlyTrends: Array<{
        month: string;
        amount: number;
        allowances: number;
        deductions: number;
    }>;
    distribution: Array<{
        range: string;
        count: number;
    }>;
    averageSalary: number;
    highestSalary: number;
    highestSalaryMonth: string;
    lowestSalary: number;
    lowestSalaryMonth: string;
    totalYTD: number;
    growthRate: number;
    allowanceBreakdown: Array<{ label: string; amount: number }>;
    deductionBreakdown: Array<{ label: string; amount: number }>;
}

// const API_BASE_URL = "http://localhost:8080/api";
const COLORS = ['#EAB308', '#000000', '#71717a', '#22c55e', '#a855f7', '#ec4899', '#f97316'];

const SalaryTrends = () => {
    const [officerFilter, setOfficerFilter] = useState("all");
    const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), 0, 1)); // Jan 1st of current year
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
    const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);

    const [data, setData] = useState<TrendData | null>(null);
    const [filteredData, setFilteredData] = useState<TrendData | null>(null);
    const [loading, setLoading] = useState(true);
    const [officers, setOfficers] = useState<any[]>([]);

    const monthsLong = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    useEffect(() => {
        api.get('/officers/list')
            .then(res => {
                const data = res.data;
                if (Array.isArray(data)) {
                    setOfficers(data);
                } else {
                    console.error("Expected array but got:", data);
                    setOfficers([]);
                }
            })
            .catch(err => {
                console.error("Error fetching officers:", err);
                setOfficers([]);
            });
    }, []);

    const fetchTrends = async () => {
        setLoading(true);
        try {
            const url = officerFilter !== "all"
                ? `/payroll/trends?officerId=${officerFilter}`
                : `/payroll/trends`;
            console.log("Fetching Trends from:", url);
            const response = await api.get(url);
            const result = response.data;
            console.log("Raw Trends Data:", result);
            setData(result);
            // Default filtered data to all for initial load
            setFilteredData(result);
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.response?.data || error.message;
            toast.error(`Failed to load salary trends: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
            setData(null);
            setFilteredData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrends();
    }, [officerFilter]);

    useEffect(() => {
        if (!data) return;

        console.log("Filtering data for range:", startDate, endDate);

        // Filter monthly trends based on date range
        const filteredTrends = data.monthlyTrends.filter(trend => {
            const parts = trend.month.split('-');
            if (parts.length !== 2) return true;
            const [year, month] = parts.map(Number);
            const trendDate = new Date(year, month - 1);
            return trendDate >= startDate && trendDate <= endDate;
        });

        console.log("Filtered Trends:", filteredTrends);

        setFilteredData({
            ...data,
            monthlyTrends: filteredTrends
        });
    }, [data, startDate, endDate]);

    const formatCurrency = (val: number) => {
        return "LKR " + (val || 0).toLocaleString("en-US", { minimumFractionDigits: 0 });
    };

    const exportReport = async () => {
        toast.info("Preparing salary trends report...");
        try {
            const url = officerFilter !== "all"
                ? `/payroll/trends/pdf?officerId=${officerFilter}`
                : `/payroll/trends/pdf`;

            const response = await api.get(url, { responseType: 'blob' });
            const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', `Salary_Trends_${format(new Date(), 'yyyy_MM_dd')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
            toast.success("Download started ✓");
        } catch (error: any) {
            console.error("Export error:", error);
            const errorMsg = error.response?.data?.message || error.response?.data || error.message;
            toast.error(`Failed to export report: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
        }
    };



    const MonthPicker = ({
        date,
        setDate,
        isOpen,
        setIsOpen,
        label
    }: {
        date: Date,
        setDate: (d: Date) => void,
        isOpen: boolean,
        setIsOpen: (o: boolean) => void,
        label: string
    }) => (
        <div className="space-y-1.5 flex-1 min-w-[150px]">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-medium h-11 border-neutral-200 rounded-xl bg-white">
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {format(date, "MMMM yyyy")}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 bg-white border border-neutral-200 shadow-xl rounded-xl">
                    <div className="flex items-center justify-between px-2 pb-2 border-b border-neutral-100 mb-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDate(setYear(date, date.getFullYear() - 1))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-bold">{format(date, "yyyy")}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDate(setYear(date, date.getFullYear() + 1))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {monthsLong.map((m, idx) => (
                            <Button
                                key={m}
                                variant={date.getMonth() === idx ? "default" : "ghost"}
                                className={`h-9 px-0 text-xs font-medium ${date.getMonth() === idx ? "bg-primary text-black hover:bg-primary/90" : "hover:bg-neutral-50"}`}
                                onClick={() => {
                                    setDate(setDateMonth(date, idx));
                                    setIsOpen(false);
                                }}
                            >
                                {m}
                            </Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        margin: 0.5cm;
                        size: landscape;
                    }
                    aside, header, .no-print {
                        display: none !important;
                    }
                    body {
                        background-color: white !important;
                        font-size: 11pt !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .max-w-6xl {
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .space-y-8 {
                        gap: 1.5rem !important;
                    }
                    .p-4, .p-6, .p-8, .pt-8 {
                        padding: 1rem !important;
                    }
                    .h-[300px] {
                        height: 250px !important;
                    }
                    .shadow-xl, .shadow-2xl {
                        box-shadow: none !important;
                        border: 1px solid #e5e7eb !important;
                    }
                    .rounded-3xl, .rounded-[2.5rem] {
                        border-radius: 12px !important;
                    }
                    h1 { font-size: 20pt !important; }
                    h3 { font-size: 14pt !important; }
                    .text-lg { font-size: 11pt !important; }
                    .text-2xl { font-size: 20pt !important; }
                    p { font-size: 10pt !important; }
                }
            ` }} />
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Logo removed */}
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-800 uppercase">Salary Trends</h1>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Analyze salary patterns and track earnings</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 no-print">
                    <Button onClick={fetchTrends} variant="outline" className="rounded-xl h-11 px-4 border-neutral-200 bg-white">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>

                    <Button onClick={exportReport} className="bg-black hover:bg-neutral-800 text-white rounded-xl h-11 px-6 font-bold shadow-lg shadow-black/20">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Filters Section */}
            <Card className="border-none shadow-xl bg-neutral-50/50 rounded-3xl overflow-hidden no-print">
                <CardContent className="p-6 flex flex-wrap items-center gap-6">
                    <MonthPicker label="Start Month" date={startDate} setDate={setStartDate} isOpen={isStartPickerOpen} setIsOpen={setIsStartPickerOpen} />
                    <span className="self-center mt-6 text-neutral-400 font-bold">to</span>
                    <MonthPicker label="End Month" date={endDate} setDate={setEndDate} isOpen={isEndPickerOpen} setIsOpen={setIsEndPickerOpen} />

                    <div className="flex-1 min-w-[200px] space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Officer Selection</label>
                        <Select value={officerFilter} onValueChange={setOfficerFilter}>
                            <SelectTrigger className="h-11 bg-white border-neutral-200 rounded-xl focus:ring-primary shadow-sm">
                                <SelectValue placeholder="All Officers (Department View)" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="all">All Officers (Department View)</SelectItem>
                                {officers.map((off) => (
                                    <SelectItem key={off.id} value={off.id.toString()}>
                                        {off.id} - {off.fullName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all border-l-4 border-primary">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                            <TrendingUp className="w-6 h-6 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Average</span>
                        </div>
                        <h3 className="text-xl font-black text-neutral-800">{loading ? "..." : formatCurrency(data?.averageSalary || 0)}</h3>
                        <p className="text-[10px] font-bold text-neutral-500 mt-1 uppercase">Per Month</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all border-l-4 border-primary">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                            <ArrowUpCircle className="w-6 h-6 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Highest</span>
                        </div>
                        <h3 className="text-xl font-black text-neutral-800">{loading ? "..." : formatCurrency(data?.highestSalary || 0)}</h3>
                        <p className="text-[10px] font-bold text-neutral-500 mt-1 uppercase">{loading ? "..." : data?.highestSalaryMonth}</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all border-l-4 border-primary">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                            <ArrowDownCircle className="w-6 h-6 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Lowest</span>
                        </div>
                        <h3 className="text-xl font-black text-neutral-800">{loading ? "..." : formatCurrency(data?.lowestSalary || 0)}</h3>
                        <p className="text-[10px] font-bold text-neutral-500 mt-1 uppercase">{loading ? "..." : data?.lowestSalaryMonth || "N/A"}</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all border-l-4 border-primary">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                            <Wallet className="w-6 h-6 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Total YTD</span>
                        </div>
                        <h3 className="text-xl font-black text-neutral-800">{loading ? "..." : formatCurrency(data?.totalYTD || 0)}</h3>
                        <p className="text-[10px] font-bold text-neutral-500 mt-1 uppercase">Year to Date ({new Date().getFullYear()})</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all border-l-4 border-primary">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                            <Activity className="w-6 h-6 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Overtime</span>
                        </div>
                        <h3 className="text-xl font-black text-neutral-800">{loading ? "..." : formatCurrency((data as any)?.totalOvertime || 0)}</h3>
                        <p className="text-[10px] font-bold text-neutral-500 mt-1 uppercase">Total Overtime Aggregated</p>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Net Salary Trend (Line Chart) */}
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-neutral-50/50 pb-2 border-b border-neutral-100 px-8 pt-8">
                    <CardTitle className="text-lg font-black uppercase tracking-tight text-charcoal flex items-center gap-3">
                        <Activity className="text-primary h-5 w-5" />
                        Monthly Net Salary Trend
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">Track salary progression over time</CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredData?.monthlyTrends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0E7490" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0E7490" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#000000', fontSize: 10, fontWeight: 700 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#000000', fontSize: 10, fontWeight: 700 }}
                                tickFormatter={(val) => `LKR ${val / 1000}k`}
                            />
                            <Tooltip
                                cursor={false}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-neutral-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10">
                                                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">{payload[0].payload.month}</p>
                                                <p className="text-xl font-black">{formatCurrency(payload[0].value as number)}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <div className="h-1 w-8 rounded-full bg-[#0E7490]"></div>
                                                    <span className="text-[9px] font-bold uppercase opacity-70">Net Salary</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#0E7490"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorAmount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Allowances vs Deductions (Bar Chart) */}
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-neutral-50/50 pb-2 border-b border-neutral-100 px-8 pt-8">
                    <CardTitle className="text-lg font-black uppercase tracking-tight text-charcoal flex items-center gap-3">
                        <BarChart3 className="text-primary h-5 w-5" />
                        Allowances vs Deductions Comparison
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">Balance between earnings and deductions</CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredData?.monthlyTrends || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#000000', fontSize: 10, fontWeight: 700 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#000000', fontSize: 10, fontWeight: 700 }}
                                tickFormatter={(val) => `LKR ${val / 1000}k`}
                            />
                            <Tooltip
                                cursor={false}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number, name: string) => [
                                    <span style={{ color: name === 'Total Allowances' ? '#15803D' : '#B91C1C', fontWeight: 700 }}>
                                        {formatCurrency(value)}
                                    </span>,
                                    ''
                                ]}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                formatter={(value) => (
                                    <span style={{ color: value === 'Total Allowances' ? '#15803D' : '#B91C1C', fontWeight: 700, fontSize: 12 }}>
                                        {value}
                                    </span>
                                )}
                            />
                            <Bar
                                dataKey="allowances"
                                name="Total Allowances"
                                fill="#DCFCE7"
                                stroke="#15803D"
                                strokeWidth={1.5}
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="deductions"
                                name="Total Deductions"
                                fill="#FEE2E2"
                                stroke="#B91C1C"
                                strokeWidth={1.5}
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Breakdown Pie Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Allowance Breakdown */}
                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-neutral-50/50 pb-2 border-b border-neutral-100 px-8 pt-8">
                        <CardTitle className="text-lg font-black uppercase tracking-tight text-charcoal flex items-center gap-3">
                            <PieChartIcon className="text-primary h-5 w-5" />
                            Allowance Breakdown
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">Composition of total earnings</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.allowanceBreakdown || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="amount"
                                    nameKey="label"
                                    strokeWidth={2}
                                >
                                    {(data?.allowanceBreakdown || []).map((entry: any, index: number) => {
                                        const getColor = (label: string) => {
                                            const l = (label || "").toLowerCase();
                                            if (l.includes('basic')) return { fill: '#D0E9F9', stroke: '#1565C0' };
                                            if (l.includes('overtime') || l.includes('ot')) return { fill: '#FFE3E3', stroke: '#C62828' };
                                            if (l.includes('diri deemana')) return { fill: '#EDF8D7', stroke: '#2E7D32' };
                                            return { fill: '#FFECC6', stroke: '#FFB300' };
                                        };
                                        const colors = getColor(entry.label);
                                        return <Cell key={`cell-${index}`} fill={colors.fill} stroke={colors.stroke} />;
                                    })}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number, name: string) => {
                                        const getColor = (label: string) => {
                                            const l = (label || "").toLowerCase();
                                            if (l.includes('basic')) return '#1565C0';
                                            if (l.includes('overtime') || l.includes('ot')) return '#C62828';
                                            if (l.includes('diri deemana')) return '#2E7D32';
                                            return '#FFB300';
                                        };
                                        return [
                                            <span style={{ color: getColor(name), fontWeight: 700 }}>
                                                {formatCurrency(value)}
                                            </span>,
                                            ''
                                        ];
                                    }}
                                />
                                <Legend
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    formatter={(value) => {
                                        const getColor = (label: string) => {
                                            const l = (label || "").toLowerCase();
                                            if (l.includes('basic')) return '#1565C0';
                                            if (l.includes('overtime') || l.includes('ot')) return '#C62828';
                                            if (l.includes('diri deemana')) return '#2E7D32';
                                            return '#FFB300';
                                        };
                                        return <span style={{ color: getColor(value), fontWeight: 700, fontSize: '11px' }}>{value}</span>;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Deduction Breakdown */}
                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-neutral-50/50 pb-2 border-b border-neutral-100 px-8 pt-8">
                        <CardTitle className="text-lg font-black uppercase tracking-tight text-charcoal flex items-center gap-3">
                            <PieChartIcon className="text-neutral-800 h-5 w-5" />
                            Deduction Breakdown
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">Where deductions are going</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.deductionBreakdown || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="amount"
                                    nameKey="label"
                                    strokeWidth={2}
                                >
                                    {(data?.deductionBreakdown || []).map((entry: any, index: number) => {
                                        const secondaryPalette = [
                                            { fill: '#F3E5F5', stroke: '#7B1FA2' }, // Purple
                                            { fill: '#E0F2F1', stroke: '#00796B' }, // Teal
                                            { fill: '#FFF3E0', stroke: '#E65100' }, // Orange
                                            { fill: '#FFFDE7', stroke: '#FBC02D' }, // Amber
                                        ];

                                        const getColor = (label: string, idx: number) => {
                                            const l = (label || "").toLowerCase();
                                            if (l.includes('epf')) return { fill: '#9DA6B0', stroke: '#455A64' };
                                            if (l.includes('tax')) return { fill: '#B0937B', stroke: '#5D4037' };
                                            if (l.includes('uniform')) return { fill: '#6A71A9', stroke: '#303F9F' };
                                            if (l.includes('loan')) return { fill: '#ADADB5', stroke: '#616161' };
                                            if (l.includes('advance')) return { fill: '#B1B07C', stroke: '#689F38' };

                                            const otherIdx = (data?.deductionBreakdown || []).slice(0, idx).filter(item => {
                                                const il = (item.label || "").toLowerCase();
                                                return !il.includes('epf') && !il.includes('tax') && !il.includes('uniform') && !il.includes('loan') && !il.includes('advance');
                                            }).length;

                                            return secondaryPalette[otherIdx % secondaryPalette.length];
                                        };
                                        const colors = getColor(entry.label, index);
                                        return <Cell key={`cell-${index}`} fill={colors.fill} stroke={colors.stroke} />;
                                    })}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number, name: string) => {
                                        const secondaryPalette = ['#7B1FA2', '#00796B', '#E65100', '#FBC02D'];
                                        const getColor = (label: string) => {
                                            const l = (label || "").toLowerCase();
                                            if (l.includes('epf')) return '#455A64';
                                            if (l.includes('tax')) return '#5D4037';
                                            if (l.includes('uniform')) return '#303F9F';
                                            if (l.includes('loan')) return '#616161';
                                            if (l.includes('advance')) return '#689F38';

                                            const idx = (data?.deductionBreakdown || []).findIndex(item => item.label === label);
                                            const otherIdx = (data?.deductionBreakdown || []).slice(0, Math.max(0, idx)).filter(item => {
                                                const il = (item.label || "").toLowerCase();
                                                return !il.includes('epf') && !il.includes('tax') && !il.includes('uniform') && !il.includes('loan') && !il.includes('advance');
                                            }).length;

                                            return secondaryPalette[otherIdx % secondaryPalette.length];
                                        };
                                        return [
                                            <span style={{ color: getColor(name), fontWeight: 700 }}>
                                                {formatCurrency(value)}
                                            </span>,
                                            ''
                                        ];
                                    }}
                                />
                                <Legend
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    formatter={(value) => {
                                        const secondaryPalette = ['#7B1FA2', '#00796B', '#E65100', '#FBC02D'];
                                        const getColor = (label: string) => {
                                            const l = (label || "").toLowerCase();
                                            if (l.includes('epf')) return '#455A64';
                                            if (l.includes('tax')) return '#5D4037';
                                            if (l.includes('uniform')) return '#303F9F';
                                            if (l.includes('loan')) return '#616161';
                                            if (l.includes('advance')) return '#689F38';

                                            const idx = (data?.deductionBreakdown || []).findIndex(item => item.label === label);
                                            const otherIdx = (data?.deductionBreakdown || []).slice(0, Math.max(0, idx)).filter(item => {
                                                const il = (item.label || "").toLowerCase();
                                                return !il.includes('epf') && !il.includes('tax') && !il.includes('uniform') && !il.includes('loan') && !il.includes('advance');
                                            }).length;

                                            return secondaryPalette[otherIdx % secondaryPalette.length];
                                        };
                                        return <span style={{ color: getColor(value), fontWeight: 700, fontSize: '11px' }}>{value}</span>;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SalaryTrends;
