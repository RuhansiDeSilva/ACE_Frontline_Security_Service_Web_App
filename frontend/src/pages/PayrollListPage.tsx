import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader, Send, CheckCircle, Eye } from "lucide-react";
import { adminPayrollService, type PayrollResponse } from "@/services/adminPayrollService";
import DashboardHeader from "@/components/DashboardHeader";
import { useNavigate } from "react-router-dom";

export default function PayrollListPage() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState<PayrollResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollResponse | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "confirm-send">("view");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Check if user is account executive
      if (!parsedUser.roles || !parsedUser.roles.includes("ROLE_ACCOUNT_EXECUTIVE")) {
        toast.error("Only account executives can access this page");
        navigate("/admin-dashboard");
      }
    } else {
      navigate("/staff-login");
    }
  }, [navigate]);

  useEffect(() => {
    fetchApprovedPayrolls();
  }, []);

  const fetchApprovedPayrolls = async () => {
    setLoading(true);
    try {
      const data = await adminPayrollService.getApprovedPayrolls();
      setPayrolls(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch approved payrolls");
    } finally {
      setLoading(false);
    }
  };

  const handleSendToBank = async () => {
    if (!selectedPayroll) return;

    setSending(true);
    try {
      await adminPayrollService.sendToBank(selectedPayroll.id);
      toast.success(`Payroll sent to bank and employee ${selectedPayroll.employeeName} has been notified`);
      // Refresh list
      await fetchApprovedPayrolls();
      setSelectedPayroll(null);
      setViewMode("view");
    } catch (error: any) {
      toast.error(error.message || "Failed to send payroll to bank");
    } finally {
      setSending(false);
    }
  };

  const filteredPayrolls = payrolls.filter((p) =>
    p.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.employeeId?.toString().includes(searchQuery)
  );

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalPayroll = filteredPayrolls.reduce((sum, p) => sum + p.netSalary, 0);

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
              <Send className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Bank Submission</h1>
              <p className="text-muted-foreground">Send approved payrolls to bank for processing</p>
            </div>
          </div>
          <div className="text-right">
            <Badge className="text-lg px-3 py-1 bg-primary/20 text-primary border-primary/50">
              {filteredPayrolls.length} Ready
            </Badge>
            {filteredPayrolls.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Total: {formatCurrency(totalPayroll)}
              </p>
            )}
          </div>
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
              <Button onClick={fetchApprovedPayrolls} disabled={loading} className="bg-primary hover:bg-primary/90">
                {loading ? <Loader className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payrolls List */}
        <Card className="border-border/50 dark:bg-card/50">
          <CardHeader>
            <CardTitle>Approved Payrolls Ready for Bank Submission</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !payrolls.length ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-primary mr-2" />
                <span>Loading payrolls...</span>
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-50" />
                <p className="text-muted-foreground">No approved payrolls ready for bank submission</p>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Approved By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayrolls.map((payroll) => {
                      const isSent = payroll.status === "SENT_TO_BANK";
                      return (
                        <TableRow key={payroll.id} className={`border-b border-border/30 ${isSent ? "opacity-60" : ""}`}>
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
                          <TableCell>
                            <Badge 
                              className={isSent ? "bg-green-100 text-green-800 border-green-300" : "bg-blue-100 text-blue-800 border-blue-300"}
                            >
                              {isSent ? "Sent to Bank" : "Approved"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {payroll.approvedByName || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPayroll(payroll);
                                  setViewMode("view");
                                }}
                                className="text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              {!isSent && (
                                <Button
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90 text-xs"
                                  onClick={() => {
                                    setSelectedPayroll(payroll);
                                    setViewMode("confirm-send");
                                  }}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Send to Bank
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        {filteredPayrolls.length > 0 && (
          <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader>
              <CardTitle>Batch Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Payrolls</p>
                <p className="font-bold text-lg text-foreground">{filteredPayrolls.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Gross</p>
                <p className="font-bold text-lg text-foreground">
                  {formatCurrency(
                    filteredPayrolls.reduce((sum, p) => sum + (p.basicSalary + p.allowances + (p.otAmount || 0)), 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Deductions</p>
                <p className="font-bold text-lg text-destructive">
                  -{formatCurrency(
                    filteredPayrolls.reduce(
                      (sum, p) => sum + (p.loanDeduction + p.advanceDeduction + p.otherDeductions),
                      0
                    )
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Net Salary</p>
                <p className="font-bold text-lg text-primary">{formatCurrency(totalPayroll)}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View/Send Dialog */}
      <Dialog open={!!selectedPayroll} onOpenChange={(open) => !open && setSelectedPayroll(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewMode === "confirm-send" ? "Confirm Bank Submission" : "Payroll Details"}
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
              </div>

              {/* Deductions */}
              <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-2">
                <p className="font-semibold">Deductions Breakdown:</p>
                <div className="grid grid-cols-2 gap-2">
                  <p>Loan Deduction:</p>
                  <p className="text-right text-destructive">{formatCurrency(selectedPayroll.loanDeduction)}</p>
                  <p>Advance Deduction:</p>
                  <p className="text-right text-destructive">{formatCurrency(selectedPayroll.advanceDeduction)}</p>
                  <p>Other Deductions:</p>
                  <p className="text-right text-destructive">{formatCurrency(selectedPayroll.otherDeductions)}</p>
                  <p className="font-semibold border-t pt-2">Total Deductions:</p>
                  <p className="text-right text-destructive font-semibold border-t pt-2">
                    {formatCurrency(
                      selectedPayroll.loanDeduction + selectedPayroll.advanceDeduction + selectedPayroll.otherDeductions
                    )}
                  </p>
                </div>
              </div>

              {/* Net Salary Summary */}
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Net Salary to be Transferred:</span>
                  <span className="font-bold text-primary text-2xl">{formatCurrency(selectedPayroll.netSalary)}</span>
                </div>
              </div>

              {/* Approval Info */}
              {viewMode === "view" && selectedPayroll.approvedByName && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/50 text-sm">
                  <p className="text-green-800 dark:text-green-300">
                    ✓ Approved by: {selectedPayroll.approvedByName} on {new Date(selectedPayroll.approvedAt || "").toLocaleDateString()}
                  </p>
                  {selectedPayroll.approvalRemarks && (
                    <p className="text-green-700 dark:text-green-400 mt-1">Remarks: {selectedPayroll.approvalRemarks}</p>
                  )}
                </div>
              )}

              {/* Confirmation Message for Send */}
              {viewMode === "confirm-send" && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900/50">
                  <p className="text-foreground font-semibold mb-2">Ready to submit to bank?</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Amount: {formatCurrency(selectedPayroll.netSalary)}</li>
                    <li>✓ Employee will be notified via email and in-app notification</li>
                    <li>✓ Status will be marked as "Sent to Bank"</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPayroll(null);
                setViewMode("view");
              }}
            >
              Cancel
            </Button>
            {viewMode === "confirm-send" && (
              <Button
                onClick={handleSendToBank}
                disabled={sending}
                className="bg-primary hover:bg-primary/90"
              >
                {sending ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Confirm & Send to Bank
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
