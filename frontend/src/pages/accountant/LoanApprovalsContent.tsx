import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, AlertCircle, Calendar, DollarSign, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loanService, type LoanRequest } from "@/services/loanService";
import { loanDeductionService, type LoanDeduction } from "@/services/loanDeductionService";

interface Officer {
  id: number;
  fullName: string;
  username: string;
  designation?: string;
}

interface GroupedDeduction {
  officer: Officer;
  loans: (LoanDeduction & { loanRequest: LoanRequest })[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export default function LoanApprovalsContent() {
  const { toast } = useToast();
  const [approvedLoans, setApprovedLoans] = useState<LoanRequest[]>([]);
  const [deductions, setDeductions] = useState<LoanDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"loans" | "deductions">("loans");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [loans, deductionsData] = await Promise.all([
        loanService.getApprovedLoans(),
        loanDeductionService.getAllDeductions(),
      ]);
      setApprovedLoans(loans);
      setDeductions(deductionsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to load loan approvals and deductions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (deductionId: number) => {
    try {
      await loanDeductionService.markAsPaid(deductionId);
      toast({
        title: "Success",
        description: "Deduction marked as paid",
      });
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to mark deduction as paid:", error);
      toast({
        title: "Error",
        description: "Failed to mark deduction as paid",
        variant: "destructive",
      });
    }
  };

  // Group deductions by officer
  const groupedDeductions = deductions.reduce((acc, deduction) => {
    const officer = deduction.user;
    const key = officer.id;
    if (!acc[key]) {
      acc[key] = {
        officer,
        loans: [],
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
      };
    }
    acc[key].loans.push(deduction as any);
    acc[key].totalAmount += deduction.amount;
    if (deduction.status === "PAID") {
      acc[key].paidAmount += deduction.amount;
    } else {
      acc[key].pendingAmount += deduction.amount;
    }
    return acc;
  }, {} as Record<number, GroupedDeduction>);

  const summaryStats = {
    totalApprovedLoans: approvedLoans.length,
    totalApprovedAmount: approvedLoans.reduce((sum, loan) => sum + loan.amount, 0),
    totalDeductionAmount: deductions.reduce((sum, d) => sum + d.amount, 0),
    totalPaidAmount: deductions.filter(d => d.status === "PAID").reduce((sum, d) => sum + d.amount, 0),
    totalPendingAmount: deductions.filter(d => d.status === "PENDING").reduce((sum, d) => sum + d.amount, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading loan approvals and deductions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Approved Loans</p>
                <p className="text-xl font-bold text-blue-400">{summaryStats.totalApprovedLoans}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <DollarSign className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Approved Amount</p>
                <p className="text-xl font-bold text-amber-400">
                  Rs. {(summaryStats.totalApprovedAmount / 100000).toFixed(1)}L
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-xl font-bold text-green-400">
                  Rs. {(summaryStats.totalPaidAmount / 100000).toFixed(1)}L
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Clock className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-orange-400">
                  Rs. {(summaryStats.totalPendingAmount / 100000).toFixed(1)}L
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Officers</p>
                <p className="text-xl font-bold text-purple-400">{Object.keys(groupedDeductions).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "loans" | "deductions")} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="loans" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Approved Loans
          </TabsTrigger>
          <TabsTrigger value="deductions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Deduction Schedule
          </TabsTrigger>
        </TabsList>

        {/* Approved Loans Tab */}
        <TabsContent value="loans" className="space-y-4">
          <Card className="border-border/60 bg-card">
            <CardHeader className="bg-muted/50 border-b border-border/60">
              <CardTitle>Approved Loans ({approvedLoans.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {approvedLoans.length === 0 ? (
                <div className="p-6 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No approved loans yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/60 bg-muted/30">
                        <TableHead className="text-foreground font-semibold">Loan ID</TableHead>
                        <TableHead className="text-foreground font-semibold">Officer Name</TableHead>
                        <TableHead className="text-foreground font-semibold">Username</TableHead>
                        <TableHead className="text-right text-foreground font-semibold">Amount</TableHead>
                        <TableHead className="text-center text-foreground font-semibold">Duration</TableHead>
                        <TableHead className="text-right text-foreground font-semibold">Monthly Amount</TableHead>
                        <TableHead className="text-foreground font-semibold">Reason</TableHead>
                        <TableHead className="text-center text-foreground font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedLoans.map((loan) => (
                        <TableRow key={loan.id} className="border-border/60 hover:bg-muted/50">
                          <TableCell className="font-mono font-semibold text-primary">#{loan.id}</TableCell>
                          <TableCell className="font-medium text-foreground">{loan.user.fullName}</TableCell>
                          <TableCell className="text-muted-foreground">@{loan.user.username}</TableCell>
                          <TableCell className="text-right font-bold text-lg text-foreground">
                            Rs. {loan.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-foreground">
                            {loan.repaymentMonths} mo.
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            Rs. {Math.round(loan.amount / loan.repaymentMonths).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {loan.reason}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              APPROVED
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deduction Schedule Tab */}
        <TabsContent value="deductions" className="space-y-4">
          {Object.keys(groupedDeductions).length === 0 ? (
            <Card className="bg-card border-border/60">
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No deduction schedules yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedDeductions).map(([, groupedData]) => (
              <Card key={groupedData.officer.id} className="border-border/60 bg-card">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground text-lg">
                        {groupedData.officer.fullName}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>ID: #{groupedData.officer.id}</span>
                        <span>@{groupedData.officer.username}</span>
                        {groupedData.officer.designation && <span>{groupedData.officer.designation}</span>}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-bold text-primary">Rs. {groupedData.totalAmount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="text-lg font-bold text-green-400">Rs. {groupedData.paidAmount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Pending</p>
                        <p className="text-lg font-bold text-orange-400">Rs. {groupedData.pendingAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/60 bg-muted/30">
                          <TableHead className="text-foreground font-semibold">Loan ID</TableHead>
                          <TableHead className="text-foreground font-semibold">Month</TableHead>
                          <TableHead className="text-right text-foreground font-semibold">Amount</TableHead>
                          <TableHead className="text-center text-foreground font-semibold">Status</TableHead>
                          <TableHead className="text-foreground font-semibold">Processed Date</TableHead>
                          <TableHead className="text-center text-foreground font-semibold">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedData.loans
                          .sort((a, b) => {
                            if (a.status !== b.status) return a.status === "PENDING" ? -1 : 1;
                            return a.deductionMonth.localeCompare(b.deductionMonth);
                          })
                          .map((deduction) => (
                            <TableRow key={deduction.id} className="border-border/60 hover:bg-muted/50">
                              <TableCell className="font-mono font-semibold text-primary">
                                #{deduction.loanRequest?.id || "N/A"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  {deduction.deductionMonth}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold text-lg text-foreground">
                                Rs. {deduction.amount.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-center">
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
                                  ? new Date(deduction.processedAt).toLocaleDateString()
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-center">
                                {deduction.status === "PENDING" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkAsPaid(deduction.id)}
                                    className="text-xs"
                                  >
                                    Mark as Paid
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
