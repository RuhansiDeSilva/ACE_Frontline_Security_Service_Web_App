import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { loanService } from "@/services/loanService";
import { Loader } from "lucide-react";

interface LoanRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoanRequestForm = ({ open, onOpenChange }: LoanRequestFormProps) => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [repaymentMonths, setRepaymentMonths] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (parsedAmount > 30000) {
      toast({ title: "Invalid Amount", description: "Loan amount cannot exceed LKR 30,000.", variant: "destructive" });
      return;
    }
    const months = parseInt(repaymentMonths);
    if (months > 6) {
      toast({ title: "Invalid Period", description: "Repayment period cannot exceed 6 months.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await loanService.requestLoan({
        amount: parsedAmount,
        repaymentMonths: months,
        reason: reason.trim(),
      });
      toast({ title: "Loan Request Submitted", description: `LKR ${parsedAmount.toLocaleString()} over ${months} months. Sent for executive officer approval.` });
      setAmount(""); setReason(""); setRepaymentMonths("");
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Request Failed", description: error.message || "Failed to submit loan request.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Loan Request
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Loan Amount (LKR)</Label>
            <Input type="number" placeholder="Maximum 30,000" value={amount} onChange={(e) => setAmount(e.target.value)} required max={30000} />
            <p className="text-xs text-muted-foreground">Maximum: LKR 30,000</p>
          </div>
          <div className="space-y-2">
            <Label>Repayment Period (Months)</Label>
            <Input type="number" placeholder="Max 6 months" value={repaymentMonths} onChange={(e) => setRepaymentMonths(e.target.value)} required min={1} max={6} />
            <p className="text-xs text-muted-foreground">Maximum: 6 months</p>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea placeholder="Reason for loan request..." value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanRequestForm;
