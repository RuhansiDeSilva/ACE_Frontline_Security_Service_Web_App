import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader, CheckCircle2, XCircle, Eye, DollarSign } from "lucide-react";
import { admin_payrollService, type PayrollResponse } from "@/services/admin_payrollService";

export default function PayrollApprovalContent() {
  const [pendingPayrolls, setPendingPayrolls] = useState<PayrollResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollResponse | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [editingAllowances, setEditingAllowances] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPendingPayrolls();
  }, []);

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return "Unknown error";
  };

  const loadPendingPayrolls = async () => {
    setLoading(true);
    try {
      const payrolls = await admin_payrollService.getPendingApprovals();
      setPendingPayrolls(payrolls);
    } catch (error) {
      toast.error(`Failed to load pending payrolls: ${getErrorMessage(error)}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayroll = (payroll: PayrollResponse) => {
    setSelectedPayroll(payroll);
    setEditingAllowances(payroll.allowances);
    setApprovalRemarks("");
    setRejectionReason("");
    setShowApproveDialog(false);
    setShowRejectDialog(false);
  };

  const handleApprovePayroll = async () => {
    if (!selectedPayroll) {
      toast.error("No payroll selected");
      return;
    }

    const payrollId = selectedPayroll.id;
    setIsProcessing(true);
    try {
      await admin_payrollService.approvePayroll(payrollId, {
        approvalRemarks: approvalRemarks || undefined,
        allowances: editingAllowances,
      });

      toast.success("Payroll approved successfully!");
      await loadPendingPayrolls();
      setShowApproveDialog(false);
      setSelectedPayroll(null);
      setApprovalRemarks("");
      setEditingAllowances(0);
    } catch (error) {
      toast.error(`Failed to approve payroll: ${getErrorMessage(error)}`);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPayroll = async () => {
    if (!selectedPayroll || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    const payrollId = selectedPayroll.id;
    setIsProcessing(true);
    try {
      await admin_payrollService.rejectPayroll(payrollId, rejectionReason);

      toast.success("Payroll rejected successfully");
      await loadPendingPayrolls();
      setShowRejectDialog(false);
      setSelectedPayroll(null);
      setRejectionReason("");
    } catch (error) {
      toast.error(`Failed to reject payroll: ${getErrorMessage(error)}`);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateGrossSalary = (payroll: PayrollResponse) => {
    return payroll.basicSalary + editingAllowances;
  };

  const calculateNetSalary = (payroll: PayrollResponse) => {
    const gross = calculateGrossSalary(payroll);
    const totalDeductions = payroll.otherDeductions || 0;
    return gross - totalDeductions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg">
          <DollarSign className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
            Payroll Approvals
          </h2>
          <p className="text-sm text-muted-foreground">
            Review and approve pending payroll records. Edit allowances as needed.
          </p>
        </div>
      </div>

      {/* Pending Payrolls Table */}
      <Card className="bg-card border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pending for Your Approval</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {pendingPayrolls.length} payroll(s) waiting for approval
              </p>
            </div>
            <Button variant="outline" onClick={loadPendingPayrolls} disabled={loading}>
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingPayrolls.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No pending payrolls for approval</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Pay Month</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayrolls.map((payroll) => (
                    <TableRow key={payroll.id}>
                      <TableCell className="font-medium">{payroll.employeeId}</TableCell>
                      <TableCell>{payroll.employeeName}</TableCell>
                      <TableCell>{payroll.payMonth}</TableCell>
                      <TableCell className="text-right">
                        LKR {(payroll.basicSalary + payroll.allowances).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        LKR {payroll.netSalary.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">
                          Pending
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewPayroll(payroll)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payroll Detail Dialog */}
      {selectedPayroll && (
        <Dialog open={!!selectedPayroll} onOpenChange={(open) => !open && setSelectedPayroll(null)}>
          <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payroll Details & Approval</DialogTitle>
              <DialogDescription>
                Review employee payroll details. You can edit allowances before approval.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Employee Information */}
              <div className="space-y-3 pb-4 border-b">
                <h3 className="font-semibold">Employee Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Employee ID</p>
                    <p className="font-medium">{selectedPayroll.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employee Name</p>
                    <p className="font-medium">{selectedPayroll.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium">{selectedPayroll.employeeRole}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pay Month</p>
                    <p className="font-medium">{selectedPayroll.payMonth}</p>
                  </div>
                </div>
              </div>

              {/* Salary Components */}
              <div className="space-y-3 pb-4 border-b">
                <h3 className="font-semibold">Salary Components</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Basic Salary</p>
                    <p className="font-medium">LKR {selectedPayroll.basicSalary.toLocaleString()}</p>
                  </div>
                </div>

                {/* Editable Allowances */}
                <div className="space-y-2 mt-3 p-3 bg-muted/50 rounded-lg">
                  <Label htmlFor="allowances" className="text-sm font-semibold">
                    Allowances (Editable)
                  </Label>
                  <Input
                    id="allowances"
                    type="number"
                    value={editingAllowances}
                    onChange={(e) => setEditingAllowances(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="font-medium"
                  />
                  {editingAllowances !== selectedPayroll.allowances && (
                    <p className="text-xs text-amber-600">
                      Original: LKR {selectedPayroll.allowances.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-3 pb-4 border-b">
                <h3 className="font-semibold">Deductions</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Other Deductions</p>
                    <p className="font-medium">LKR {(selectedPayroll.otherDeductions || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-2 p-3 bg-primary/10 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Gross Salary</span>
                  <span className="font-bold">LKR {calculateGrossSalary(selectedPayroll).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Total Deductions</span>
                  <span className="font-bold">
                    LKR {(selectedPayroll.otherDeductions || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Net Salary</span>
                  <span className="font-bold text-green-600">
                    LKR {calculateNetSalary(selectedPayroll).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Remarks */}
              {selectedPayroll.remarks && (
                <div className="pb-4 border-b">
                  <p className="text-sm text-muted-foreground mb-1">Submitted Remarks</p>
                  <p className="text-sm bg-muted/50 p-2 rounded">{selectedPayroll.remarks}</p>
                </div>
              )}

              {/* Approval Remarks */}
              <div>
                <Label htmlFor="approval-remarks" className="text-sm font-semibold">
                  Your Approval Remarks (Optional)
                </Label>
                <Textarea
                  id="approval-remarks"
                  placeholder="Add any remarks about this payroll approval..."
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  className="mt-2 min-h-20"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  setShowRejectDialog(true);
                }}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  setShowApproveDialog(true);
                }}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? <Loader className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approve Confirmation Dialog */}
      {selectedPayroll && (
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Payroll Approval</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to approve this payroll for {selectedPayroll.employeeName}?
            </p>
            <p className="text-sm font-semibold mt-2">
              Net Salary: LKR {calculateNetSalary(selectedPayroll).toLocaleString()}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApprovePayroll}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? <Loader className="h-4 w-4 animate-spin mr-1" /> : "Confirm Approval"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Confirmation Dialog */}
      {selectedPayroll && (
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Payroll</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Provide a reason for rejecting this payroll. The account executive will be notified.
              </p>
              <Textarea
                placeholder="Rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-24"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRejectPayroll}
                disabled={isProcessing || !rejectionReason.trim()}
                variant="destructive"
              >
                {isProcessing ? <Loader className="h-4 w-4 animate-spin mr-1" /> : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
