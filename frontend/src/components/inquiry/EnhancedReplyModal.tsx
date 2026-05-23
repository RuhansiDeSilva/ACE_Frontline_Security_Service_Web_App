import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send } from "lucide-react";

interface EnhancedReplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target:  {
    type: "service" | "general";
    id: number;
    email: string;
    name: string;
    subject: string;
  };
  onReplySuccess: () => void;
}

const EnhancedReplyModal = ({ open, onOpenChange, target, onReplySuccess }: EnhancedReplyModalProps) => {
  const [subject, setSubject] = useState(target.subject);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const authHeaders = (): HeadersInit => {
    const creds = sessionStorage.getItem("auth");
    return creds ? { Authorization: `Basic ${creds}` } : {};
  };

  const handleSendReply = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Subject and message are required",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      const endpoint = `/api/inquiries/${target.type}/${target.id}/reply`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message })
      });

      if (!response.ok) {
        throw new Error("Failed to send reply");
      }

      toast({
        title: "Success",
        description: "Reply sent successfully to " + target.email
      });

      onOpenChange(false);
      setSubject("");
      setMessage("");
      onReplySuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reply",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Reply</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Header */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">To: {target.email}</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">Recipient: {target.name}</p>
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="reply-subject" className="text-sm font-semibold">Subject</Label>
            <Input
              id="reply-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Reply subject"
              className="mt-1.5"
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="reply-message" className="text-sm font-semibold">Message</Label>
            <Textarea
              id="reply-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your reply message here..."
              className="mt-1.5"
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-1">{message.length} characters</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendReply}
            disabled={isSending}
            className="gap-1.5"
          >
            <Send className="h-4 w-4" />
            {isSending ? "Sending..." : "Send Reply Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedReplyModal;
