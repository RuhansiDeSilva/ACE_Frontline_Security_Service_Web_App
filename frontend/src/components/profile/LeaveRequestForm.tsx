import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";

interface LeaveRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeaveRequestForm = ({ open, onOpenChange }: LeaveRequestFormProps) => {
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leaveType || !startDate || !endDate) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Call leave service when available
      toast({ title: "Leave Request Submitted", description: `${leaveType} leave from ${startDate} to ${endDate} sent for approval.` });
      setLeaveType(""); setStartDate(""); setEndDate(""); setReason("");
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Request Failed", description: error.message || "Failed to submit leave request.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Leave Request
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Leave Type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Annual">Annual Leave</SelectItem>
                <SelectItem value="Sick">Sick Leave</SelectItem>
                <SelectItem value="Casual">Casual Leave</SelectItem>
                <SelectItem value="Maternity">Maternity Leave</SelectItem>
                <SelectItem value="Paternity">Paternity Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea placeholder="Reason for leave request..." value={reason} onChange={(e) => setReason(e.target.value)} />
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

export default LeaveRequestForm;
