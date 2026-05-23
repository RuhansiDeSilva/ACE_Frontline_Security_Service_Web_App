import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { clientApi } from "@/lib/api";
import { ArrowRight, CheckCircle2, Circle, Eye, EyeOff, KeyRound, X } from "lucide-react";

interface ChangePasswordModalProps {
    clientId: number;
    onClose: () => void;
}

const ChangePasswordModal = ({ clientId, onClose }: ChangePasswordModalProps) => {
    const isFirstLogin = localStorage.getItem("isFirstLogin") === "true";
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [overlayBounds, setOverlayBounds] = useState<React.CSSProperties | null>(null);

    const checks = useMemo(() => ({
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    }), [newPassword]);

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const strengthLabel = passedChecks <= 1 ? "Weak" : passedChecks === 2 ? "Medium" : passedChecks === 3 ? "Good" : "Strong";

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    useEffect(() => {
        const updateBounds = () => {
            const main = document.getElementById("dashboard-main");
            if (!main) {
                setOverlayBounds({ top: 0, right: 0, bottom: 0, left: 0 });
                return;
            }
            const rect = main.getBoundingClientRect();
            setOverlayBounds({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
            });
        };

        updateBounds();
        window.addEventListener("resize", updateBounds);
        return () => window.removeEventListener("resize", updateBounds);
    }, []);

    const handleSubmit = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("All fields are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (passedChecks < 4) {
            setError("Password does not meet security requirements.");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            await clientApi.changePassword(clientId, { currentPassword, newPassword, confirmPassword });
            onClose();
        } catch (e: any) {
            setError(e?.message || "Failed to change password.");
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = "w-full bg-muted/50 border-2 border-transparent rounded-xl px-4 py-3.5 text-sm focus:bg-card focus:border-primary focus:ring-0 transition-all outline-none pr-11";

    const modal = (
        <div
            className="fixed z-[100] bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center"
            style={overlayBounds ?? { top: 0, right: 0, bottom: 0, left: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Change password"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-md max-h-[calc(100vh-2rem)] bg-card rounded-2xl shadow-2xl border overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <KeyRound className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-extrabold uppercase tracking-tight">Change Password</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">

                    {/* Title */}
                    <div className="space-y-1 text-center">
                        <h2 className="text-xl font-black tracking-tight">
                            {isFirstLogin ? "Set Your New Password" : "Change Password"}
                        </h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {isFirstLogin
                                ? "Please set a new password to secure your account."
                                : "Update your password to keep your account secure."}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Fields */}
                    <div className="space-y-3">
                        {/* Current */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    className={inputClass}
                                    placeholder="Enter current password"
                                    type={showCurrent ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                    aria-label={showCurrent ? "Hide current password" : "Show current password"}
                                >
                                    {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* New */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    className={inputClass}
                                    placeholder="Min. 8 characters"
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                    aria-label={showNew ? "Hide new password" : "Show new password"}
                                >
                                    {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>

                            {/* Strength bars */}
                            <div className="pt-2 space-y-2">
                                <div className="flex gap-1.5">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 flex-1 rounded-full ${
                                                i < passedChecks ? "bg-primary shadow-sm shadow-primary/20" : "bg-muted"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">
                                        Strength: {strengthLabel}
                                    </p>
                                    <p className="text-[10px] font-bold text-muted-foreground">
                                        {strengthLabel === "Strong" ? "Excellent" : strengthLabel === "Good" ? "Good" : "Needs improvement"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Policy */}
                        <div className="bg-muted/50 rounded-xl p-3 space-y-2 border">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Password Requirements</p>
                            <ul className="grid grid-cols-2 gap-1.5">
                                {[
                                    { label: "At least 8 characters", ok: checks.length },
                                    { label: "At least one uppercase letter", ok: checks.uppercase },
                                    { label: "At least one number", ok: checks.number },
                                    { label: "At least one special character", ok: checks.special },
                                ].map((rule) => (
                                    <li
                                        key={rule.label}
                                        className={`flex items-center gap-1.5 text-[11px] ${rule.ok ? "font-bold" : "font-medium text-muted-foreground"}`}
                                    >
                                        {rule.ok ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                            <Circle className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        {rule.label}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Confirm */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    className={inputClass}
                                    placeholder="Repeat new password"
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                                >
                                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-1">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] text-sm disabled:opacity-60"
                        >
                            {submitting ? "Changing..." : "Change Password"}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <p className="text-center text-xs font-medium text-muted-foreground">
                            Having trouble?{" "}
                            <a className="text-primary font-bold hover:underline" href="#">Contact Support</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    if (typeof document === "undefined") return modal;
    return createPortal(modal, document.body);
};

export default ChangePasswordModal;
