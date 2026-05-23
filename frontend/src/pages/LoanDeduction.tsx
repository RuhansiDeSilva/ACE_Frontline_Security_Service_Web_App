import { useState, useEffect } from "react";
import { loanDeductionService } from "@/services/loanDeductionService";
import type { LoanDeduction } from "@/services/loanDeductionService";
import { ArrowLeft, DollarSign, CheckCircle2, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { useAuthenticatedUser } from "@/hooks/useAuthenticatedUser";

const LoanDeductions = () => {
  const navigate = useNavigate();
  const { user, isLoading: userLoading } = useAuthenticatedUser();
  const [deductions, setDeductions] = useState<LoanDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLoanId, setExpandedLoanId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    navigate("/staff-login");
  };

  const fetchDeductions = () => {
    loanDeductionService.getAllDeductions()
      .then(setDeductions)
      .catch((err: any) => toast({
        title: "Failed to load deductions",
        description: err.message || "Could not connect to server.",
        variant: "destructive",
      }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/staff-login");
      return;
    }
    fetchDeductions();
  }, []);

  const handleMarkPaid = async (id: number) => {
    setProcessingId(id);
    try {
      await loanDeductionService.markAsPaid(id);
      toast({ title: "Deduction Marked Paid", description: "Deduction has been recorded as paid. The applicant has been notified." });
      // Re-fetch to reflect any schedule removals (loan fully repaid)
      fetchDeductions();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to mark as paid", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "PAID": return "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]";
      case "PENDING": return "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Group deductions by loan
  const loanIds = [...new Set(deductions.map(d => d.loanRequest?.id).filter(Boolean))];
  const groupedByLoan = loanIds.map(loanId => ({
    loanId: loanId!,
    items: deductions.filter(d => d.loanRequest?.id === loanId),
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader
        userName={user?.fullName || "Account Executive"}
        userRole="Account Executive"
        onLogout={handleLogout}
        userId={user?.userId || 0}
        backendRole="ACCOUNT_EXECUTIVE"
        profilePath="/account-executive/profile"
      />
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/account-executive")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <DollarSign className="w-5 h-5 text-primary" />
              Loan Deductions — Account Executive
            </h1>
          </div>

          {loading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : groupedByLoan.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center" style={{ boxShadow: "var(--card-shadow)" }}>
              <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No loan deduction schedules found.</p>
              <p className="text-muted-foreground text-xs mt-1">Approved loans with generated schedules will appear here.</p>
            </div>
          ) : (
            groupedByLoan.map(({ loanId, items }) => {
              const first = items[0];
              const pendingCount = items.filter(d => d.status === "PENDING").length;
              const totalAmount = first.loanRequest?.amount || 0;
              const monthlyAmount = first.amount || 0;
              const employeeName = first.user?.fullName || "Unknown";
              return (
                <div key={loanId} className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--card-shadow)" }}>
                  <div
                    className="p-5 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedLoanId(expandedLoanId === loanId ? null : loanId)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-foreground">{employeeName}</h3>
                        <p className="text-sm text-muted-foreground">Loan #{loanId}</p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Total</p>
                          <p className="font-bold font-mono text-foreground">LKR {Math.round(totalAmount).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Monthly</p>
                          <p className="font-bold font-mono text-primary">LKR {Math.round(monthlyAmount).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Remaining</p>
                          <p className="font-bold font-mono text-foreground">{pendingCount} months</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Paid</p>
                          <p className="font-bold font-mono text-[hsl(var(--success))]">{items.length - pendingCount}/{items.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedLoanId === loanId && (
                    <div className="border-t border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Amount (LKR)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((d, i) => (
                            <TableRow key={d.id}>
                              <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
                              <TableCell className="text-foreground">
                                {d.deductionMonth || "—"}
                              </TableCell>
                              <TableCell className="font-mono">{Math.round(d.amount).toLocaleString()}</TableCell>
                              <TableCell><Badge className={statusColor(d.status)}>{d.status}</Badge></TableCell>
                              <TableCell>
                                {d.status === "PENDING" && (
                                  <Button
                                    size="sm"
                                    className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
                                    onClick={() => handleMarkPaid(d.id)}
                                    disabled={processingId === d.id}
                                  >
                                    {processingId === d.id
                                      ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                      : <CheckCircle2 className="w-3 h-3 mr-1" />
                                    }
                                    Mark Paid
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanDeductions;
