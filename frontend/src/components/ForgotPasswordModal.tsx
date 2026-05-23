import { useState } from "react";
import { X, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success for security
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setSubmitted(false);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-lg shadow-lg max-w-md w-full border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h2 className="text-[21px] font-bold text-foreground">Reset Password</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-border/50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!submitted ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <p className="text-[15px] text-muted-foreground">
                Enter your registered email address. We'll send you a secure link to reset your password.
              </p>

              <div className="space-y-2">
                <label className="text-[15px] font-medium text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="Enter your registered email"
                    className="w-full pl-10 px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-[15px] text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? "Sending Reset Link..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-[19px] font-bold text-foreground">Check Your Email</h3>
                <p className="text-[15px] text-muted-foreground">
                  If <span className="text-foreground font-medium">{email}</span> is registered, a reset link has been sent.
                </p>
                <p className="text-[13px] text-muted-foreground">The link is valid for 1 hour. Check your spam folder if you don't see it.</p>
              </div>
              <Button onClick={handleClose} className="w-full bg-primary hover:bg-primary/90">
                Close
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
