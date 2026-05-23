import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, DollarSign, CheckCircle2, Clock, AlertCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loanService, type LoanRequest } from "@/services/loanService";
import { loanDeductionService, type LoanDeduction } from "@/services/loanDeductionService";
import { authService } from "@/services/authService";
import DashboardHeader from "@/components/DashboardHeader";
import { useAuthenticatedUser } from "@/hooks/useAuthenticatedUser";

export default function DeductionSchedule() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthenticatedUser();
  const [myLoans, setMyLoans] = useState<LoanRequest[]>([]);
  const [deductions, setDeductions] = useState<LoanDeduction[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [loans, deductionsData, profile] = await Promise.all([
        loanService.getMyLoans(),
        loanDeductionService.getMyDeductions(),
        authService.getMyProfile(),
      ]);
      setMyLoans(loans);
      setDeductions(deductionsData);
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to load deduction schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    navigate("/staff-login");
  };

  const approvedLoans = myLoans.filter(l => l.status === "APPROVED");
  const rejectedLoans = myLoans.filter(l => l.status === "REJECTED");
  const pendingLoans = myLoans.filter(l => l.status === "PENDING");

  const totalDeductionAmount = deductions.reduce((sum, d) => sum + d.amount, 0);
  const paidDeductionAmount = deductions.filter(d => d.status === "PAID").reduce((sum, d) => sum + d.amount, 0);
  const pendingDeductionAmount = totalDeductionAmount - paidDeductionAmount;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={user.fullName}
        userRole="Security Officer"
        onLogout={handleLogout}
        userId={user.userId || 0}
        backendRole="SECURITY_OFFICER"
        profilePath="/security-officer/profile"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-primary" />
              My Loan Deduction Schedule
            </h1>
            <p className="text-muted-foreground mt-1">Track your approved loans and monthly deductions</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your deduction schedule...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* My Profile Card */}
            {userProfile && (
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-foreground">Your Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Full Name</p>
                      <p className="text-lg font-bold text-foreground">{userProfile.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Employee ID</p>
                      <p className="text-lg font-mono text-primary font-semibold">#{userProfile.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Username</p>
                      <p className="text-lg font-medium text-foreground">@{userProfile.username}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Designation</p>
                      <p className="text-lg font-medium text-foreground">{userProfile.role?.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deduction Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/20">
                      <DollarSign className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Deduction</p>
                      <p className="text-3xl font-bold text-blue-400">
                        Rs. {totalDeductionAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-500/20">
                      <CheckCircle2 className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Already Paid</p>
                      <p className="text-3xl font-bold text-green-400">
                        Rs. {paidDeductionAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-orange-500/20">
                      <Clock className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Deduction</p>
                      <p className="text-3xl font-bold text-orange-400">
                        Rs. {pendingDeductionAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Approved Loans */}
            {approvedLoans.length > 0 && (
              <Card className="border-border/60 bg-card">
                <CardHeader className="bg-muted/50 border-b border-border/60">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    Approved Loans ({approvedLoans.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-3 p-6">
                    {approvedLoans.map((loan) => {
                      const loanDeductions = deductions.filter(d => d.loanRequest?.id === loan.id);
                      const paidCount = loanDeductions.filter(d => d.status === "PAID").length;

                      return (
                        <div key={loan.id} className="border border-border/50 rounded-lg p-4 hover:border-primary/50 transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-mono text-sm text-muted-foreground">Loan #{loan.id}</p>
                              <p className="text-lg font-bold text-foreground">
                                Rs. {loan.amount.toLocaleString()}
                              </p>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              APPROVED
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="font-semibold text-foreground">{loan.repaymentMonths} months</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Monthly Amount</p>
                              <p className="font-semibold text-primary">
                                Rs. {loan.repaymentMonths ? Math.round(loan.amount / loan.repaymentMonths).toLocaleString() : loan.amount.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Progress</p>
                              <p className="font-semibold text-blue-400">{paidCount}/{loanDeductions.length} paid</p>
                            </div>
                          </div>
                          {loan.reason && (
                            <div className="mt-3 pt-3 border-t border-border/30">
                              <p className="text-xs text-muted-foreground mb-1">Reason</p>
                              <p className="text-sm text-foreground">{loan.reason}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deduction Schedule Details */}
            {deductions.length > 0 && (
              <Card className="border-border/60 bg-card">
                <CardHeader className="bg-muted/50 border-b border-border/60">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Monthly Deduction Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/60 bg-muted/30">
                          <TableHead className="text-foreground font-semibold">Loan ID</TableHead>
                          <TableHead className="text-foreground font-semibold">Month</TableHead>
                          <TableHead className="text-foreground font-semibold">Amount</TableHead>
                          <TableHead className="text-foreground font-semibold">Status</TableHead>
                          <TableHead className="text-foreground font-semibold">Processed Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deductions
                          .sort((a, b) => {
                            if (a.status !== b.status) return a.status === "PENDING" ? -1 : 1;
                            return a.deductionMonth.localeCompare(b.deductionMonth);
                          })
                          .map((deduction) => (
                            <TableRow key={deduction.id} className="border-border/60 hover:bg-muted/50">
                              <TableCell className="font-mono font-semibold text-primary">
                                #{deduction.loanRequest?.id}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  {deduction.deductionMonth}
                                </div>
                              </TableCell>
                              <TableCell className="font-bold text-lg text-foreground">
                                Rs. {deduction.amount.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {deduction.status === "PAID" ? (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    PAID
                                  </Badge>
                                ) : (
                                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                                    <Clock className="h-3 w-3 mr-1" />
                                    PENDING
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {deduction.status === "PAID" && deduction.processedAt
                                  ? new Date(deduction.processedAt).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rejected Loans */}
            {rejectedLoans.length > 0 && (
              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader className="bg-red-500/10 border-b border-red-500/20">
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    Rejected Loans ({rejectedLoans.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {rejectedLoans.map((loan) => (
                      <div key={loan.id} className="border border-red-500/30 rounded-lg p-4 bg-red-500/5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-mono text-sm text-muted-foreground">Loan #{loan.id}</p>
                            <p className="text-lg font-bold text-foreground">
                              Rs. {loan.amount.toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="destructive" className="bg-red-500/20 text-red-400">
                            REJECTED
                          </Badge>
                        </div>
                        {loan.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-500/10 rounded border border-red-500/20">
                            <p className="text-xs text-muted-foreground mb-1">Rejection Reason</p>
                            <p className="text-sm text-red-400 font-medium">{loan.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {approvedLoans.length === 0 && rejectedLoans.length === 0 && pendingLoans.length === 0 && (
              <Card className="bg-card border-border/60">
                <CardContent className="py-12">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-semibold text-foreground">No Loans Yet</p>
                    <p className="text-muted-foreground mt-2">You haven't submitted any loan requests</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
