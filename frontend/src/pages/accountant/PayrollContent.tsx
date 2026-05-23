import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader, DollarSign, CheckCircle2, Clock, TrendingUp, Wallet, CreditCard, Calendar, FileText, ExternalLink, BarChart3 } from "lucide-react";
import { loanService, type LoanRequest } from "@/services/loanService";
import { advanceService, type AdvanceRequest } from "@/services/advanceService";
import { loanDeductionService, type LoanDeduction } from "@/services/loanDeductionService";
import { adminPayrollService, type PayrollResponse, type PayrollStatistics } from "@/services/adminPayrollService";
import { authService, type UserProfile } from "@/services/authService";
import AdminPayrollPageContent from "@/pages/AdminPayrollPageContent";
import AdminPayrollListPageContent from "@/pages/AdminPayrollListPageContent";
import GeneratePayroll from "./GeneratePayroll";
import PayrollRecords from "./PayrollRecords";
import SalaryTrends from "./SalaryTrends";
import admin_PayrollPage from "@/pages/admin_PayrollPage";
import admin_PayrollListPage from "@/pages/admin_PayrollListPage";
import admin_PayrollStatisticsPage from "@/pages/admin_PayrollStatisticsPage";
import MonthlyStatistics from "@/pages/area-manager/MonthlyStatistics";
import PaysheetHistoryTab from "@/components/profile/PaysheetHistoryTab";

export type PayrollSubTab = "salary-trend" | "generate-payroll" | "payroll-records" | "advance" | "loan" | "monthly-statistics" | "edit-payroll" | "payslip-detail" | "paysheet-history";

interface PayrollContentProps {
  category: "admin" | "security";
  subTab: PayrollSubTab;
}

