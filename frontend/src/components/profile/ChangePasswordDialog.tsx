import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { Loader2, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "request-otp" | "verify-otp" | "set-password";

const ChangePasswordDialog = ({ open, onOpenChange }: ChangePasswordDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("request-otp");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiring, setOtpExpiring] = useState<number | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak");

  // Calculate password strength
  const checkPasswordStrength = (pwd: string) => {
    if (pwd.length < 6) return "weak";
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return "strong";
    if (pwd.length >= 6 && /[A-Z]/.test(pwd)) return "medium";
    return "weak";
  };

  const handlePasswordChange = (pwd: string) => {
    setNewPassword(pwd);
    setPasswordStrength(checkPasswordStrength(pwd));
  };

  const handleRequestOtp = async () => {
    setLoading(true);
    try {
      await authService.sendOtp();
      setOtpSent(true);
      setStep("verify-otp");
      // Start countdown timer (10 minutes)
      let remaining = 600;
      const interval = setInterval(() => {
        remaining--;
        if (remaining === 60) {
          toast({
            title: "OTP Expiring Soon",
            description: "Your OTP will expire in 1 minute",
            variant: "destructive",
          });
        }
        setOtpExpiring(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          handleResetDialog();
          toast({
            title: "OTP Expired",
            description: "Please request a new OTP",
            variant: "destructive",
          });
        }
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Could not send OTP to your email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP",
        variant: "destructive",
      });
      return;
    }
    setStep("set-password");
  };

  const handleChangePassword = async () => {
    // Validation
    if (newPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirm password must match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({
        otp,
        newPassword,
        confirmPassword,
      });

      toast({
        title: "Password Changed Successfully",
        description: "Your password has been updated and you can now log in with your new password",
      });

      handleResetDialog();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.message || "An error occurred while changing your password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetDialog = () => {
    setStep("request-otp");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setOtpSent(false);
    setOtpExpiring(null);
    setPasswordStrength("weak");
  };

  const handleClose = () => {
    handleResetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            Change Your Password
          </DialogTitle>
          <DialogDescription>
            {step === "request-otp"
              ? "Request an OTP to change your password"
              : step === "verify-otp"
                ? "Enter the OTP sent to your registered email"
                : "Set your new password"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Request OTP */}
        {step === "request-otp" && (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-foreground">
                We'll send a One-Time Password (OTP) to your registered email address. Use it to verify your identity and set a new password.
              </p>
            </div>
            <Button
              onClick={handleRequestOtp}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Send OTP to Email"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Step 2: Verify OTP */}
        {step === "verify-otp" && (
          <div className="space-y-4">
            {otpExpiring !== null && (
              <Alert
                className={otpExpiring < 60 ? "border-destructive bg-destructive/10" : ""}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  OTP expires in {Math.floor(otpExpiring / 60)}:
                  {String(otpExpiring % 60).padStart(2, "0")}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Enter OTP</Label>
              <p className="text-xs text-muted-foreground">
                Check your email for the 6-digit code
              </p>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup className="gap-2">
                  {[...Array(6)].map((_, i) => (
                    <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg font-bold" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("request-otp")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || loading}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Verify OTP
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Set New Password */}
        {step === "set-password" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1 h-1">
                    <div
                      className={`flex-1 rounded-full ${
                        passwordStrength ? "bg-red-500" : "bg-muted"
                      }`}
                    />
                    <div
                      className={`flex-1 rounded-full ${
                        passwordStrength === "medium" || passwordStrength === "strong"
                          ? "bg-yellow-500"
                          : "bg-muted"
                      }`}
                    />
                    <div
                      className={`flex-1 rounded-full ${
                        passwordStrength === "strong" ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Strength:{" "}
                    <span
                      className={
                        passwordStrength === "weak"
                          ? "text-red-500"
                          : passwordStrength === "medium"
                            ? "text-yellow-500"
                            : "text-green-500"
                      }
                    >
                      {passwordStrength.toUpperCase()}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={
                    confirmPassword &&
                    newPassword !== confirmPassword
                      ? "border-destructive pr-10"
                      : "pr-10"
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {confirmPassword &&
                newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">
                    Passwords do not match
                  </p>
                )}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-xs text-foreground">
                <strong>Password Requirements:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• At least 6 characters</li>
                  <li>• Include uppercase letters and numbers for stronger security</li>
                </ul>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("verify-otp")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  loading
                }
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
