import { useState, useEffect } from "react";
import { loanService } from "@/services/loanService";
import type { LoanRequest } from "@/services/loanService";
import { addNotification } from "@/lib/notifications";
import { CheckCircle, XCircle, Clock, Loader2, DollarSign, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { getUserRole } from "@/lib/roleUtils";
import { useAuthenticatedUser } from "@/hooks/useAuthenticatedUser";

type ViewMode = "pending" | "approved" | "rejected";

const LoanApproval = () => {
  const navigate = useNavigate();
  const { user } = useAuthenticatedUser();
  const [viewMode, setViewMode] = useState<ViewMode>("pending");
  const [allPendingLoans, setAllPendingLoans] = useState<LoanRequest[]>([]);
  const [allApprovedLoans, setAllApprovedLoans] = useState<LoanRequest[]>([]);
  const [allRejectedLoans, setAllRejectedLoans] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Detail view dialog
  const [selectedLoan, setSelectedLoan] = useState<LoanRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<"approve" | "reject" | null>(null);
  
  // Rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  
  const userRole = getUserRole();
  const canViewAllLoans = ["DIRECTOR", "CHAIRMAN", "OPERATION_MANAGER", "ACCOUNT_EXECUTIVE"].includes(userRole);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    navigate("/staff-login");
  };

  const fetchLoans = async () => {
    setLoading(true);
    setAccessError(null);

    const showError = (err: any) => {
      const message =
        err?.message === "Access denied"
          ? "You do not have permission to view loan information. Please check your role or contact an administrator."
          : err?.message || "Could not connect to server. Check that the backend is running.";

      setAccessError(message);
      toast({
        title: "Failed to Load Loans",
        description: message,
        variant: "destructive",
      });
    };

    try {
      const pending = await loanService.getPendingLoans();
      setAllPendingLoans(pending);
    } catch (err: any) {
      console.error("Failed to load pending loans", err);
      showError(err);
    }

    if (canViewAllLoans) {
      try {
        const approved = await loanService.getApprovedLoans();
        setAllApprovedLoans(approved);
      } catch (err: any) {
        console.error("Failed to load approved loans", err);
        showError(err);
      }

      try {
        const allLoans = await loanService.getAllLoans();
        const rejected = allLoans.filter((loan) => loan.status === "REJECTED");
        setAllRejectedLoans(rejected);
      } catch (err: any) {
        console.error("Failed to load rejected loans", err);
        showError(err);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // Get current view data based on view mode
  const getViewData = () => {
    switch (viewMode) {
      case "approved":
        return allApprovedLoans;
      case "rejected":
        return allRejectedLoans;
      default:
        return allPendingLoans;
    }
  };

  // Filter loans based on search query
  const filteredLoans = getViewData().filter((loan) =>
    loan.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.id?.toString().includes(searchQuery)
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredLoans.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedLoans = filteredLoans.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, viewMode]);

  const handleApprove = async (loan: LoanRequest) => {
    if (!loan.id) return;

    try {
      await loanService.reviewLoan(loan.id, { approved: true });

      setAllPendingLoans((prev) => prev.filter((l) => l.id !== loan.id));
      setAllApprovedLoans((prev) => [
        ...prev,
        { ...loan, status: "APPROVED", reviewedAt: new Date().toISOString() },
      ]);

      addNotification(
        loan?.user?.id || 0,
        `Your loan request for LKR ${Math.round(loan?.amount || 0).toLocaleString()} has been APPROVED by the Executive Officer.`
      );
      addNotification(
        -1,
        `LOAN APPROVED: ${loan?.user?.fullName} — LKR ${Math.round(loan?.amount || 0).toLocaleString()} for ${loan?.repaymentMonths} months.`
      );

      toast({
        title: "Loan Approved",
        description: `${loan?.user?.fullName}'s loan approved successfully.`,
      });

      setDetailDialogOpen(false);
      setSelectedLoan(null);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to approve loan",
        variant: "destructive",
      });
    }
  };

  const openRejectDialog = (loan: LoanRequest) => {
    setSelectedLoan(loan);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedLoan?.id || !rejectReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      await loanService.reviewLoan(selectedLoan.id, {
        approved: false,
        rejectionReason: rejectReason.trim(),
      });

      setAllPendingLoans((prev) => prev.filter((l) => l.id !== selectedLoan.id));
      setAllRejectedLoans((prev) => [
        ...prev,
        {
          ...selectedLoan,
          status: "REJECTED",
          rejectionReason: rejectReason.trim(),
          reviewedAt: new Date().toISOString(),
        },
      ]);

      addNotification(
        selectedLoan?.user?.id || 0,
        `Your loan request for LKR ${Math.round(selectedLoan?.amount || 0).toLocaleString()} has been REJECTED. Reason: ${rejectReason.trim()}`
      );

      toast({
        title: "Loan Rejected",
        description: `${selectedLoan?.user?.fullName}'s loan has been rejected.`,
      });

      setRejectDialogOpen(false);
      setSelectedLoan(null);
      setRejectReason("");
      setDetailDialogOpen(false);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to reject loan",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={user?.fullName || "Executive Officer"}
        userRole="Executive Officer"
        onLogout={handleLogout}
        userId={user?.userId || 0}
        backendRole="EXECUTIVE_OFFICER"
        profilePath="/executive-officer/profile"
      />

      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <DollarSign className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Loan Approval</h1>
              <p className="text-muted-foreground">Review and approve pending loan requests</p>
            </div>
          </div>
          <Badge className="text-lg px-3 py-1 bg-primary/20 text-primary border-primary/50">
            {allPendingLoans.length} Pending
          </Badge>
        </div>

        {/* Search and Filter */}
        <Card className="border-border/50 dark:bg-card/50">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-col sm:flex-row">
              <Input
                placeholder="Search by officer name, username, or loan ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={fetchLoans}
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setViewMode("pending")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              viewMode === "pending"
                ? "border-b-primary text-foreground"
                : "border-b-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending ({allPendingLoans.length})
          </button>

          {canViewAllLoans && (
            <>
              <button
                onClick={() => setViewMode("approved")}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  viewMode === "approved"
                    ? "border-b-primary text-foreground"
                    : "border-b-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Approved ({allApprovedLoans.length})
              </button>
              <button
                onClick={() => setViewMode("rejected")}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  viewMode === "rejected"
                    ? "border-b-primary text-foreground"
                    : "border-b-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <XCircle className="w-4 h-4" />
                Rejected ({allRejectedLoans.length})
              </button>
            </>
          )}
        </div>

        {/* Loans List */}
        <Card className="border-border/50 dark:bg-card/50">
          <CardHeader>
            <CardTitle>
              {viewMode === "pending" && "Pending Approvals"}
              {viewMode === "approved" && "Approved Loans"}
              {viewMode === "rejected" && "Rejected Loans"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accessError && (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {accessError}
              </div>
            )}

            {loading && !filteredLoans.length ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span>Loading loans...</span>
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-50" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No loans match your search criteria"
                    : `No ${viewMode} loans`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border/50 hover:bg-transparent">
                        <TableHead>Loan ID</TableHead>
                        <TableHead>Officer</TableHead>
                        <TableHead className="text-right">Amount (LKR)</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLoans.map((loan) => (
                        <TableRow
                          key={loan.id}
                          className="border-b border-border/30"
                        >
                          <TableCell className="font-mono text-foreground">
                            #{loan.id}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {loan.user?.fullName}
                            <span className="text-xs text-muted-foreground block">
                              @{loan.user?.username}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono font-semibold text-primary">
                              {formatCurrency(loan.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="text-foreground">
                            {loan.repaymentMonths} months
                          </TableCell>
                          <TableCell className="max-w-[250px] truncate text-muted-foreground text-sm" title={loan.reason}>
                            {loan.reason}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {loan.createdAt
                              ? new Date(loan.createdAt).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setDetailDialogOpen(true);
                                }}
                                className="text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              {viewMode === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-700 hover:bg-green-800 text-xs"
                                    onClick={() => handleApprove(loan)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => openRejectDialog(loan)}
                                    className="text-xs"
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {filteredLoans.length > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Items per page:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 text-sm border border-border rounded-md bg-background text-foreground"
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredLoans.length)} of{" "}
                        {filteredLoans.length}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            size="sm"
                            variant={currentPage === page ? "default" : "outline"}
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Loan Request Details
            </DialogTitle>
            <DialogDescription>
              Review the full loan request before taking action
            </DialogDescription>
          </DialogHeader>

          {selectedLoan && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Loan ID</Label>
                  <p className="font-mono font-semibold text-foreground">#{selectedLoan.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge className={selectedLoan.status === "APPROVED" ? "bg-green-700/20 text-green-600" : selectedLoan.status === "REJECTED" ? "bg-red-700/20 text-red-600" : "bg-yellow-700/20 text-yellow-600"}>
                    {selectedLoan.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Officer Information</Label>
                <div className="bg-muted/30 p-3 rounded-lg space-y-1">
                  <p className="font-semibold text-foreground">{selectedLoan.user?.fullName}</p>
                  <p className="text-sm text-muted-foreground">@{selectedLoan.user?.username}</p>
                  {selectedLoan.user?.email && (
                    <p className="text-sm text-muted-foreground">{selectedLoan.user?.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Loan Amount</Label>
                  <p className="font-mono font-semibold text-primary">
                    LKR {formatCurrency(selectedLoan.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Repayment Period</Label>
                  <p className="font-semibold text-foreground">{selectedLoan.repaymentMonths} months</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Reason for Loan</Label>
                <p className="text-sm text-foreground mt-1 bg-muted/30 p-2 rounded">
                  {selectedLoan.reason}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Requested Date</Label>
                  <p className="text-sm text-foreground">
                    {selectedLoan.createdAt
                      ? new Date(selectedLoan.createdAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                {selectedLoan.reviewedAt && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Reviewed Date</Label>
                    <p className="text-sm text-foreground">
                      {new Date(selectedLoan.reviewedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedLoan.rejectionReason && (
                <div>
                  <Label className="text-xs text-muted-foreground">Rejection Reason</Label>
                  <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    {selectedLoan.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
            {selectedLoan && viewMode === "pending" && (
              <>
                <Button
                  className="bg-green-700 hover:bg-green-800"
                  onClick={() => {
                    handleApprove(selectedLoan);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    openRejectDialog(selectedLoan);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Reject Loan Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Reason for Rejection</Label>
            <Textarea
              placeholder="Please provide a reason for rejecting this loan request..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason("");
                setSelectedLoan(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanApproval;
