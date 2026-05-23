import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp-password" | "success">("email");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("One lowercase letter");
    if (!/\d/.test(pwd)) errors.push("One number");
    if (!/[@$!%*?&]/.test(pwd)) errors.push("One special character (@$!%*?&)");
    return errors;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError("Error sending OTP. Please try again.");
        return;
      }

      setStep("otp-password");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.trim().length === 0) {
      setError("OTP is required");
      return;
    }

    const pwdErrors = validatePassword(newPassword);
    if (pwdErrors.length > 0) {
      setError("Password must meet: " + pwdErrors.join(", "));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password-forgot-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Failed to reset password. Please try again.");
        return;
      }

      setStep("success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-4">
            <Mail className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">ACE Front Line Security</h1>
          <p className="text-slate-400 text-sm mt-1">Password Reset</p>
        </div>

        <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Forgot your password?</h2>
                <p className="text-slate-400 text-sm">
                  Enter your registered email address and we'll send you an OTP to reset your password.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending OTP...
                  </span>
                ) : (
                  "Send OTP"
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/staff-login")}
                className="w-full flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-white text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </form>
          )}

          {step === "otp-password" && (
            <form onSubmit={handlePasswordReset} className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Reset Your Password</h2>
                <p className="text-slate-400 text-sm">
                  Enter the OTP sent to <span className="text-white font-medium">{email}</span> and your new password.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-950/50 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none text-center text-xl tracking-widest"
                  maxLength={6}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none pr-16"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-medium"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Confirm password"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={loading}
                  required
                />
              </div>

              {/* Password strength checklist */}
              <div className="bg-slate-700/40 rounded-lg p-3 space-y-1 text-xs">
                <p className="text-slate-300 font-semibold mb-2">Password Requirements:</p>
                {[
                  { label: "At least 8 characters", pass: newPassword.length >= 8 },
                  { label: "One uppercase letter", pass: /[A-Z]/.test(newPassword) },
                  { label: "One lowercase letter", pass: /[a-z]/.test(newPassword) },
                  { label: "One number", pass: /\d/.test(newPassword) },
                  { label: "One special character (@$!%*?&)", pass: /[@$!%*?&]/.test(newPassword) },
                ].map(({ label, pass }) => (
                  <div key={label} className={`flex items-center gap-2 ${pass ? "text-green-400" : "text-slate-500"}`}>
                    <span>{pass ? "✓" : "○"}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || !otp || !newPassword || !confirmPassword}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting Password...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-white text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-white">Password Updated!</h2>
              <p className="text-slate-400 text-sm">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <button
                onClick={() => navigate("/staff-login")}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
