import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader, FileText, Download, Calendar, DollarSign } from "lucide-react";
import { paysheetService, type Paysheet } from "@/services/paysheetService";
import { exportPaysheetToPDF, exportPaysheetToExcel } from "@/lib/paysheetExport";

export default function PaysheetHistoryTab() {
  const [paysheets, setPaysheets] = useState<Paysheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<number | null>(null);

  useEffect(() => {
    fetchPaysheets();
  }, []);

  const fetchPaysheets = async () => {
    setLoading(true);
    try {
      const data = await paysheetService.getMyPaysheets();
      // Sort by newest first
      const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPaysheets(sorted);
    } catch (error) {
      console.error("Failed to fetch paysheets:", error);
      toast.error("Failed to load paysheet history");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (paysheet: Paysheet) => {
    setExporting(paysheet.id);
    try {
      await exportPaysheetToPDF(paysheet);
      toast.success(`Paysheet for ${paysheet.month} exported to PDF`);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast.error("Failed to export paysheet to PDF");
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (paysheets.length === 0) {
      toast.error("No paysheets to export");
      return;
    }
    try {
      setExporting(-1);
      exportPaysheetToExcel(paysheets);
      toast.success("Paysheet history exported to Excel");
    } catch (error) {
      console.error("Failed to export Excel:", error);
      toast.error("Failed to export paysheet history");
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

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return "LKR 0.00";
    return `LKR ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading paysheet history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-[21px] font-bold text-foreground">Paysheet History</h3>
          <p className="text-[15px] text-muted-foreground">View and download your paysheets</p>
        </div>
      </div>

      {paysheets.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-primary/30 mb-4" />
            <p className="text-muted-foreground">No paysheets available yet</p>
            <p className="text-[13px] text-muted-foreground mt-2">Your paysheets will appear here once they are generated and processed.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-gradient-to-br from-purple-500/15 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-4">
                <p className="text-[13px] text-muted-foreground uppercase font-semibold">Total Paysheets</p>
                <p className="text-[25px] font-bold text-purple-600 mt-1">{paysheets.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/15 to-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <p className="text-[13px] text-muted-foreground uppercase font-semibold">Total Earnings</p>
                <p className="text-[25px] font-bold text-green-600 mt-1">
                  {formatCurrency(paysheets.reduce((sum, p) => sum + ((p.basicSalary || 0) + (p.allowances || 0)), 0))}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/15 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <p className="text-[13px] text-muted-foreground uppercase font-semibold">Avg. Net Salary</p>
                <p className="text-[25px] font-bold text-blue-600 mt-1">
                  {formatCurrency(paysheets.reduce((sum, p) => sum + (p.netSalary || 0), 0) / paysheets.length)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Export Button */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleExportExcel}
              disabled={exporting !== null}
              variant="outline"
              className="border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
            >
              {exporting === -1 ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export All to Excel
                </>
              )}
            </Button>
          </div>

          {/* Paysheet Table */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Paysheet Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 bg-muted/30">
                      <TableHead className="font-semibold text-foreground">Month</TableHead>
                      <TableHead className="font-semibold text-foreground">Basic Salary</TableHead>
                      <TableHead className="font-semibold text-foreground">Allowances</TableHead>
                      <TableHead className="font-semibold text-foreground">Deductions</TableHead>
                      <TableHead className="font-semibold text-foreground text-right">Net Salary</TableHead>
                      <TableHead className="font-semibold text-foreground">Generated</TableHead>
                      <TableHead className="font-semibold text-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paysheets.map((paysheet) => (
                      <TableRow key={paysheet.id} className="border-border/50 hover:bg-muted/40 transition-colors">
                        <TableCell className="font-semibold text-foreground">{formatMonth(paysheet.month)}</TableCell>
                        <TableCell className="text-[15px]">{formatCurrency(paysheet.basicSalary)}</TableCell>
                        <TableCell className="text-[15px]">{formatCurrency(paysheet.allowances)}</TableCell>
                        <TableCell className="text-[15px] text-red-600">{formatCurrency(paysheet.otherDeductions)}</TableCell>
                        <TableCell className="font-bold text-green-600 text-right">{formatCurrency(paysheet.netSalary)}</TableCell>
                        <TableCell className="text-[13px] text-muted-foreground">
                          {new Date(paysheet.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExportPDF(paysheet)}
                              disabled={exporting === paysheet.id}
                              className="text-[13px] h-8 border-green-500/30 text-green-600 hover:bg-green-500/10"
                            >
                              {exporting === paysheet.id ? (
                                <Loader className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Download className="h-3 w-3 mr-1" />
                                  PDF
                                </>
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
    </div>
  );
}
