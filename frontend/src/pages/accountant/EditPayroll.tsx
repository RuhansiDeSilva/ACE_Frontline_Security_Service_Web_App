import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    Plus,
    Trash2,
    Save,
    X,
    Wallet,
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    ArrowUpRight
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface Allowance {
    name: string;
    amount: number;
}

interface Deduction {
    name: string;
    amount: number;
}

interface SalaryRecord {
    id: number;
    month: string;
    officerName: string;
    officerId: string;
    basicSalary: number;
    otRate: number;
    totalShifts: number;
    bankName: string;
    branchName: string;
    accountNumber: string;
    allowances: Allowance[];
    deductions: Deduction[];
}

const mockSalaryRecord: SalaryRecord = {
    id: 101,
    month: "February 2026",
    officerName: "EMP007 - James Bond",
    officerId: "EMP007",
    basicSalary: 45000,
    otRate: 500,
    totalShifts: 22,
    bankName: "BOC",
    branchName: "Colombo Fort",
    accountNumber: "8899223344",
    allowances: [
        { name: "Travel Allowance", amount: 2000 },
        { name: "Meal Allowance", amount: 1500 }
    ],
    deductions: [
        { name: "Uniform Deduction", amount: 500 }
    ]
};

const EditPayroll = ({ id: propId }: { id?: string }) => {
    const { id: paramId } = useParams();
    const id = propId || paramId;
    const navigate = useNavigate();
    const [record, setRecord] = useState<SalaryRecord | null>(null);
    const [monthlyOvertimeHours, setMonthlyOvertimeHours] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    const [newAllowance, setNewAllowance] = useState({ name: "", amount: "" });
    const [newDeduction, setNewDeduction] = useState({ name: "", amount: "" });

    useEffect(() => {
        const fetchRecordAndStats = async () => {
            try {
                const response = await api.get(`/payroll/${id}`);
                if (response.status === 200) {
                    const data = response.data;
                    setRecord(data);

                    // Fetch overtime hours for this officer and month
                    const statsRes = await api.get(`/payroll/officer/stats/${data.officerId}?month=${data.month}`);
                    if (statsRes.status === 200) {
                        setMonthlyOvertimeHours(statsRes.data.monthlyOvertimeHours || 0);
                    }
                }
            } catch (error: any) {
                console.error("Error fetching record or stats:", error);
                const errorMsg = error.response?.data?.message || error.response?.data || error.message;
                toast.error(`Failed to load record: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchRecordAndStats();
    }, [id]);

    const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (["e", "E", "+", "-"].includes(e.key)) {
            e.preventDefault();
        }
    };

    const handleNumericPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedData = e.clipboardData.getData("text");
        if (!/^\d*\.?\d*$/.test(pastedData)) {
            e.preventDefault();
            toast.error("Only numeric values are allowed");
        }
    };

    if (isLoading) {
        return <div className="p-20 text-center font-black animate-pulse">LOADING RECORD DETAILS...</div>;
    }

    if (!record) {
        return <div className="p-20 text-center text-red-600 font-black">RECORD NOT FOUND</div>;
    }

    const overtimeAllowance = record.allowances.find(a => /(^ot$|overtime)/i.test(a.name));
    const overtimeAmount = overtimeAllowance?.amount ?? ((record.basicSalary / 200) * 1.5 * monthlyOvertimeHours);
    const extraAllowances = record.allowances.filter(a => a !== overtimeAllowance);
    const epfAmount = record.basicSalary * 0.08;

    const totalAllowances = record.basicSalary + overtimeAmount + extraAllowances.reduce((acc, curr) => acc + curr.amount, 0);
    const totalDeductions = record.deductions.reduce((acc, curr) => acc + curr.amount, 0);
    const netSalary = totalAllowances - totalDeductions;

    const handleShiftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || 0;
        setRecord({ ...record, totalShifts: val });
    };

    const addAllowance = () => {
        if (!newAllowance.name || !newAllowance.amount) return;
        setRecord({
            ...record,
            allowances: [...record.allowances, { name: newAllowance.name, amount: parseFloat(newAllowance.amount) }]
        });
        setNewAllowance({ name: "", amount: "" });
        toast.success("Allowance added");
    };

    const removeAllowance = (index: number) => {
        const newList = [...record.allowances];
        newList.splice(index, 1);
        setRecord({ ...record, allowances: newList });
        toast.info("Allowance removed");
    };

    const addDeduction = () => {
        if (!newDeduction.name || !newDeduction.amount) return;
        setRecord({
            ...record,
            deductions: [...record.deductions, { name: newDeduction.name, amount: parseFloat(newDeduction.amount) }]
        });
        setNewDeduction({ name: "", amount: "" });
        toast.success("Deduction added");
    };

    const removeDeduction = (index: number) => {
        const newList = [...record.deductions];
        newList.splice(index, 1);
        setRecord({ ...record, deductions: newList });
        toast.info("Deduction removed");
    };

    const handleSave = async () => {
        try {
            const response = await api.put(`/payroll/${id}`, {
                totalShifts: record.totalShifts,
                allowances: record.allowances,
                deductions: record.deductions
            });

            if (response.status === 200) {
                toast.success("Payroll record updated successfully!");
                navigate("/account-executive/payroll-records");
            }
        } catch (error: any) {
            console.error("Error saving record:", error);
            const errorMsg = error.response?.data?.message || error.response?.data || error.message;
            toast.error(`Update failed: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
        }
    };

    const formatCurrency = (val: number) => {
        return "LKR " + val.toLocaleString("en-US", { minimumFractionDigits: 2 });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Edit Payroll Record</h1>
                        <p className="text-muted-foreground">Adjust shifts, allowances and deductions for {format(parseISO(record.month + "-01"), "MMMM yyyy")}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Record ID</p>
                    <p className="text-xl font-mono font-bold text-primary">PAY-{record.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info Card */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Officer Information</CardTitle>
                        <CardDescription>Review and update basic payroll parameters</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Officer</Label>
                                <Input value={record.officerName} readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Salary Month</Label>
                                <Input value={record.month} readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-primary font-bold">Total Shifts *</Label>
                                <Input
                                    type="number"
                                    value={record.totalShifts}
                                    onChange={handleShiftChange}
                                    onKeyDown={handleNumericKeyDown}
                                    onPaste={handleNumericPaste}
                                    className="border-primary/50 focus-visible:ring-primary"
                                />
                                <p className="text-[10px] text-muted-foreground">Calculation: {record.totalShifts} shifts × {formatCurrency(record.otRate)} OT Rate</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Bank Details</Label>
                                <div className="text-sm p-3 bg-muted rounded-md border">
                                    <p className="font-semibold">{record.bankName} - {record.branchName}</p>
                                    <p className="text-xs text-muted-foreground mt-1">A/C: {record.accountNumber}</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                            {/* Allowances Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold flex items-center gap-2 text-green-600">
                                        <TrendingUp className="h-4 w-4" /> ALLOWANCES
                                    </h3>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm py-1">
                                        <span>Basic Salary</span>
                                        <span className="font-semibold">{formatCurrency(record.basicSalary)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-1 text-primary">
                                        <span>Overtime (OT)</span>
                                        <span className="font-bold">{formatCurrency(overtimeAmount)}</span>
                                    </div>
                                    {extraAllowances.map((al, idx) => (
                                        <div key={idx} className="flex justify-between text-sm py-1 group items-center">
                                            <span className="flex items-center gap-2">
                                                {al.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{formatCurrency(al.amount)}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeAllowance(record.allowances.indexOf(al))}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 space-y-2">
                                    <div className="flex gap-2">
                                        <Input placeholder="Name" value={newAllowance.name} onChange={(e) => setNewAllowance({ ...newAllowance, name: e.target.value })} className="h-8 text-xs" />
                                        <Input
                                            type="number"
                                            placeholder="Amount"
                                            value={newAllowance.amount}
                                            onChange={(e) => setNewAllowance({ ...newAllowance, amount: e.target.value })}
                                            onKeyDown={handleNumericKeyDown}
                                            onPaste={handleNumericPaste}
                                            className="h-8 text-xs w-24"
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full h-8 text-xs border-green-600 text-green-600 hover:bg-green-50" onClick={addAllowance}>
                                        <Plus className="h-3 w-3 mr-1" /> Add Allowance
                                    </Button>
                                </div>
                            </div>

                            {/* Deductions Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold flex items-center gap-2 text-red-600">
                                        <TrendingDown className="h-4 w-4" /> DEDUCTIONS
                                    </h3>
                                </div>

                                <div className="space-y-2">
                                    {record.deductions.map((de, idx) => (
                                        <div key={idx} className="flex justify-between text-sm py-1 group items-center">
                                            <span>{de.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{formatCurrency(de.amount)}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeDeduction(idx)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 space-y-2">
                                    <div className="flex gap-2">
                                        <Input placeholder="Name" value={newDeduction.name} onChange={(e) => setNewDeduction({ ...newDeduction, name: e.target.value })} className="h-8 text-xs" />
                                        <Input
                                            type="number"
                                            placeholder="Amount"
                                            value={newDeduction.amount}
                                            onChange={(e) => setNewDeduction({ ...newDeduction, amount: e.target.value })}
                                            onKeyDown={handleNumericKeyDown}
                                            onPaste={handleNumericPaste}
                                            className="h-8 text-xs w-24"
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full h-8 text-xs border-red-600 text-red-600 hover:bg-red-50" onClick={addDeduction}>
                                        <Plus className="h-3 w-3 mr-1" /> Add Deduction
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Side Card */}
                <div className="space-y-6">
                    <Card className="bg-amber-50 border border-amber-200 text-amber-900 shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2 text-amber-800">
                                <Wallet className="h-4 w-4 text-amber-600" /> NET SALARY
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-extrabold text-amber-900">{formatCurrency(netSalary)}</p>
                            <div className="mt-4 flex flex-col gap-1 text-xs text-amber-700">
                                <div className="flex justify-between border-b border-amber-200/50 pb-1">
                                    <span>Total Allowances</span>
                                    <span>{formatCurrency(totalAllowances)}</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span>Total Deductions</span>
                                    <span>({formatCurrency(totalDeductions)})</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <Button className="w-full h-12 text-md font-bold shadow-lg shadow-primary/20" onClick={handleSave}>
                            <Save className="h-5 w-5 mr-2" /> Save Changes
                        </Button>
                        <Button variant="outline" className="w-full h-12" onClick={() => navigate(-1)}>
                            <X className="h-5 w-5 mr-2" /> Cancel
                        </Button>
                    </div>

                    <Card className="bg-muted/50 border-dashed border-2">
                        <CardContent className="p-4 text-xs text-muted-foreground text-center">
                            <p>All changes made here will be reflected in the officer's pay sheet and financial reports immediately after saving.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default EditPayroll;