export default function PayrollContent({ category, subTab }: PayrollContentProps) {
  const [approvedLoans, setApprovedLoans] = useState<LoanRequest[]>([]);
  const [approvedAdvances, setApprovedAdvances] = useState<AdvanceRequest[]>([]);
  const [deductions, setDeductions] = useState<LoanDeduction[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [loadingAdvances, setLoadingAdvances] = useState(false);
  const [loadingDeductions, setLoadingDeductions] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (subTab === "loan") {
      fetchApprovedLoans();
      fetchDeductions();
      // Auto-refresh deductions every 30 seconds to catch updates from approvals
      const interval = setInterval(() => {
        fetchDeductions();
      }, 30000);
      return () => clearInterval(interval);
    }
    if (subTab === "advance") {
      fetchApprovedAdvances();
    }
  }, [subTab]);

  const fetchApprovedLoans = async () => {
    setLoadingLoans(true);
    try {
      const approved = await loanService.getApprovedLoans();
      setApprovedLoans(approved);
    } catch (error) {
      console.error("Failed to fetch approved loans:", error);
    } finally {
      setLoadingLoans(false);
    }
  };

  const fetchDeductions = async () => {
    setLoadingDeductions(true);
    try {
      const allDeductions = await loanDeductionService.getAllDeductions();
      setDeductions(allDeductions);
    } catch (error) {
      console.error("Failed to fetch deductions:", error);
    } finally {
      setLoadingDeductions(false);
    }
  };

  const handleMarkPaid = async (deductionId: number) => {
    setProcessingId(deductionId);
    try {
      await loanDeductionService.markAsPaid(deductionId);
      setDeductions(prev =>
        prev.map(d => d.id === deductionId ? { ...d, status: "PAID" as const, processedAt: new Date().toISOString() } : d)
      );
    } catch (error) {
      console.error("Failed to mark deduction as paid:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const fetchApprovedAdvances = async () => {
    setLoadingAdvances(true);
    try {
      // Use dedicated endpoint for approved advances
      const approved = await advanceService.getApprovedAdvances();
      setApprovedAdvances(approved);
    } catch (error) {
      console.error("Failed to fetch approved advances:", error);
    } finally {
      setLoadingAdvances(false);
    }
  };

  // ========== MOVE ALL HOOKS HERE (at the top of component) ==========
  // Stats for salary-trend
  const [stats, setStats] = useState<PayrollStatistics[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Generate-payroll state
  const [generateLoading, setGenerateLoading] = useState(false);
  const [payMonth, setPayMonth] = useState(new Date().toISOString().slice(0, 7));
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Payroll records state
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [payrolls, setPayrolls] = useState<PayrollResponse[]>([]);

  // Admin staff payroll form state
  const [employeeId, setEmployeeId] = useState<string>('');
  const [employeeDetails, setEmployeeDetails] = useState<UserProfile | null>(null);
  const [allowances, setAllowances] = useState<number>(0);
  const [payrollRemarks, setPayrollRemarks] = useState('');
  const [fetchingEmployee, setFetchingEmployee] = useState(false);
  const [employeeError, setEmployeeError] = useState<string>('');

  // Initialize salary stats fetch
  useEffect(() => {
    if (subTab === "salary-trend") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const fetchStats = async () => {
        setStatsLoading(true);
        try {
          const statistics = await adminPayrollService.getMonthlyStatistics(currentMonth);
          setStats(statistics);
        } catch (error) {
          console.error("Failed to fetch salary trend:", error);
        } finally {
          setStatsLoading(false);
        }
      };
      fetchStats();
    }
  }, [category, subTab]);

  // Initialize payroll records fetch
  useEffect(() => {
    if (subTab === "payroll-records") {
      const fetchRecords = async () => {
        setRecordsLoading(true);
        try {
          const approved = await adminPayrollService.getApprovedPayrolls();
          setPayrolls(approved);
        } catch (error) {
          console.error("Failed to fetch payroll records:", error);
        } finally {
          setRecordsLoading(false);
        }
      };
      fetchRecords();
    }
  }, [category, subTab]);

  // ========== NOW USE CONDITIONAL RENDERING (instead of early returns) ==========
  if (category === "security" && subTab === "advance") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
            <Wallet className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Approved Advances
            </h2>
            <p className="text-sm text-muted-foreground">
              Advances approved for Security Officers
            </p>
          </div>
        </div>

        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              Approved Advance Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAdvances ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : approvedAdvances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No approved advances yet</p>
                <p className="text-sm">Approved advances will appear here for payroll processing</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-primary">ID</TableHead>
                      <TableHead className="text-primary">Officer</TableHead>
                      <TableHead className="text-primary">Area</TableHead>
                      <TableHead className="text-primary">Amount</TableHead>
                      <TableHead className="text-primary">Month</TableHead>
                      <TableHead className="text-primary">Reason</TableHead>
                      <TableHead className="text-primary">Status</TableHead>
                      <TableHead className="text-primary">Approved On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedAdvances.map((advance) => (
                      <TableRow key={advance.id} className="border-border hover:bg-muted/50">
                        <TableCell className="text-foreground font-mono">#{advance.id}</TableCell>
                        <TableCell className="text-foreground font-medium">
                          {advance.user?.fullName || "Unknown"}
                          <span className="text-xs text-muted-foreground block">
                            @{advance.user?.username}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {advance.user?.assignedArea || "-"}
                        </TableCell>
                        <TableCell className="text-primary font-semibold">
                          LKR {advance.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {advance.forMonth}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate" title={advance.reason}>
                          {advance.reason}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {advance.reviewedAt
                            ? new Date(advance.reviewedAt).toLocaleDateString()
                            : new Date(advance.createdAt).toLocaleDateString()
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advance Summary Card */}
        {approvedAdvances.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <DollarSign className="h-10 w-10 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Advance Amount</p>
                    <p className="text-2xl font-bold text-primary">
                      LKR {approvedAdvances.reduce((sum, adv) => sum + adv.amount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="h-10 w-10 text-green-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Approved Advances</p>
                    <p className="text-2xl font-bold text-green-400">
                      {approvedAdvances.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  if (category === "security" && subTab === "loan") {
    const pendingDeductions = deductions.filter(d => d.status === "PENDING");
    const paidDeductions = deductions.filter(d => d.status === "PAID");
    const totalPendingAmount = pendingDeductions.reduce((sum, d) => sum + d.amount, 0);
    const totalPaidAmount = paidDeductions.reduce((sum, d) => sum + d.amount, 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary shadow-lg">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Loan Management
            </h2>
            <p className="text-sm text-muted-foreground">
              {category === "admin" ? "Admin Staff" : "Security Officers"} — Loans & Deductions
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <DollarSign className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Loan Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    LKR {approvedLoans.reduce((sum, loan) => sum + loan.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Paid Deductions</p>
                  <p className="text-2xl font-bold text-primary">
                    LKR {totalPaidAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Clock className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Deductions</p>
                  <p className="text-2xl font-bold text-primary">
                    LKR {totalPendingAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Loans</p>
                  <p className="text-2xl font-bold text-primary">
                    {approvedLoans.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loan Approval List */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4">Loan Approval List</h3>
          {loadingLoans ? (
            <Card className="bg-card border-border/60">
              <CardContent className="py-12 text-center">
                <Loader className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Loading approved loans...</p>
              </CardContent>
            </Card>
          ) : approvedLoans.length === 0 ? (
            <Card className="bg-card border-border/60">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No approved loans to display</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 bg-muted/50">
                    <TableHead className="text-foreground font-semibold">Loan ID</TableHead>
                    <TableHead className="text-foreground font-semibold">Officer Name</TableHead>
                    <TableHead className="text-foreground font-semibold">Amount (LKR)</TableHead>
                    <TableHead className="text-foreground font-semibold">Repayment Period</TableHead>
                    <TableHead className="text-foreground font-semibold">Monthly Installment</TableHead>
                    <TableHead className="text-foreground font-semibold">Reason</TableHead>
                    <TableHead className="text-foreground font-semibold">Approval Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedLoans.map((loan) => {
                    const monthlyInstallment = Math.round(loan.amount / loan.repaymentMonths);
                    const userInfo = loan.user;
                    return (
                      <TableRow key={loan.id} className="border-border/60 hover:bg-muted/50">
                        <TableCell className="font-mono text-foreground font-medium">#{loan.id}</TableCell>
                        <TableCell className="text-foreground font-medium">{userInfo?.fullName || "N/A"}</TableCell>
                        <TableCell className="text-foreground font-semibold">{Math.round(loan.amount).toLocaleString()}</TableCell>
                        <TableCell className="text-foreground">{loan.repaymentMonths} months</TableCell>
                        <TableCell className="text-foreground font-semibold">LKR {monthlyInstallment.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate" title={loan.reason}>{loan.reason}</TableCell>
                        <TableCell className="text-foreground text-sm">
                          {loan.approvedAt ? new Date(loan.approvedAt).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>

        {/* Loan Deduction Schedule */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4">Loan Deduction Schedule</h3>
          {loadingDeductions ? (
            <Card className="bg-card border-border/60">
              <CardContent className="py-12 text-center">
                <Loader className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Loading deduction schedule...</p>
              </CardContent>
            </Card>
          ) : deductions.length === 0 ? (
            <Card className="bg-card border-border/60">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No deduction schedule to display</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 bg-muted/50">
                    <TableHead className="text-foreground font-semibold">Deduction ID</TableHead>
                    <TableHead className="text-foreground font-semibold">Loan ID</TableHead>
                    <TableHead className="text-foreground font-semibold">Officer Name</TableHead>
                    <TableHead className="text-foreground font-semibold">Month</TableHead>
                    <TableHead className="text-foreground font-semibold">Amount (LKR)</TableHead>
                    <TableHead className="text-foreground font-semibold">Status</TableHead>
                    <TableHead className="text-foreground font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductions.map((deduction) => (
                    <TableRow key={deduction.id} className="border-border/60 hover:bg-muted/50">
                      <TableCell className="font-mono text-foreground font-medium">#{deduction.id}</TableCell>
                      <TableCell className="text-foreground font-medium">#{deduction.loanId}</TableCell>
                      <TableCell className="text-foreground font-medium">{deduction.securityOfficerName || "N/A"}</TableCell>
                      <TableCell className="text-foreground">
                        {deduction.month ? new Date(deduction.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '-'}
                      </TableCell>
                      <TableCell className="text-foreground font-semibold">LKR {Math.round(deduction.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={`${
                          deduction.status === "PAID"
                            ? "bg-green-500/20 text-green-700 border border-green-500/30"
                            : "bg-amber-500/20 text-amber-700 border border-amber-500/30"
                        }`}>
                          {deduction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {deduction.status === "PENDING" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleMarkPaid(deduction.id)}
                            disabled={processingId === deduction.id}
                          >
                            {processingId === deduction.id ? (
                              <>
                                <Loader className="w-3 h-3 mr-1 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Mark Paid
                              </>
                            )}
                          </Button>
                        )}
                        {deduction.status === "PAID" && (
                          <span className="text-sm text-green-600 font-medium">✓ Paid</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    );
  }


  // Handle salary-trend tab
  if (subTab === "salary-trend") {
    return <SalaryTrends />;
  }

  // Fetch employee details when admin category and employee ID is provided
  const handleEmployeeSearch = async (id: string) => {
    const trimmedId = id.trim();
    setEmployeeId(trimmedId);
    if (!trimmedId) {
      setEmployeeDetails(null);
      setEmployeeError('');
      return;
    }

    setFetchingEmployee(true);
    setEmployeeError('');
    try {
      const employee = await authService.getUserById(trimmedId);
      setEmployeeDetails(employee);
    } catch (error: any) {
      setEmployeeError(error.message || 'Employee not found');
      setEmployeeDetails(null);
    } finally {
      setFetchingEmployee(false);
    }
  };

  // Handle generate-payroll tab
  if (subTab === "generate-payroll") {
    // For admin, show admin_PayrollPage
    if (category === "admin") {
      return <admin_PayrollPage />;
    }

    // For security, show GeneratePayroll component
    return <GeneratePayroll />;
  }

  // Handle payroll-records tab
  if (subTab === "payroll-records") {
    // For admin, show admin_PayrollListPage
    if (category === "admin") {
      return <admin_PayrollListPage />;
    }

    // For security, show PayrollRecords component
    return <PayrollRecords />;
  }

  // Handle monthly-statistics tab
  if (subTab === "monthly-statistics") {
    // For admin, show admin_PayrollStatisticsPage
    if (category === "admin") {
      return <admin_PayrollStatisticsPage />;
    }

    // For security, show area-manager generated monthly statistics.
    return <MonthlyStatistics />;
  }

  // Handle paysheet-history tab
  if (subTab === "paysheet-history") {
    return <PaysheetHistoryTab />;
  }

  // Default content for other tabs
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
          <DollarSign className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
            {subTab.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {category === "admin" ? "Admin Staff" : "Security Officers"} - Payroll Management
          </p>
        </div>
      </div>

      <Card className="bg-card border border-border">
        <CardContent className="p-12 text-center">
          <Clock className="h-16 w-16 mx-auto mb-4 text-primary/50" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Coming Soon</h3>
          <p className="text-muted-foreground">
            This feature is under development. Please check back later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
