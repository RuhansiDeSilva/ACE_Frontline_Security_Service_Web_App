import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { advanceService } from "@/services/advanceService";
import { Loader } from "lucide-react";

interface AdvanceRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdvanceRequestForm = ({ open, onOpenChange }: AdvanceRequestFormProps) => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Get user to calculate max advance amount based on designation
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const maxAmount = advanceService.getMaxAdvanceAmount(user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid advance amount.", variant: "destructive" });
      return;
    }
    if (parsedAmount > maxAmount) {
      toast({ title: "Invalid Amount", description: `Advance amount cannot exceed LKR ${maxAmount.toLocaleString()} for your designation.`, variant: "destructive" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for the advance request.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await advanceService.submitAdvance(parsedAmount, reason.trim());
      toast({ title: "Advance Request Submitted", description: `LKR ${parsedAmount.toLocaleString()} advance request sent for approval.` });
      
      // Notify other components to refresh
      window.dispatchEvent(new CustomEvent("refresh-advances"));
      
      setAmount(""); setReason("");
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Request Failed", description: error.message || "Failed to submit advance request.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Advance Request
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Advance Amount (LKR)</Label>
            <Input type="number" placeholder={`Maximum ${maxAmount.toLocaleString()}`} value={amount} onChange={(e) => setAmount(e.target.value)} required max={maxAmount} min={1} step="0.01" />
            <p className="text-xs text-muted-foreground">Maximum: LKR {maxAmount.toLocaleString()} (based on your designation)</p>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea placeholder="Reason for advance request..." value={reason} onChange={(e) => setReason(e.target.value)} required />
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

export default AdvanceRequestForm;
