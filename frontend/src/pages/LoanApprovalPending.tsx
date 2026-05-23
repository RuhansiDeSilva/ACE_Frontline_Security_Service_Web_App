import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, CheckCircle2, XCircle, Loader, AlertCircle, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loanService, type LoanRequest } from "@/services/loanService";
import DashboardHeader from "@/components/DashboardHeader";
import { useAuthenticatedUser } from "@/hooks/useAuthenticatedUser";

export default function LoanApprovalPending() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthenticatedUser();
  const [pendingLoans, setPendingLoans] = useState<(LoanRequest & { user: NonNullable<LoanRequest["user"]> })[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingLoanId, setRejectingLoanId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingLoans();
    const interval = setInterval(fetchPendingLoans, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingLoans = async () => {
    try {
      const loans = await loanService.getPendingLoans();
      const filtered = loans.filter(
        (l): l is LoanRequest & { user: NonNullable<LoanRequest["user"]> } =>
          l.user?.role === "SECURITY_OFFICER"
      );
      setPendingLoans(filtered);
    } catch (error) {
      console.error("Failed to fetch loans:", error);
      toast({
        title: "Error",
        description: "Failed to load pending loans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (loan: LoanRequest) => {
    setProcessingId(loan.id);
    try {
      await loanService.reviewLoan(loan.id, {
        approved: true,
      });
      setPendingLoans(prev => prev.filter(l => l.id !== loan.id));
      toast({
        title: "Approved",
        description: `Loan #${loan.id} approved successfully. Deduction schedule generated and notifications sent.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve loan",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingLoanId || !rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setProcessingId(rejectingLoanId);
    try {
      const loan = pendingLoans.find(l => l.id === rejectingLoanId);
      await loanService.reviewLoan(rejectingLoanId, {
        approved: false,
        rejectionReason: rejectReason.trim(),
      });
      setPendingLoans(prev => prev.filter(l => l.id !== rejectingLoanId));
      setRejectDialogOpen(false);
      setRejectingLoanId(null);
      setRejectReason("");
      toast({
        title: "Rejected",
        description: `Loan #${rejectingLoanId} rejected. Officer notified.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject loan",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={user.fullName}
        userRole="Executive Officer"
        onLogout={handleLogout}
        userId={user.userId || 0}
        backendRole="EXECUTIVE_OFFICER"
        profilePath="/executive-officer/profile"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
              Pending Loan Approvals
            </h1>
            <p className="text-muted-foreground mt-1">Review and approve loan requests from security officers</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-primary mr-3" />
            <p className="text-muted-foreground text-lg">Loading pending loans...</p>
          </div>
        ) : pendingLoans.length === 0 ? (
          <Card className="bg-card border-border/60">
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-semibold text-foreground">No Pending Loans</p>
                <p className="text-muted-foreground mt-2">All loan requests have been processed</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-orange-500/20">
                      <AlertCircle className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Requests</p>
                      <p className="text-3xl font-bold text-orange-400">{pendingLoans.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/20">
                      <DollarSign className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-3xl font-bold text-blue-400">
                        Rs. {pendingLoans.reduce((sum, l) => sum + (l.amount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-500/20">
                      <CheckCircle2 className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Repayment</p>
                      <p className="text-3xl font-bold text-purple-400">
                        {Math.round(pendingLoans.reduce((sum, l) => sum + (l.repaymentMonths || 0), 0) / Math.max(pendingLoans.length, 1))} months
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Loans Table */}
            <Card className="border-border/60 bg-card overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border/60">
                <CardTitle className="text-foreground">Loan Requests for Review</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/60 bg-muted/30">
                        <TableHead className="text-foreground font-semibold">ID</TableHead>
                        <TableHead className="text-foreground font-semibold">Security Officer</TableHead>
                        <TableHead className="text-foreground font-semibold">Amount</TableHead>
                        <TableHead className="text-foreground font-semibold">Duration</TableHead>
                        <TableHead className="text-foreground font-semibold">Monthly Amount</TableHead>
                        <TableHead className="text-foreground font-semibold">Reason</TableHead>
                        <TableHead className="text-foreground font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLoans.map((loan) => {
                        const monthlyAmount = loan.repaymentMonths && loan.repaymentMonths > 0
                          ? Math.round(loan.amount / loan.repaymentMonths)
                          : loan.amount;

                        return (
                          <TableRow key={loan.id} className="border-border/60 hover:bg-muted/50 transition-colors">
                            <TableCell className="font-mono font-bold text-primary">
                              #{loan.id}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-semibold text-foreground">{loan.user.fullName}</p>
                                <p className="text-xs text-muted-foreground">@{loan.user.username}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-bold text-primary text-lg">
                                Rs. {loan.amount.toLocaleString()}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-muted">
                                {loan.repaymentMonths} months
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="font-semibold text-foreground">
                                Rs. {monthlyAmount.toLocaleString()}/mo
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground max-w-xs truncate" title={loan.reason}>
                                {loan.reason || "No reason provided"}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  disabled={processingId === loan.id}
                                  onClick={() => handleApprove(loan)}
                                >
                                  {processingId === loan.id ? (
                                    <Loader className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setRejectingLoanId(loan.id);
                                    setRejectReason("");
                                    setRejectDialogOpen(true);
                                  }}
                                  disabled={processingId === loan.id}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Reject Loan Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground font-semibold">Reason for Rejection</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Provide a clear reason that will be communicated to the officer
              </p>
              <Textarea
                placeholder="e.g., Insufficient funds available, Already has pending loans, Policy violation..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[120px] bg-muted/50 border-border/60"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processingId === rejectingLoanId}
            >
              {processingId === rejectingLoanId ? (
                <>
                  <Loader className="h-3 w-3 animate-spin mr-1" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
