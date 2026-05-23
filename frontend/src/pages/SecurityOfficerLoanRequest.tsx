import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { loanService, type LoanRequest } from "@/services/loanService";
import { Loader, CheckCircle2, XCircle, Clock, DollarSign } from "lucide-react";

export default function SecurityOfficerLoanRequest() {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [repaymentMonths, setRepaymentMonths] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myLoans, setMyLoans] = useState<LoanRequest[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

  // Get user data from localStorage
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : { fullName: "Security Officer", username: "officer", userId: 0 };

  // Fetch user's loans on mount
  useEffect(() => {
    fetchMyLoans();
  }, []);

  const fetchMyLoans = async () => {
    setLoadingLoans(true);
    try {
      const loans = await loanService.getMyLoans();
      setMyLoans(loans);
    } catch (error) {
      console.error("Failed to fetch loans:", error);
    } finally {
      setLoadingLoans(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid loan amount.", variant: "destructive" });
      return;
    }
    if (parsedAmount > 30000) {
      toast({ title: "Invalid Amount", description: "Loan amount cannot exceed LKR 30,000.", variant: "destructive" });
      return;
    }
    
    const months = parseInt(repaymentMonths);
    if (isNaN(months) || months <= 0) {
      toast({ title: "Invalid Period", description: "Please enter a valid repayment period.", variant: "destructive" });
      return;
    }
    if (months > 6) {
      toast({ title: "Invalid Period", description: "Repayment period cannot exceed 6 months.", variant: "destructive" });
      return;
    }

    if (!reason.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for the loan request.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await loanService.requestLoan({
        amount: parsedAmount,
        repaymentMonths: months,
        reason: reason.trim(),
      });
      
      toast({ 
        title: "Loan Request Submitted", 
        description: `LKR ${parsedAmount.toLocaleString()} over ${months} months. Sent to Executive Officer for approval.` 
      });
      
      // Clear form
      setAmount("");
      setReason("");
      setRepaymentMonths("");
      
      // Refresh loan list
      fetchMyLoans();
    } catch (error: any) {
      toast({ 
        title: "Request Failed", 
        description: error.message || "Failed to submit loan request. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <DollarSign className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Request a Loan</h1>
          <p className="text-sm text-muted-foreground">Submit a loan request for Executive Officer approval</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Loan Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              New Loan Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Loan Amount (LKR)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount (max 30,000)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  max={30000}
                  min={1}
                />
                <p className="text-xs text-muted-foreground">Maximum: LKR 30,000</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repaymentMonths">Repayment Period (Months)</Label>
                <Input
                  id="repaymentMonths"
                  type="number"
                  placeholder="Enter months (max 6)"
                  value={repaymentMonths}
                  onChange={(e) => setRepaymentMonths(e.target.value)}
                  required
                  min={1}
                  max={6}
                />
                <p className="text-xs text-muted-foreground">Maximum: 6 months</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Loan</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you need this loan..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Requesting as: <span className="font-medium text-foreground">{user.fullName}</span>
                </p>
                <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {submitting ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Loan History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              My Loan Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLoans ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : myLoans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No loan requests yet</p>
                <p className="text-sm">Submit your first loan request using the form</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Months</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">
                          LKR {loan.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>{loan.repaymentMonths}</TableCell>
                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(loan.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {myLoans.some(loan => loan.status === "REJECTED" && loan.rejectionReason) && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-foreground">Rejection Reasons:</h4>
                {myLoans
                  .filter(loan => loan.status === "REJECTED" && loan.rejectionReason)
                  .map((loan) => (
                    <div key={loan.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-800">
                        <span className="font-medium">LKR {loan.amount.toLocaleString()}:</span> {loan.rejectionReason}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
