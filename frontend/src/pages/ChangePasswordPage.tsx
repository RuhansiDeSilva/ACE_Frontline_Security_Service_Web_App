import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft, Loader2, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Step = "request-otp" | "verify-otp" | "set-password";

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("request-otp");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpExpiring, setOtpExpiring] = useState<number | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak");

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
      setStep("verify-otp");
      toast({ title: "OTP Sent", description: "Check your email for the 6-digit code" });
      
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
          handleReset();
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
        description: "Your password has been updated",
      });

      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("request-otp");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setOtpExpiring(null);
    setPasswordStrength("weak");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/profile")}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Change Your Password</h1>
            <p className="text-sm text-muted-foreground mt-1">Secure your account with a new password</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Step 1: Request OTP */}
        {step === "request-otp" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 border-2 border-blue-300 dark:border-blue-500/40 rounded-xl p-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-blue-900 dark:text-foreground font-semibold mb-3">
                    Secure Your Account
                  </p>
                  <p className="text-blue-700 dark:text-slate-300 leading-relaxed mb-4">
                    We'll send a One-Time Password (OTP) to your registered email address. Use it to verify your identity and set a new password.
                  </p>
                  <ul className="space-y-2 text-sm text-blue-700 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600 dark:text-green-400">✓</span> OTP is valid for 10 minutes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600 dark:text-green-400">✓</span> You'll receive it at your registered email
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600 dark:text-green-400">✓</span> Never share your OTP with anyone
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleRequestOtp}
              disabled={loading}
              size="lg"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white text-lg py-7 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <AlertCircle className="mr-3 h-5 w-5" />
                  Send OTP to Email
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/profile")}
              size="lg"
              className="w-full border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Step 2: Verify OTP */}
        {step === "verify-otp" && (
          <div className="space-y-8">
            {otpExpiring !== null && (
              <Alert className={otpExpiring < 60 ? "border-destructive bg-destructive/10" : "border-amber-500/50 bg-amber-500/10"}>
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="ml-2 text-base font-semibold">
                  OTP expires in {Math.floor(otpExpiring / 60)}:
                  {String(otpExpiring % 60).padStart(2, "0")}
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-xl p-8 space-y-6 shadow-lg">
              <div>
                <Label className="text-lg font-bold text-gray-900 dark:text-white">Enter Your OTP Code</Label>
                <p className="text-gray-700 dark:text-slate-300 mt-2">
                  Check your email for the 6-digit code. We sent it to your registered email address.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-gray-300 dark:border-slate-600">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup className="gap-3 justify-center">
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot 
                        key={i} 
                        index={i} 
                        className="h-16 w-14 text-2xl font-bold rounded-lg border-2 border-gray-400 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:border-amber-500 dark:focus:border-amber-500 focus:bg-gray-50 dark:focus:bg-slate-700 focus:ring-2 focus:ring-amber-500/50 transition-all" 
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="bg-blue-50 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-500/50 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-100">
                  <span className="font-semibold">💡 Tip:</span> Click on the first box and start typing. The code will automatically move to the next box.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  handleReset();
                  navigate("/profile");
                }}
                size="lg"
                className="flex-1 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || loading}
                size="lg"
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Verify OTP
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Set New Password */}
        {step === "set-password" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-xl p-8 space-y-6 shadow-lg">
              {/* New Password */}
              <div className="space-y-3">
                <Label htmlFor="new-password" className="text-lg font-bold text-gray-900 dark:text-white">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="h-12 pr-10 text-base bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {newPassword && (
                  <div className="space-y-2 bg-gray-50 dark:bg-slate-900/30 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="flex gap-1.5 h-3">
                      <div
                        className={`flex-1 rounded-full transition-all ${
                          passwordStrength ? "bg-red-500" : "bg-gray-300 dark:bg-slate-700"
                        }`}
                      />
                      <div
                        className={`flex-1 rounded-full transition-all ${
                          passwordStrength === "medium" || passwordStrength === "strong"
                            ? "bg-yellow-500"
                            : "bg-gray-300 dark:bg-slate-700"
                        }`}
                      />
                      <div
                        className={`flex-1 rounded-full transition-all ${
                          passwordStrength === "strong" ? "bg-green-500" : "bg-gray-300 dark:bg-slate-700"
                        }`}
                      />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-white">
                      Password Strength:{" "}
                      <span
                        className={
                          passwordStrength === "weak"
                            ? "text-red-600 dark:text-red-400 font-semibold"
                            : passwordStrength === "medium"
                              ? "text-yellow-600 dark:text-yellow-400 font-semibold"
                              : "text-green-600 dark:text-green-400 font-semibold"
                        }
                      >
                        {passwordStrength.toUpperCase()}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-3">
                <Label htmlFor="confirm-password" className="text-lg font-bold text-gray-900 dark:text-white">
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
                      confirmPassword && newPassword !== confirmPassword
                        ? "h-12 pr-10 text-base bg-white dark:bg-slate-800 border-2 border-red-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-red-500/50"
                        : "h-12 pr-10 text-base bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {confirmPassword &&
                  newPassword !== confirmPassword && (
                    <div className="bg-red-50 dark:bg-red-500/20 border border-red-300 dark:border-red-500/50 rounded-lg p-3">
                      <p className="text-sm text-red-700 dark:text-red-100">
                        ✗ Passwords do not match
                      </p>
                    </div>
                  )}
                {confirmPassword && newPassword === confirmPassword && (
                  <div className="bg-green-50 dark:bg-green-500/20 border border-green-300 dark:border-green-500/50 rounded-lg p-3">
                    <p className="text-sm text-green-700 dark:text-green-100">
                      ✓ Passwords match
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-500/20 dark:to-amber-600/10 border-2 border-amber-300 dark:border-amber-500/40 rounded-xl p-6">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-4">📋 Password Requirements:</p>
              <ul className="space-y-3 text-sm text-amber-800 dark:text-amber-50">
                <li className={`flex items-center gap-3 ${newPassword.length >= 6 ? "text-green-600 dark:text-green-300" : "text-amber-700 dark:text-amber-100"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${newPassword.length >= 6 ? "bg-green-500 text-white" : "bg-gray-400 dark:bg-slate-600 text-white"}`}>
                    {newPassword.length >= 6 ? "✓" : "1"}
                  </span>
                  At least 6 characters
                </li>
                <li className={`flex items-center gap-3 ${/[A-Z]/.test(newPassword) ? "text-green-600 dark:text-green-300" : "text-amber-700 dark:text-amber-100"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${/[A-Z]/.test(newPassword) ? "bg-green-500 text-white" : "bg-gray-400 dark:bg-slate-600 text-white"}`}>
                    {/[A-Z]/.test(newPassword) ? "✓" : "2"}
                  </span>
                  Include uppercase letters (A-Z)
                </li>
                <li className={`flex items-center gap-3 ${/[0-9]/.test(newPassword) ? "text-green-600 dark:text-green-300" : "text-amber-700 dark:text-amber-100"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${/[0-9]/.test(newPassword) ? "bg-green-500 text-white" : "bg-gray-400 dark:bg-slate-600 text-white"}`}>
                    {/[0-9]/.test(newPassword) ? "✓" : "3"}
                  </span>
                  Include numbers (0-9)
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  handleReset();
                  navigate("/profile");
                }}
                size="lg"
                className="flex-1 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
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
                size="lg"
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordPage;
