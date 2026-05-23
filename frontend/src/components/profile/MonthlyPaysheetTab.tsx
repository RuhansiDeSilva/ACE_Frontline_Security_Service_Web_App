import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader, FileText, Download, Eye, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { payrollSlipService, type PayrollSlipResponse } from "@/services/payrollSlipService";

export default function MonthlyPaysheetTab() {
  const [slips, setSlips] = useState<PayrollSlipResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<number | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlipResponse | null>(null);
  const [showSlipDialog, setShowSlipDialog] = useState(false);
  const [viewingSlip, setViewingSlip] = useState<number | null>(null);

  useEffect(() => {
    fetchPayrollSlips();
  }, []);

  const fetchPayrollSlips = async () => {
    setLoading(true);
    try {
      const data = await payrollSlipService.getMySlips();
      // Sort by newest month first
      const sorted = data.sort((a, b) => {
        return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
      });
      setSlips(sorted);
    } catch (error) {
      console.error("Failed to fetch payroll slips:", error);
      toast.error("Failed to load monthly paysheets");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSlip = async (slip: PayrollSlipResponse) => {
    setViewingSlip(slip.id);
    try {
      const updatedSlip = await payrollSlipService.viewSlip(slip.id);
      setSelectedSlip(updatedSlip);
      setShowSlipDialog(true);
      
      // Update the slip in the list
      setSlips(slips.map(s => s.id === slip.id ? updatedSlip : s));
      
      toast.success("Payroll slip viewed");
    } catch (error) {
      console.error("Failed to view slip:", error);
      toast.error("Failed to view payroll slip");
    } finally {
      setViewingSlip(null);
    }
  };

  const handleDownloadSlip = async (slip: PayrollSlipResponse) => {
    setExporting(slip.id);
    try {
      // First mark as downloaded
      const updatedSlip = await payrollSlipService.downloadSlip(slip.id);
      
      // Then export to Excel
      const blob = await payrollSlipService.exportSlipToExcel(slip.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Payroll_Slip_${slip.slipNumber}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Update the slip in the list
      setSlips(slips.map(s => s.id === slip.id ? updatedSlip : s));
      
      toast.success("Payroll slip downloaded");
    } catch (error) {
      console.error("Failed to download slip:", error);
      toast.error("Failed to download payroll slip");
    } finally {
      setExporting(null);
    }
  };

  const formatMonth = (month: string): string => {
    try {
      const [year, monthNum] = month.split("-");
      const date = new Date(Number(year), Number(monthNum) - 1);
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return month;
    }
  };

  const formatCurrency = (value: number): string => {
    return `LKR ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (slip: PayrollSlipResponse) => {
    if (slip.isDownloaded) {
      return <Badge className="bg-green-500/20 text-green-700">Downloaded</Badge>;
    }
    if (slip.isViewed) {
      return <Badge className="bg-blue-500/20 text-blue-700">Viewed</Badge>;
    }
    return <Badge className="bg-yellow-500/20 text-yellow-700">New</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading monthly paysheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-[21px] font-bold text-foreground">Monthly Paysheets</h3>
          <p className="text-[15px] text-muted-foreground">View and download your payroll slips</p>
        </div>
      </div>

      {slips.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-primary/30 mb-4" />
            <p className="text-muted-foreground">No payroll slips available yet</p>
            <p className="text-[13px] text-muted-foreground mt-2">
              Your payroll slips will appear here once they are approved and generated.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-purple-500/15 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-4">
                <p className="text-[13px] text-muted-foreground uppercase font-semibold">Total Slips</p>
                <p className="text-[25px] font-bold text-purple-600 mt-1">{slips.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/15 to-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <p className="text-[13px] text-muted-foreground uppercase font-semibold">Downloaded</p>
                <p className="text-[25px] font-bold text-green-600 mt-1">
                  {slips.filter(s => s.isDownloaded).length}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/15 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <p className="text-[13px] text-muted-foreground uppercase font-semibold">Total Earnings</p>
                <p className="text-[20px] font-bold text-blue-600 mt-1">
                  {formatCurrency(slips.reduce((sum, s) => sum + s.netSalary, 0))}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/15 to-orange-500/5 border-orange-500/20">
              <CardContent className="p-4">
                <p className="text-[13px] text-muted-foreground uppercase font-semibold">Avg. Net Salary</p>
                <p className="text-[20px] font-bold text-orange-600 mt-1">
                  {formatCurrency(slips.length > 0 ? slips.reduce((sum, s) => sum + s.netSalary, 0) / slips.length : 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payroll Slips Table */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                Payroll Slips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 bg-muted/30">
                      <TableHead className="font-semibold text-foreground">Slip #</TableHead>
                      <TableHead className="font-semibold text-foreground">Month</TableHead>
                      <TableHead className="font-semibold text-foreground text-right">Gross Salary</TableHead>
                      <TableHead className="font-semibold text-foreground text-right">Deductions</TableHead>
                      <TableHead className="font-semibold text-foreground text-right">Net Salary</TableHead>
                      <TableHead className="font-semibold text-foreground">Status</TableHead>
                      <TableHead className="font-semibold text-foreground">Generated</TableHead>
                      <TableHead className="font-semibold text-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slips.map((slip) => (
                      <TableRow key={slip.id} className="border-border/50 hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-[13px] text-muted-foreground">{slip.slipNumber}</TableCell>
                        <TableCell className="font-semibold text-foreground">{formatMonth(slip.payMonth)}</TableCell>
                        <TableCell className="text-[15px] text-right">{formatCurrency(slip.grossSalary)}</TableCell>
                        <TableCell className="text-[15px] text-right text-red-600">{formatCurrency(slip.totalDeductions)}</TableCell>
                        <TableCell className="font-bold text-green-600 text-right">{formatCurrency(slip.netSalary)}</TableCell>
                        <TableCell>{getStatusBadge(slip)}</TableCell>
                        <TableCell className="text-[13px] text-muted-foreground">
                          {new Date(slip.generatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              title="View payroll slip details"
                              onClick={() => handleViewSlip(slip)}
                              disabled={viewingSlip === slip.id}
                              className="border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                            >
                              {viewingSlip === slip.id ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              title="Download payroll slip as Excel"
                              onClick={() => handleDownloadSlip(slip)}
                              disabled={exporting === slip.id}
                              className="border-green-500/30 text-green-600 hover:bg-green-500/10"
                            >
                              {exporting === slip.id ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Payroll Slip Details Dialog */}
      <Dialog open={showSlipDialog} onOpenChange={setShowSlipDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payroll Slip Details</DialogTitle>
            <DialogDescription>
              {selectedSlip && `Slip #${selectedSlip.slipNumber} for ${formatMonth(selectedSlip.payMonth)}`}
            </DialogDescription>
          </DialogHeader>

          {selectedSlip && (
            <div className="space-y-6">
              {/* Employee Information */}
              <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-foreground">Employee Information</h4>
                <div className="grid grid-cols-2 gap-4 text-[14px]">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-semibold text-foreground">{selectedSlip.userName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Role</p>
                    <p className="font-semibold text-foreground">{selectedSlip.userRole}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-semibold text-foreground">{selectedSlip.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-semibold text-foreground">{selectedSlip.userPhone}</p>
                  </div>
                </div>
              </div>

              {/* Salary Details */}
              <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-foreground">Salary Components</h4>
                <div className="space-y-2 text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Basic Salary</span>
                    <span className="font-semibold">{formatCurrency(selectedSlip.basicSalary)}</span>
                  </div>
                  {selectedSlip.otAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">OT Amount</span>
                      <span className="font-semibold">{formatCurrency(selectedSlip.otAmount)}</span>
                    </div>
                  )}
                  {selectedSlip.allowances > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Allowances</span>
                      <span className="font-semibold">{formatCurrency(selectedSlip.allowances)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t border-border pt-2 text-green-600">
                    <span>Gross Salary</span>
                    <span>{formatCurrency(selectedSlip.grossSalary)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-foreground">Deductions</h4>
                <div className="space-y-2 text-[14px]">
                  {selectedSlip.loanDeduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loan Deduction</span>
                      <span className="font-semibold text-red-600">{formatCurrency(selectedSlip.loanDeduction)}</span>
                    </div>
                  )}
                  {selectedSlip.advanceDeduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Advance Deduction</span>
                      <span className="font-semibold text-red-600">{formatCurrency(selectedSlip.advanceDeduction)}</span>
                    </div>
                  )}
                  {selectedSlip.otherDeductions > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Other Deductions</span>
                      <span className="font-semibold text-red-600">{formatCurrency(selectedSlip.otherDeductions)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t border-border pt-2 text-red-600">
                    <span>Total Deductions</span>
                    <span>{formatCurrency(selectedSlip.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">NET SALARY</span>
                  <span className="text-[20px] font-bold text-green-600">{formatCurrency(selectedSlip.netSalary)}</span>
                </div>
              </div>

              {/* Approval Info */}
              {selectedSlip.approvedAt && (
                <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-foreground">Approval Information</h4>
                  <div className="space-y-2 text-[14px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approved By</span>
                      <span className="font-semibold">{selectedSlip.approvedByName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approved Date</span>
                      <span className="font-semibold">{formatDate(selectedSlip.approvedAt)}</span>
                    </div>
                    {selectedSlip.approvalRemarks && (
                      <div>
                        <span className="text-muted-foreground">Remarks</span>
                        <p className="font-semibold text-[13px]">{selectedSlip.approvalRemarks}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Download Info */}
              <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-foreground">Download History</h4>
                <div className="space-y-2 text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Downloaded</span>
                    <span className="font-semibold">{selectedSlip.isDownloaded ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Download Count</span>
                    <span className="font-semibold">{selectedSlip.downloadCount}</span>
                  </div>
                  {selectedSlip.downloadedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Downloaded</span>
                      <span className="font-semibold">{formatDate(selectedSlip.downloadedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowSlipDialog(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleDownloadSlip(selectedSlip)}
                  disabled={exporting === selectedSlip.id}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {exporting === selectedSlip.id ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Slip
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
