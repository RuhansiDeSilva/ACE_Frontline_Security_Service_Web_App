import { useState } from "react";
import { CheckCircle2, Copy, Check, ArrowLeft, UserPlus, Mail, AlertTriangle } from "lucide-react";
import type { SuccessData } from "@/utils/client";

interface ClientSuccessProps {
    data: SuccessData;
    onBackToList: () => void;
    onRegisterAnother: () => void;
}

const ClientSuccess = ({ data, onBackToList, onRegisterAnother }: ClientSuccessProps) => {
    const [copiedUser, setCopiedUser] = useState(false);

    const copyUsername = () => {
        navigator.clipboard.writeText(data.username);
        setCopiedUser(true);
        setTimeout(() => setCopiedUser(false), 2000);
    };

    return (
        <div className="max-w-xl mx-auto py-10 px-4">

            {/* ── Hero ── */}
            <div className="bg-white rounded-3xl px-8 py-10 text-center mb-6 border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" strokeWidth={2} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-1">Registration Successful!</h2>
                <p className="text-gray-500 text-sm">
                    <strong className="text-gray-700">{data.companyName}</strong> has been onboarded successfully.
                </p>
            </div>

            <div className="space-y-4">

                {/* ── Warning ── */}
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-800">
                        Save these credentials now — the temporary password will{" "}
                        <strong>not</strong> be shown again.
                    </p>
                </div>

                {/* ── Credentials ── */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    {/* Username */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Username</p>
                            <p className="font-mono font-bold text-gray-900">{data.username}</p>
                        </div>
                        <button
                            onClick={copyUsername}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all text-gray-600"
                        >
                            {copiedUser
                                ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied!</>
                                : <><Copy className="h-3.5 w-3.5" /> Copy</>
                            }
                        </button>
                    </div>
                    {/* Temp password */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-yellow-50">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 mb-0.5">Temporary Password</p>
                            <p className="font-mono font-bold text-yellow-900">{data.temporaryPassword || "Sent via email"}</p>
                        </div>
                    </div>
                    {/* Email */}
                    <div className="flex items-center justify-between px-5 py-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Email Sent To</p>
                            <p className="text-sm font-semibold text-gray-900">{data.contactPersonEmail}</p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                            <Mail className="h-4 w-4 text-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* ── What's next ── */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
                    <p className="text-xs font-black uppercase tracking-widest text-blue-500 mb-3">What happens next</p>
                    <ol className="space-y-2">
                        {[
                            "Client receives email with login credentials",
                            "Client logs in and sets a new password",
                            "Assign officers and generate the first invoice",
                        ].map((step, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-blue-800">
                                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">
                                    {i + 1}
                                </span>
                                {step}
                            </li>
                        ))}
                    </ol>
                </div>

                {/* ── Actions ── */}
                <div className="flex gap-3 pt-1">
                    <button
                        onClick={onBackToList}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl text-sm transition-all shadow-sm"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Client List
                    </button>
                    <button
                        onClick={onRegisterAnother}
                        className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-5 rounded-xl text-sm transition-all"
                    >
                        <UserPlus className="h-4 w-4" /> Register Another
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientSuccess;


