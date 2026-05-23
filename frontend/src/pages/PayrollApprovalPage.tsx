import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { adminPayrollService, type PayrollResponse } from "@/services/adminPayrollService";
import DashboardHeader from "@/components/DashboardHeader";
import { useNavigate } from "react-router-dom";

export default function PayrollApprovalPage() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState<PayrollResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollResponse | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Check if user is director
      if (!parsedUser.roles || !parsedUser.roles.includes("ROLE_DIRECTOR")) {
        toast.error("Only directors can access this page");
        navigate("/admin-dashboard");
      }
    } else {
      navigate("/staff-login");
    }
  }, [navigate]);

  useEffect(() => {
    fetchPendingPayrolls();
  }, []);

  const fetchPendingPayrolls = async () => {
    setLoading(true);
    try {
      const data = await adminPayrollService.getPendingApprovals();
      setPayrolls(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch pending payrolls");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (payroll: PayrollResponse) => {
    setSelectedPayroll(payroll);
    setActionType("approve");
    setRemarks("");
  };

  const handleReject = (payroll: PayrollResponse) => {
    setSelectedPayroll(payroll);
    setActionType("reject");
    setRemarks("");
  };

  const handleSubmitAction = async () => {
    if (!selectedPayroll || !actionType) return;
    if (actionType === "reject" && !remarks.trim()) {
      toast.error("Please enter rejection reason");
      return;
    }

    setSubmitting(true);
    try {
      if (actionType === "approve") {
        await adminPayrollService.approvePayroll(selectedPayroll.id, remarks.trim() ? remarks : undefined);
        toast.success("Payroll approved successfully");
      } else {
        await adminPayrollService.rejectPayroll(selectedPayroll.id, remarks);
        toast.success("Payroll rejected and sent back to account executive");
      }
      // Refresh list
      await fetchPendingPayrolls();
      setSelectedPayroll(null);
      setActionType(null);
      setRemarks("");
    } catch (error: any) {
      toast.error(error.message || `Failed to ${actionType} payroll`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayrolls = payrolls.filter((p) =>
    p.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.employeeId?.toString().includes(searchQuery)
  );

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={user?.fullName || "User"}
        userRole={user?.role || ""}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/staff-login");
        }}
      />

      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Clock className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Payroll Approval</h1>
              <p className="text-muted-foreground">Review and approve pending payroll submissions</p>
            </div>
          </div>
          <Badge className="text-lg px-3 py-1 bg-primary/20 text-primary border-primary/50">
            {filteredPayrolls.length} Pending
          </Badge>
        </div>

        {/* Search and Filter */}
        <Card className="border-border/50 dark:bg-card/50">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search by employee name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button onClick={fetchPendingPayrolls} disabled={loading} className="bg-primary hover:bg-primary/90">
                {loading ? <Loader className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payrolls List */}
        <Card className="border-border/50 dark:bg-card/50">
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !payrolls.length ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-primary mr-2" />
                <span>Loading payrolls...</span>
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-50" />
                <p className="text-muted-foreground">No pending payrolls for approval</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/50 hover:bg-transparent">
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Pay Month</TableHead>
                      <TableHead className="text-right">Gross Salary</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Salary</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayrolls.map((payroll) => (
                      <TableRow key={payroll.id} className="border-b border-border/30">
                        <TableCell className="font-semibold text-foreground">{payroll.employeeName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-muted">
                            {payroll.employeeRole}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{payroll.payMonth}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-foreground">
                            {formatCurrency(payroll.basicSalary + payroll.allowances + (payroll.otAmount || 0))}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          -{formatCurrency(payroll.loanDeduction + payroll.advanceDeduction + payroll.otherDeductions)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-primary">{formatCurrency(payroll.netSalary)}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(payroll.submittedAt || "").toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedPayroll(payroll)}
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-xs"
                              onClick={() => handleApprove(payroll)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(payroll)}
                              className="text-xs"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View/Approve/Reject Dialog */}
      <Dialog
        open={!!selectedPayroll}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPayroll(null);
            setActionType(null);
            setRemarks("");
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Approve Payroll"
                : actionType === "reject"
                  ? "Reject Payroll"
                  : "Payroll Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedPayroll && `${selectedPayroll.employeeName} - ${selectedPayroll.payMonth}`}
            </DialogDescription>
          </DialogHeader>

          {selectedPayroll && (
            <div className="space-y-4">
              {/* Payroll Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Employee ID</p>
                  <p className="font-semibold">{selectedPayroll.employeeId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="font-semibold">{selectedPayroll.employeeRole}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Basic Salary</p>
                  <p className="font-semibold">{formatCurrency(selectedPayroll.basicSalary)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Allowances</p>
                  <p className="font-semibold text-primary">{formatCurrency(selectedPayroll.allowances)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Deductions</p>
                  <p className="font-semibold text-destructive">
                    {formatCurrency(selectedPayroll.loanDeduction + selectedPayroll.advanceDeduction + selectedPayroll.otherDeductions)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net Salary</p>
                  <p className="font-bold text-primary text-lg">{formatCurrency(selectedPayroll.netSalary)}</p>
                </div>
              </div>

              {/* Deduction Breakdown */}
              {(selectedPayroll.loanDeduction || selectedPayroll.advanceDeduction || selectedPayroll.otherDeductions) && (
                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                  <p className="font-semibold mb-2">Deduction Breakdown:</p>
                  <div className="space-y-1">
                    {selectedPayroll.loanDeduction > 0 && (
                      <p>Loan Deduction: {formatCurrency(selectedPayroll.loanDeduction)}</p>
                    )}
                    {selectedPayroll.advanceDeduction > 0 && (
                      <p>Advance Deduction: {formatCurrency(selectedPayroll.advanceDeduction)}</p>
                    )}
                    {selectedPayroll.otherDeductions > 0 && (
                      <p>Other Deductions: {formatCurrency(selectedPayroll.otherDeductions)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Remarks/Reason Field */}
              {actionType && (
                <div className="space-y-2">
                  <Label htmlFor="actionRemarks">
                    {actionType === "approve" ? "Approval Remarks" : "Rejection Reason"}
                  </Label>
                  <Textarea
                    id="actionRemarks"
                    placeholder={
                      actionType === "approve"
                        ? "Add any remarks about the approval..."
                        : "Please explain why you are rejecting this payroll..."
                    }
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="min-h-24"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPayroll(null);
                setActionType(null);
                setRemarks("");
              }}
            >
              Cancel
            </Button>
            {actionType ? (
              <Button
                onClick={handleSubmitAction}
                disabled={submitting}
                className={actionType === "approve" ? "bg-primary hover:bg-primary/90" : "bg-destructive hover:bg-destructive/90"}
              >
                {submitting ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    {actionType === "approve" ? "Approving..." : "Rejecting..."}
                  </>
                ) : actionType === "approve" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Payroll
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Payroll
                  </>
                )}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
