import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import {
    Download,
    ArrowLeft,
    Edit,
    Building2,
    Mail,
    Phone,
    User,
    Shield,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Info,
    Calendar,
    Hash,
    MapPin,
    Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
// import logo from "@/assets/logo.png"; // Logo removed for public repo

export interface PayrollDetail {
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
    allowances: Array<{ name: string; amount: number }>;
    deductions: Array<{ name: string; amount: number }>;
    netSalary: number;
    netSalaryInWords: string;
    status?: string;
}

const PayslipDetail = ({ id: propId }: { id?: string }) => {
    const { id: paramId } = useParams();
    const id = propId || paramId;
    const navigate = useNavigate();

    return <PayslipDetailContent id={Number(id)} onBack={() => navigate("/account-executive/payroll-records")} />;
};

export const PayslipDetailContent = ({ id, onBack, showEdit = true }: { id: number, onBack?: () => void, showEdit?: boolean }) => {
    const navigate = useNavigate();
    const [salary, setSalary] = useState<PayrollDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayslip = async () => {
            try {
                const response = await api.get(`/payroll/${id}`);
                if (response.status === 200) {
                    setSalary(response.data);
                }
            } catch (error: any) {
                console.error("Error fetching payslip:", error);
                const errorMsg = error.response?.data?.message || error.response?.data || error.message;
                toast.error(`Failed to load payslip: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchPayslip();
    }, [id]);

    const formatCurrency = (val: number) => {
        return "LKR " + val.toLocaleString("en-US", { minimumFractionDigits: 0 });
    };

    const handleDownload = async () => {
        try {
            toast.info("Preparing PDF download...");
            const response = await api.get(`/payroll/payslip/pdf/${id}`, { responseType: 'blob' });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            if (blob.size < 100) {
                console.warn("Generated PDF seems too small:", blob.size);
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payslip_${salary?.month || id}.pdf`);
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

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center bg-white rounded-3xl border border-neutral-100 font-black text-neutral-400 uppercase tracking-tighter text-2xl animate-pulse">
                Loading Secure Document...
            </div>
        );
    }

    if (!salary) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border border-neutral-100 space-y-4">
                <p className="text-xl font-bold text-neutral-800">Payslip Not Found</p>
                {onBack && <Button onClick={onBack}>Return</Button>}
            </div>
        );
    }

    const overtimeAllowance = salary.allowances.find(a => /(^ot$|overtime)/i.test(a.name));
    const overtimeAmount = overtimeAllowance?.amount ?? (salary.totalShifts * salary.otRate);
    const extraAllowances = salary.allowances.filter(a => a !== overtimeAllowance);
    const totalAllowances = salary.basicSalary + extraAllowances.reduce((acc, curr) => acc + curr.amount, 0) + overtimeAmount;
    const totalDeductions = salary.deductions.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="min-h-screen bg-neutral-50 p-4 md:p-8 animate-in fade-in duration-700 font-sans print:p-0 print:bg-white">
            <style>
                {`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; -webkit-print-color-adjust: exact; }
                    .print-container { width: 100% !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
                    @page { margin: 10mm; size: A4; }
                }
                `}
            </style>

            <div className="max-w-[210mm] mx-auto space-y-6">

                {/* Top Action Ribbon - Hidden in Print */}
                <div className="flex flex-wrap items-center justify-between gap-4 no-print bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                    <div className="flex items-center gap-2">
                        {onBack && (
                            <Button variant="ghost" onClick={onBack} className="h-9 w-9 p-0 rounded-full hover:bg-neutral-100">
                                <ArrowLeft className="h-4 w-4 text-neutral-600" />
                            </Button>
                        )}
                        <span className="text-sm font-bold text-neutral-700">{onBack ? "Back" : "Payment Detail"}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {showEdit && salary.status === 'CALCULATED' && (
                            <Button
                                onClick={() => navigate(`/account-executive/payroll/edit/${salary.id}`)}
                                className="bg-primary text-black hover:bg-charcoal/90 font-bold"
                            >
                                <Edit className="h-4 w-4 mr-2" /> Edit Slip
                            </Button>
                        )}
                        <Button onClick={handleDownload} className="bg-black hover:bg-neutral-800 text-white font-bold">
                            <Download className="h-4 w-4 mr-2" /> Download PDF
                        </Button>
                    </div>
                </div>

                {/* Payslip Document - A4 Optimized */}
                <Card className="print-container border-none shadow-xl overflow-hidden bg-white rounded-none md:rounded-lg">
                    {/* Header Section */}
                    <div className="bg-neutral-900 text-white p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
                            <div className="flex items-center gap-5">
                                <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
                                    {/* Logo removed */}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black uppercase tracking-tight text-white">Ace Front Line</h1>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Security Solutions (Pvt) Ltd</p>
                                    <div className="mt-2 text-[10px] text-neutral-400 font-medium space-y-0.5">
                                        <p>123 Main Street, Colombo 01, Sri Lanka</p>
                                        <p>Tel: +94 11 234 5678 | Email: info@acefrontline.lk</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-lg border border-white/20 inline-block">
                                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Payslip</h2>
                                    <p className="text-sm font-bold text-primary mt-1">{salary.month}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Strip */}
                    <div className="bg-neutral-50 border-b border-neutral-200 px-8 py-4 flex flex-wrap justify-between gap-4 text-xs">
                        <div>
                            <span className="text-neutral-500 font-bold uppercase text-[10px]">Payslip No:</span>
                            <span className="ml-2 font-mono font-bold text-neutral-900">PAY-{salary.id}</span>
                        </div>
                        <div>
                            <span className="text-neutral-500 font-bold uppercase text-[10px]">Calculated:</span>
                            <span className="ml-2 font-mono font-bold text-neutral-900">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span className="text-neutral-500 font-bold uppercase text-[10px]">Period:</span>
                            <span className="ml-2 font-mono font-bold text-neutral-900">01-{salary.month}</span>
                        </div>
                    </div>

                    <CardContent className="p-0">
                        {/* Employee Information */}
                        <div className="p-8 border-b border-neutral-200">
                            <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest mb-6 pb-2 border-b-2 border-primary w-fit">
                                Employee Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Employee ID</p>
                                    <p className="text-sm font-bold text-neutral-900 mt-1">{salary.officerId}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Employee Name</p>
                                    <p className="text-sm font-bold text-neutral-900 mt-1">{salary.officerName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Designation</p>
                                    <p className="text-sm font-bold text-neutral-900 mt-1">Security Officer</p> {/* Hardcoded as per DTO limit */}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Department</p>
                                    <p className="text-sm font-bold text-neutral-900 mt-1">Operations</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Total Shifts</p>
                                    <p className="text-sm font-bold text-neutral-900 mt-1">{salary.totalShifts} Shifts</p>
                                </div>
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="px-8 py-6 bg-neutral-50/50 border-b border-neutral-200">
                            <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest mb-6 pb-2 border-b-2 border-primary w-fit">
                                Bank Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Account Number</p>
                                    <p className="text-sm font-mono font-bold text-neutral-900 mt-1">{salary.accountNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Bank Name</p>
                                    <p className="text-sm font-bold text-neutral-900 mt-1">{salary.bankName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Branch</p>
                                    <p className="text-sm font-bold text-neutral-900 mt-1">{salary.branchName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Salary Breakdown */}
                        <div className="p-8">
                            <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest mb-6 pb-2 border-b-2 border-primary w-fit">
                                Salary Breakdown
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Earnings */}
                                <div>
                                    <div className="bg-neutral-900 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase tracking-wider">Earnings</span>
                                        <TrendingUp className="h-3 w-3 text-green-400" />
                                    </div>
                                    <div className="border border-neutral-200 border-t-0 rounded-b-lg overflow-hidden">
                                        <table className="w-full text-xs">
                                            <thead className="bg-neutral-50 border-b border-neutral-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-bold text-neutral-500">Description</th>
                                                    <th className="px-4 py-2 text-right font-bold text-neutral-500">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100">
                                                <tr>
                                                    <td className="px-4 py-3 text-neutral-700">Basic Salary</td>
                                                    <td className="px-4 py-3 text-right font-bold text-neutral-900">{formatCurrency(salary.basicSalary)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="px-4 py-3 text-neutral-700">Overtime</td>
                                                    <td className="px-4 py-3 text-right font-bold text-neutral-900">{formatCurrency(overtimeAmount)}</td>
                                                </tr>
                                                {extraAllowances.map((al, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3 text-neutral-700">{al.name}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-neutral-900">{formatCurrency(al.amount)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-green-50/50">
                                                    <td className="px-4 py-3 font-black text-neutral-800 uppercase text-[10px]">Total Earnings</td>
                                                    <td className="px-4 py-3 text-right font-black text-green-700 text-sm">{formatCurrency(totalAllowances)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Deductions */}
                                <div>
                                    <div className="bg-neutral-900 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase tracking-wider">Deductions</span>
                                        <TrendingDown className="h-3 w-3 text-red-400" />
                                    </div>
                                    <div className="border border-neutral-200 border-t-0 rounded-b-lg overflow-hidden">
                                        <table className="w-full text-xs">
                                            <thead className="bg-neutral-50 border-b border-neutral-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-bold text-neutral-500">Description</th>
                                                    <th className="px-4 py-2 text-right font-bold text-neutral-500">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100">
                                                {salary.deductions.map((de, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3 text-neutral-700">{de.name}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-neutral-900">{formatCurrency(de.amount)}</td>
                                                    </tr>
                                                ))}
                                                {salary.deductions.length === 0 && (
                                                    <tr>
                                                        <td colSpan={2} className="px-4 py-8 text-center text-neutral-400 italic">No deductions</td>
                                                    </tr>
                                                )}
                                                <tr className="bg-red-50/50">
                                                    <td className="px-4 py-3 font-black text-neutral-800 uppercase text-[10px]">Total Deductions</td>
                                                    <td className="px-4 py-3 text-right font-black text-red-700 text-sm">{formatCurrency(totalDeductions)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Net Salary Section */}
                        <div className="px-8 mb-8">
                            <div className="bg-neutral-900 rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                <div className="flex flex-col md:flex-row justify-between items-center relative z-10 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-primary text-xs font-bold uppercase tracking-widest">Net Salary (Take Home Pay)</p>
                                        <p className="text-3xl font-black tracking-tight">
                                            {formatCurrency(salary.netSalary)}
                                        </p>
                                        <p className="text-neutral-400 text-xs font-medium max-w-lg leading-relaxed">
                                            In Words: <span className="text-white font-bold italic">{salary.netSalaryInWords}</span>
                                        </p>
                                    </div>
                                    <div className="text-right border-l border-neutral-800 pl-8 min-w-[200px]">
                                        <p className="text-[10px] text-neutral-500 uppercase font-bold mb-2">Calculation</p>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-neutral-400">Total Earnings</span>
                                                <span className="font-bold">{formatCurrency(totalAllowances)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-neutral-400">Less Deductions</span>
                                                <span className="font-bold text-red-400">-{formatCurrency(totalDeductions)}</span>
                                            </div>
                                            <Separator className="bg-neutral-700 my-2" />
                                            <div className="flex justify-between text-base font-black text-primary">
                                                <span>Net Pay</span>
                                                <span>{formatCurrency(salary.netSalary)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="px-8 pb-8">
                            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-neutral-200">
                                    <div className="pt-2 md:pt-0">
                                        <p className="text-xs font-bold text-neutral-500 uppercase">Total Earnings</p>
                                        <p className="text-xl font-black text-neutral-900 mt-1">{formatCurrency(totalAllowances)}</p>
                                    </div>
                                    <div className="pt-4 md:pt-0">
                                        <p className="text-xs font-bold text-neutral-500 uppercase">Total Deductions</p>
                                        <p className="text-xl font-black text-red-600 mt-1">{formatCurrency(totalDeductions)}</p>
                                    </div>
                                    <div className="pt-4 md:pt-0">
                                        <p className="text-xs font-bold text-neutral-500 uppercase">Net Pay</p>
                                        <p className="text-xl font-black text-primary mt-1">{formatCurrency(salary.netSalary)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="bg-neutral-100 px-8 py-8 border-t border-neutral-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <p className="text-xs font-bold text-neutral-700 mb-2 uppercase">Notes:</p>
                                    <ul className="text-[10px] text-neutral-500 space-y-1 list-disc pl-3">
                                        <li>This is a computer-generated payslip and does not require a physical signature.</li>
                                        <li>Please verify all details and report any discrepancies to HR immediately.</li>
                                        <li>EPF contributions are remitted as per statutory requirements.</li>
                                    </ul>
                                </div>
                                <div className="flex flex-col items-end justify-end">
                                    <div className="text-center">
                                        <div className="h-12 w-32 border-b-2 border-dashed border-neutral-300 mb-2"></div>
                                        <p className="text-xs font-bold text-neutral-700 uppercase">Authorized Signature</p>
                                        <p className="text-[10px] text-neutral-500 uppercase">Finance Department</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center text-[10px] text-neutral-400 border-t border-neutral-200 pt-4">
                                <p>&copy; 2026 Ace Front Line Security Solutions. All rights reserved.</p>
                                <p className="mt-1">Generated on {new Date().toLocaleDateString()} | Confidential Document</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="text-center no-print pb-8">
                </div>
            </div>
        </div>
    );
};

export default PayslipDetail;
