import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader, DollarSign, FileText, CheckCircle2, Eye } from "lucide-react";
import { admin_payrollService, type PayrollResponse } from "@/services/admin_payrollService";
import * as XLSX from "xlsx";

export default function AdminPayrollListPageContent() {
  const [payrolls, setPayrolls] = useState<PayrollResponse[]>([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState<PayrollResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollResponse | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const approved = await admin_payrollService.getApprovedPayrolls();
      setPayrolls(approved);
      setFilteredPayrolls(approved);
    } catch (error) {
      console.error("Failed to fetch payrolls:", error);
      toast.error("Failed to load payrolls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPayrolls(payrolls);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredPayrolls(
        payrolls.filter((p) =>
          p.employeeName.toLowerCase().includes(query) ||
          String(p.employeeId).toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, payrolls]);

  const handleSendToBank = async (payroll: PayrollResponse) => {
    setSelectedPayroll(payroll);
    setShowDialog(true);
  };

  const confirmSendToBank = async () => {
    if (!selectedPayroll) return;

    setProcessing(true);
    try {
      await admin_payrollService.sendToBank(selectedPayroll.id);
      setPayrolls(payrolls.filter((p) => p.id !== selectedPayroll.id));
      setFilteredPayrolls(filteredPayrolls.filter((p) => p.id !== selectedPayroll.id));
      setShowDialog(false);
      setSelectedPayroll(null);
      toast.success(`Payroll for ${selectedPayroll.employeeName} sent to bank successfully!`);
    } catch (error) {
      console.error("Failed to send to bank:", error);
      toast.error("Failed to send payroll to bank");
    } finally {
      setProcessing(false);
    }
  };

  const handleProceedAllToBank = async () => {
    if (payrolls.length === 0) {
      toast.error("No payrolls to process");
      return;
    }

    setProcessing(true);
    try {
      const workbook = XLSX.utils.book_new();
      const data = payrolls.map((p) => {
        const grossSalary = p.basicSalary + p.allowances;
        return {
          "Employee Name": p.employeeName,
          "Employee ID": p.employeeId,
          "Role": p.employeeRole,
          "Pay Month": p.payMonth,
          "Basic Salary": p.basicSalary,
          "Gross Salary": grossSalary,
          "Other Deductions": p.otherDeductions || 0,
          "Net Salary": p.netSalary,
          "Approved By": p.approvedByName,
          "Approved Date": p.approvedAt,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payrolls");
      XLSX.writeFile(workbook, `Payroll_Bank_Submission_${new Date().toISOString().slice(0, 10)}.xlsx`);

      // Process all payrolls
      for (const payroll of payrolls) {
        try {
          await admin_payrollService.sendToBank(payroll.id);
        } catch (error) {
          console.error(`Failed to send payroll ${payroll.id}:`, error);
        }
      }

      setPayrolls([]);
      setFilteredPayrolls([]);
      toast.success("All payrolls sent to bank and exported to Excel!");
    } catch (error) {
      console.error("Failed to proceed all:", error);
      toast.error("Failed to process payrolls");
    } finally {
      setProcessing(false);
    }
  };

  const totalGross = filteredPayrolls.reduce((sum, p) => sum + (p.basicSalary + p.allowances), 0);
  const totalDeductions = filteredPayrolls.reduce((sum, p) => sum + (p.otherDeductions || 0), 0);
  const totalNet = filteredPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
          <FileText className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-300 to-green-500 bg-clip-text text-transparent">
            Bank Submission
          </h2>
          <p className="text-sm text-muted-foreground">Send approved payrolls to bank for processing</p>
        </div>
      </div>

      {loading ? (
        <Card className="bg-card border-border/60">
          <CardContent className="p-12 text-center">
            <Loader className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading payroll records...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search and Actions */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label className="text-sm mb-2 block">Search by Employee Name or ID</Label>
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              onClick={handleProceedAllToBank}
              disabled={filteredPayrolls.length === 0 || processing}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              {processing ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
              {processing ? "Processing..." : "Proceed All to Bank"}
            </Button>
          </div>

          {/* Summary Cards */}
          {filteredPayrolls.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Total Payrolls</p>
                  <p className="text-2xl font-bold text-primary mt-2">{filteredPayrolls.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Total Gross</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">LKR {totalGross.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-500/20 to-red-500/10 border-red-500/30">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Total Deductions</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">LKR {totalDeductions.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/20 to-green-500/10 border-green-500/30">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Total Net</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">LKR {totalNet.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payroll Table */}
          <Card className="bg-card border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Approved Payrolls - Ready for Bank Submission
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPayrolls.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-primary/50 mb-4" />
                  <p className="text-muted-foreground">No payroll records available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/60">
                        <TableHead className="text-foreground font-semibold">Employee</TableHead>
                        <TableHead className="text-foreground font-semibold">Month</TableHead>
                        <TableHead className="text-foreground font-semibold">Role</TableHead>
                        <TableHead className="text-foreground font-semibold">Gross Salary</TableHead>
                        <TableHead className="text-foreground font-semibold">Deductions</TableHead>
                        <TableHead className="text-foreground font-semibold">Net Salary</TableHead>
                        <TableHead className="text-foreground font-semibold">Approved By</TableHead>
                        <TableHead className="text-foreground font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayrolls.map((payroll) => (
                        <TableRow key={payroll.id} className="border-border/60 hover:bg-muted/50">
                          <TableCell className="font-medium">{payroll.employeeName}</TableCell>
                          <TableCell className="text-sm">{payroll.payMonth}</TableCell>
                          <TableCell className="text-sm">{payroll.employeeRole}</TableCell>
                          <TableCell className="font-semibold">LKR {(payroll.basicSalary + payroll.allowances).toLocaleString()}</TableCell>
                          <TableCell className="font-semibold">LKR {(payroll.otherDeductions || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-bold text-green-600">LKR {(payroll.netSalary || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{payroll.approvedByName || "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPayroll(payroll);
                                  setShowDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleSendToBank(payroll)}
                                disabled={processing}
                              >
                                {processing ? <Loader className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                                Send
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
        </>
      )}

      {/* View/Confirm Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payroll Details - {selectedPayroll?.employeeName}</DialogTitle>
          </DialogHeader>

          {selectedPayroll && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Employee Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedPayroll.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Employee ID</p>
                    <p className="font-medium">{selectedPayroll.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Role</p>
                    <p className="font-medium">{selectedPayroll.employeeRole}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pay Month</p>
                    <p className="font-medium">{selectedPayroll.payMonth}</p>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Salary Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Basic Salary</span>
                    <span className="font-medium">LKR {(selectedPayroll.basicSalary || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross Salary</span>
                    <span className="font-medium">LKR {(selectedPayroll.basicSalary + selectedPayroll.allowances).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Other Deductions</span>
                    <span className="font-medium">LKR {(selectedPayroll.otherDeductions || 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Net Salary</span>
                    <span className="text-green-600">LKR {(selectedPayroll.netSalary || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>



              {/* Remarks */}
              {selectedPayroll.remarks && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Remarks</h4>
                  <p className="text-sm text-muted-foreground">{selectedPayroll.remarks}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={confirmSendToBank}
              disabled={processing}
            >
              {processing ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {processing ? "Sending..." : "Confirm & Send to Bank"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
