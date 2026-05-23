import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, CheckCircle2, AlertCircle, ShieldX } from "lucide-react";

const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("One lowercase letter");
    if (!/\d/.test(pwd)) errors.push("One number");
    if (!/[@$!%*?&]/.test(pwd)) errors.push("One special character (@$!%*?&)");
    return errors;
};

type PageState = "validating" | "invalid" | "form" | "success";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [pageState, setPageState] = useState<PageState>("validating");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) {
            setPageState("invalid");
            return;
        }
        fetch(`/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.data === true) {
                    setPageState("form");
                } else {
                    setPageState("invalid");
                }
            })
            .catch(() => setPageState("invalid"));
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

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
            const res = await fetch("/api/auth/reset-password-by-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword, confirmPassword }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data?.message || "Failed to reset password. The link may have expired.");
                return;
            }
            setPageState("success");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-4">
                        <Lock className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">ACE Front Line Security</h1>
                    <p className="text-slate-400 text-sm mt-1">Password Reset</p>
                </div>

                <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">

                    {/* Validating */}
                    {pageState === "validating" && (
                        <div className="text-center py-6">
                            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-300">Validating your reset link...</p>
                        </div>
                    )}

                    {/* Invalid / expired */}
                    {pageState === "invalid" && (
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <ShieldX className="w-8 h-8 text-red-400" />
                                </div>
                            </div>
                            <h2 className="text-xl font-semibold text-white">Link Invalid or Expired</h2>
                            <p className="text-slate-400 text-sm">
                                This reset link has expired or already been used. Reset links are valid for 1 hour.
                            </p>
                            <button
                                onClick={() => navigate("/forgot-password")}
                                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Request a New Link
                            </button>
                            <button
                                onClick={() => navigate("/staff-login")}
                                className="w-full py-2.5 px-4 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 font-medium rounded-lg transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    )}

                    {/* Password Form */}
                    {pageState === "form" && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-1">Set New Password</h2>
                                <p className="text-slate-400 text-sm">Create a strong password for your account.</p>
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 p-3 bg-red-950/50 border border-red-500/30 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-red-300 text-sm">{error}</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-300">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
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
                                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                                    placeholder="Confirm your password"
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
                                disabled={loading || !newPassword || !confirmPassword}
                                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Resetting Password...
                                    </span>
                                ) : "Reset Password"}
                            </button>
                        </form>
                    )}

                    {/* Success */}
                    {pageState === "success" && (
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
