import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Shield, Brain, Download, Loader2, AlertTriangle,
    Building2, Users, MapPin, Camera, Banknote, Moon, Calendar, Zap,
    CheckCircle, Mail, Send, RotateCcw, Phone,
    Sparkles as SparklesIcon,
    ArrowRight as ArrowRightIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
// import logoImage from "@/assets/logo.png"; // Logo removed for public repo

// ── Constants ───────────────────────────────────────────────────────────────

const COMPANY_TYPES = [
    "Conglomerate", "Construction", "Education", "Engineering",
    "Food", "Healthcare", "Manufacturing", "Other", "Retail", "Services",
];

const CITIES = [
    "Galle", "Gampaha", "Horana", "Kaluthara", "Kandy", "Kapugama",
    "Kegalle", "Kurunegala", "Matale", "Matara", "Negombo", "Puttalam",
    "Rathnapura",
];

const PREDICT_API = "/api/ml/predict";
const REPORT_API = "/api/ml/report";
const REPORT_EMAIL_API = "/api/ml/report/email";

const ANALYSIS_PHASES = [
    "Analyzing your company security profile...",
    "Evaluating site threats and exposure...",
    "Finalizing recommended officer deployment..."
];

// ── Component ───────────────────────────────────────────────────────────────

const AIRiskAssessment = () => {
    const { toast } = useToast();

    // Form state
    const [companyName, setCompanyName] = useState("");
    const [employeeCount, setEmployeeCount] = useState("");
    const [distanceToMainCityKm, setDistanceToMainCityKm] = useState("");
    const [companyAssets, setCompanyAssets] = useState("");
    const [cctvCount, setCctvCount] = useState("");
    const [companyType, setCompanyType] = useState("");
    const [nearestMainCity, setNearestMainCity] = useState("");
    const [urban, setUrban] = useState(false);
    const [nightActivity, setNightActivity] = useState(false);
    const [majorEventNearby, setMajorEventNearby] = useState(false);
    const [cashHandling, setCashHandling] = useState(false);

    // Status state
    const [result, setResult] = useState<{ riskLevel: number; requiredOfficers: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisStep, setAnalysisStep] = useState(0);

    // Email state
    const [emailAddress, setEmailAddress] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const resultsRef = useRef<HTMLDivElement>(null);
    const emailSectionRef = useRef<HTMLDivElement>(null);

    const buildPayload = () => ({
        company_name: companyName,
        employee_count: parseInt(employeeCount) || 0,
        distance_to_city_km: parseInt(distanceToMainCityKm) || 0,
        company_assets: parseInt(companyAssets) || 0,
        cctv_count: parseInt(cctvCount) || 0,
        company_type: companyType,
        urban_rural: urban ? "Urban" : "Rural",
        night_activity: nightActivity,
        nearest_city: nearestMainCity,
        major_event_nearby: majorEventNearby,
        cash_handling: cashHandling,
    });

    const normalizeRiskLevel = (value: unknown) => {
        if (typeof value === "number" && Number.isFinite(value)) return value;

        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            if (normalized === "high") return 3;
            if (normalized === "medium") return 2;
            if (normalized === "low") return 1;
        }

        return 0;
    };

    const getFriendlyErrorMessage = (status: number, rawMessage?: string) => {
        const message = (rawMessage || "").toLowerCase();

        if (status === 401) return "You are not authorized. Please sign in and try again.";
        if (status === 403) return "Access denied for this action. Please check your account permissions.";
        if (status === 404) return "Service endpoint not found. Please contact support if this continues.";
        if (status === 408 || message.includes("timeout")) return "The request timed out. Please try again in a moment.";
        if (status === 422 || message.includes("unprocessable entity")) {
            return "Some form values are invalid. Please review your inputs and submit again.";
        }
        if (status >= 500) return "Server is temporarily unavailable. Please try again shortly.";

        return rawMessage || `Request failed (${status}). Please try again.`;
    };

    const parseErrorFromResponse = async (res: Response, fallback: string) => {
        try {
            const contentType = res.headers.get("content-type") || "";

            if (contentType.includes("application/json")) {
                const data = await res.json();
                const rawMessage =
                    data?.message ||
                    data?.error ||
                    data?.detail ||
                    (Array.isArray(data?.errors) ? data.errors[0]?.message : "") ||
                    "";

                return getFriendlyErrorMessage(res.status, typeof rawMessage === "string" ? rawMessage : fallback);
            }

            const text = await res.text();
            return getFriendlyErrorMessage(res.status, text || fallback);
        } catch {
            return getFriendlyErrorMessage(res.status, fallback);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResult(null);
        setEmailSent(false);
        setLoading(true);
        setAnalysisStep(0);
        const startedAt = Date.now();
        const minLoadingMs = 900;

        const stepTimer = window.setInterval(() => {
            setAnalysisStep((prev) => (prev < ANALYSIS_PHASES.length - 1 ? prev + 1 : prev));
        }, 350);

        try {
            const res = await fetch(PREDICT_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildPayload()),
            });

            if (!res.ok) {
                const friendlyMessage = await parseErrorFromResponse(res, "Unable to run assessment");
                throw new Error(friendlyMessage);
            }

            const data = await res.json();
            setResult({
                riskLevel: normalizeRiskLevel(data.risk_level_code ?? data.riskLevelCode ?? data.riskLevel ?? data.risk_level),
                requiredOfficers: Number(data.officer_count ?? data.officerCount ?? data.requiredOfficers ?? 0),
            });
        } catch (err: any) {
            const message = err.message || "Failed to get prediction. Please try again.";
            setError(message);
            toast({ title: "Prediction Failed", description: message, variant: "destructive" });
        } finally {
            clearInterval(stepTimer);
            const elapsed = Date.now() - startedAt;
            if (elapsed < minLoadingMs) {
                await new Promise((resolve) => setTimeout(resolve, minLoadingMs - elapsed));
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        if (loading || result) {
            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        }
    }, [loading, result]);

    useEffect(() => {
        if (result) {
            setTimeout(() => emailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
        }
    }, [result]);

    const handleDownloadReport = async () => {
        if (!result) return;
        setDownloading(true);
        try {
            const res = await fetch(REPORT_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    request: {
                        ...buildPayload(),
                        required_officers: result.requiredOfficers,
                    },
                    response: {
                        risk_level: getRiskDisplay(result.riskLevel).label,
                        officer_count: result.requiredOfficers,
                    },
                }),
            });
            if (!res.ok) {
                const friendlyMessage = await parseErrorFromResponse(res, "Failed to generate report");
                throw new Error(friendlyMessage);
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `AI_Risk_Assessment_${companyName.replace(/[^a-zA-Z0-9]/g, "_") || "report"}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast({ title: "Report Downloaded", description: "Your AI Risk Assessment PDF is ready." });
        } catch (err: any) {
            toast({ title: "Download Failed", description: err.message || "Unable to generate report. Please try again.", variant: "destructive" });
        } finally {
            setDownloading(false);
        }
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!result || !emailAddress) return;
        setSendingEmail(true);
        try {
            const res = await fetch(REPORT_EMAIL_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailAddress,
                    request: {
                        ...buildPayload(),
                        required_officers: result.requiredOfficers,
                    },
                    response: {
                        risk_level: getRiskDisplay(result.riskLevel).label,
                        officer_count: result.requiredOfficers,
                    },
                }),
            });
            if (!res.ok) {
                const friendlyMessage = await parseErrorFromResponse(res, "Failed to send email");
                throw new Error(friendlyMessage);
            }
            setEmailSent(true);
            toast({ title: "Report Sent!", description: `Your report has been emailed to ${emailAddress}.` });
        } catch (err: any) {
            toast({ title: "Email Failed", description: err.message || "Could not send report email. Please try again.", variant: "destructive" });
        } finally {
            setSendingEmail(false);
        }
    };

    const getRiskDisplay = (riskLevel: number) => {
        if (riskLevel >= 3) {
            return {
                label: "High",
                panel: "bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent border-red-500/35",
                text: "text-red-600 dark:text-red-400",
            };
        }

        if (riskLevel === 2) {
            return {
                label: "Medium",
                panel: "bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/35",
                text: "text-amber-600 dark:text-amber-400",
            };
        }

        return {
            label: "Low",
            panel: "bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/35",
            text: "text-emerald-600 dark:text-emerald-400",
        };
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header Matched with Inquiries.tsx */}
            <header className="sticky top-0 z-50 w-full bg-white dark:bg-black border-b-2 border-gray-300 dark:border-gray-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
                            {/* Logo image removed for public repo */}
                            <div className="flex flex-col leading-none">
                                <span className="text-sm font-extrabold tracking-tight uppercase text-black dark:text-white">Ace Front Line</span>
                                <span className="text-[9px] tracking-[0.15em] font-semibold text-gray-600 dark:text-gray-400 uppercase">Security Solutions</span>
                            </div>
                        </Link>
                        <div className="flex items-center gap-8 ml-auto">
                            <nav className="hidden lg:flex items-center gap-8">
                                <Link to="/" className="text-black dark:text-white hover:text-primary transition-colors font-semibold text-sm">
                                    Home
                                </Link>
                                <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/?scroll=services'; }} className="text-black dark:text-white hover:text-primary transition-colors font-semibold text-sm cursor-pointer">
                                    Services
                                </a>
                                <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/?scroll=about-us'; }} className="text-black dark:text-white hover:text-primary transition-colors font-semibold text-sm cursor-pointer">
                                    About Us
                                </a>
                                <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/?scroll=clients'; }} className="text-black dark:text-white hover:text-primary transition-colors font-semibold text-sm cursor-pointer">
                                    Clients
                                </a>
                                <Link to="/careers" className="text-black dark:text-white hover:text-primary transition-colors font-semibold text-sm">
                                    Careers
                                </Link>
                                <Link to="/inquiries" className="text-primary font-semibold text-sm">
                                    Inquiries
                                </Link>
                                <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/?scroll=contact'; }} className="text-black dark:text-white hover:text-primary transition-colors font-semibold text-sm cursor-pointer">
                                    Contact
                                </a>
                            </nav>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section Matched with Screenshot */}
            <section className="relative bg-[#1A1A1B] text-white py-24 md:py-32 overflow-hidden text-center transition-colors duration-300">
                <div className="absolute top-0 left-0 w-1/4 h-full bg-gradient-to-r from-[#FFD700]/10 to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-[#FFD700]/10 to-transparent pointer-events-none" />

                <div className="relative z-10 max-w-5xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#FFD700]/20 mb-8">
                            <div className="w-1.5 h-1.5 bg-[#FFD700] rounded-full animate-pulse" />
                            <span className="text-[#FFD700] text-[10px] font-black uppercase tracking-[0.2em] leading-none">AI-Powered Analysis</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-8 tracking-tight leading-tight">
                            Security Risk <span className="text-[#FFD700]">Assessment</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground dark:text-gray-400 max-w-3xl mx-auto leading-relaxed font-medium">
                            Our AI model analyses your company's profile to predict security risk levels <br className="hidden md:block" />
                            and recommend the optimal number of officers for deployment.
                        </p>
                    </motion.div>

                    {/* Auto-scroll CTA - Matched with Inquiries.tsx style */}
                    <div className="mt-12 flex flex-col items-center gap-4">
                        <Button
                            onClick={() => document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            className="inline-flex items-center px-10 py-6 rounded-xl border border-[#1A1A1B] dark:border-[#FFD700] bg-[#FFD700] hover:bg-[#FFD700] dark:bg-transparent dark:hover:bg-[#FFD700] transition-all duration-300 group hover:shadow-[0_0_25px_rgba(255,215,0,0.5)] shadow-lg"
                        >
                            <span className="text-sm font-black text-[#1A1A1B] dark:text-[#FFD700] dark:group-hover:text-[#1A1A1B] uppercase tracking-widest leading-none">Start Assessment</span>
                        </Button>
                    </div>
                </div>
            </section>

            {/* ── Form Section ───────────────────────────────────────── */}
            <section id="form-section" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-foreground dark:text-white tracking-tight">Run Your Assessment</h2>
                    <p className="text-muted-foreground dark:text-gray-300 mt-2">Fill in your company details below for an instant AI-generated security report</p>
                    <div className="w-16 h-1 bg-[#1A1A1B] dark:bg-[#FFD700] mx-auto mt-4 rounded-full" />
                </div>

                <Card className="shadow-xl border-0 bg-card dark:bg-[#1A1A1B] overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-[#1A1A1B] via-[#FFD700] to-[#1A1A1B]" />
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-[#1A1A1B] dark:bg-[#FFD700]/20 p-2 rounded-lg">
                                <Shield className="h-6 w-6 text-white dark:text-[#FFD700]" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl text-foreground dark:text-white">AI Risk Assessment Form</CardTitle>
                                <CardDescription className="mt-1 dark:text-gray-400">All fields marked with * are required for accurate predictions.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8 sm:p-12">
                        <form onSubmit={handleSubmit} className="space-y-16">

                            {/* Company Information */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 mb-8">
                                    <div className="w-1.5 h-8 bg-[#FFD700] rounded-full" />
                                    <div className="flex items-center gap-2">
                                        <div className="bg-[#1A1A1B] dark:bg-[#FFD700] p-2 rounded text-[#FFD700] dark:text-[#1A1A1B]">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-base font-black text-[#1A1A1B] dark:text-white uppercase tracking-widest">
                                            Company Information
                                        </h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="companyName" className="font-bold text-gray-700 dark:text-gray-300">Company Name *</Label>
                                        <Input
                                            id="companyName" value={companyName}
                                            onChange={e => setCompanyName(e.target.value)}
                                            placeholder="Enter registered company name" required maxLength={200}
                                            className="h-12 border-gray-200 dark:border-gray-600 bg-background dark:bg-gray-900 text-gray-900 dark:text-white focus-visible:ring-[#FFD700] autofill:shadow-[0_0_0_1000px_#f7f3e3_inset] dark:autofill:shadow-[0_0_0_1000px_#111827_inset]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="companyType" className="font-bold text-gray-700 dark:text-gray-300">Company Type *</Label>
                                        <Select value={companyType} onValueChange={setCompanyType} required>
                                            <SelectTrigger className="h-12 border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus-visible:ring-[#FFD700]"><SelectValue placeholder="Select industry" /></SelectTrigger>
                                            <SelectContent className="dark:bg-gray-900 dark:text-white">
                                                {COMPANY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nearestMainCity" className="font-bold text-gray-700 dark:text-gray-300">Nearest Main City *</Label>
                                        <Select value={nearestMainCity} onValueChange={setNearestMainCity} required>
                                            <SelectTrigger className="h-12 border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus-visible:ring-[#FFD700]"><SelectValue placeholder="Select city" /></SelectTrigger>
                                            <SelectContent className="dark:bg-gray-900 dark:text-white">
                                                {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Operational Details */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 mb-8">
                                    <div className="w-1.5 h-8 bg-[#FFD700] rounded-full" />
                                    <div className="flex items-center gap-2">
                                        <div className="bg-[#1A1A1B] dark:bg-[#FFD700] p-2 rounded text-[#FFD700] dark:text-[#1A1A1B]">
                                            <Zap className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-base font-black text-[#1A1A1B] dark:text-white uppercase tracking-widest">
                                            Operational Details
                                        </h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="employeeCount" className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5 text-[#FFD700]" /> Employee Count *
                                        </Label>
                                        <Input
                                            id="employeeCount" type="number" value={employeeCount}
                                            onChange={e => setEmployeeCount(e.target.value)}
                                            placeholder="e.g. 100" required min={1} className="h-12 border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus-visible:ring-[#FFD700]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="distanceToMainCityKm" className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-[#FFD700]" /> Distance to City (km) *
                                        </Label>
                                        <Input
                                            id="distanceToMainCityKm" type="number" value={distanceToMainCityKm}
                                            onChange={e => setDistanceToMainCityKm(e.target.value)}
                                            placeholder="e.g. 15" required min={0} className="h-12 border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus-visible:ring-[#FFD700]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="companyAssets" className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                            <Banknote className="h-3.5 w-3.5 text-[#FFD700]" /> Company Assets (LKR) *
                                        </Label>
                                        <Input
                                            id="companyAssets" type="number" value={companyAssets}
                                            onChange={e => setCompanyAssets(e.target.value)}
                                            placeholder="Estimated value" required min={0} className="h-12 border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus-visible:ring-[#FFD700]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cctvCount" className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                            <Camera className="h-3.5 w-3.5 text-[#FFD700]" /> CCTV Count *
                                        </Label>
                                        <Input
                                            id="cctvCount" type="number" value={cctvCount}
                                            onChange={e => setCctvCount(e.target.value)}
                                            placeholder="Active cameras" required min={0} className="h-12 border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus-visible:ring-[#FFD700]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Risk Factors */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 mb-8">
                                    <div className="w-1.5 h-8 bg-[#FFD700] rounded-full" />
                                    <div className="flex items-center gap-2">
                                        <div className="bg-[#1A1A1B] dark:bg-[#FFD700] p-2 rounded text-[#FFD700] dark:text-[#1A1A1B]">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-base font-black text-[#1A1A1B] dark:text-white uppercase tracking-widest">
                                            Risk Factors
                                        </h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {[
                                        { id: "urban", label: "Urban Location", desc: "High-density urban area", state: urban, setter: setUrban, icon: Building2 },
                                        { id: "nightActivity", label: "Night Activity", desc: "Significant night-time operations", state: nightActivity, setter: setNightActivity, icon: Moon },
                                        { id: "majorEventNearby", label: "Major Event Nearby", desc: "Proximity to large events/venues", state: majorEventNearby, setter: setMajorEventNearby, icon: Calendar },
                                        { id: "cashHandling", label: "Cash Handling", desc: "High volume cash transactions", state: cashHandling, setter: setCashHandling, icon: Banknote },
                                    ].map(item => (
                                        <label
                                            key={item.id}
                                            htmlFor={item.id}
                                            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200
                                            ${item.state
                                                    ? "border-[#1A1A1B] dark:border-[#FFD700] bg-[#1A1A1B]/5 dark:bg-[#FFD700]/5 shadow-sm"
                                                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-[#1A1A1B] dark:hover:border-[#FFD700]/30"
                                                }`}
                                        >
                                            <div className={`p-2.5 rounded-lg transition-colors ${item.state ? "bg-[#1A1A1B] dark:bg-[#FFD700] text-white dark:text-[#1A1A1B]" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                                                <item.icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-foreground dark:text-white">{item.label}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{item.desc}</p>
                                            </div>
                                            <input
                                                type="checkbox" id={item.id} checked={item.state}
                                                onChange={e => item.setter(e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 accent-[#1A1A1B] dark:accent-[#FFD700]"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                disabled={loading || !companyType || !nearestMainCity}
                                className="w-full h-14 bg-[#1A1A1B] dark:bg-transparent border border-[#1A1A1B] dark:border-[#FFD700] hover:bg-[#FFD700] text-white dark:text-[#FFD700] hover:text-[#1A1A1B] font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all duration-300"
                                size="lg"
                            >
                                {loading
                                    ? <Loader2 className="h-5 w-5 animate-spin" />
                                    : "Run AI Risk Assessment"
                                }
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </section>

            {/* ── Analysis / Results Panel ────────────────────────────── */}
            {(loading || result || error) && (
                <section ref={resultsRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="relative w-full min-h-[340px] overflow-hidden rounded-3xl border border-border bg-card dark:bg-[#1A1A1B] shadow-xl"
                            >
                                <div className="h-1.5 bg-gradient-to-r from-[#1A1A1B] via-[#FFD700] to-[#1A1A1B]" />
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-muted/60">
                                    <motion.div
                                        className="h-full bg-[#FFD700]"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 2.5, ease: "linear" }}
                                    />
                                </div>
                                <div className="text-center py-10 px-6 flex min-h-[338px] items-center justify-center">
                                    <div>
                                        <div className="relative w-28 h-28 mx-auto mb-7">
                                            <motion.div
                                                className="absolute inset-0 border-4 border-[#FFD700]/25 rounded-full"
                                                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                            <div className="absolute inset-0 border-4 border-[#1A1A1B] dark:border-[#FFD700] border-t-transparent rounded-full animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Shield className="h-10 w-10 text-[#1A1A1B] dark:text-[#FFD700] animate-pulse" />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-black uppercase tracking-tight text-foreground dark:text-white mb-2">Intelligence Synthesis</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1A1A1B] dark:text-[#FFD700] h-4 mb-4">
                                            {ANALYSIS_PHASES[analysisStep]}
                                        </p>
                                        <p className="text-xs text-muted-foreground dark:text-gray-400 max-w-md mx-auto mb-4 leading-relaxed">
                                            We’re checking location exposure, operational risk factors, and asset profile to estimate your risk level and ideal officer deployment.
                                        </p>
                                        <div className="flex justify-center gap-2.5">
                                            {ANALYSIS_PHASES.map((_, i) => (
                                                <span
                                                    key={i}
                                                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${i <= analysisStep
                                                        ? "bg-[#1A1A1B] dark:bg-[#FFD700] text-white dark:text-[#1A1A1B]"
                                                        : "bg-muted text-muted-foreground"
                                                        }`}
                                                >
                                                    Phase {i + 1}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : error ? (
                            <Card className="shadow-xl border-0 bg-card dark:bg-[#1A1A1B] overflow-hidden w-full" key="error">
                                <div className="h-1.5 bg-gradient-to-r from-[#1A1A1B] via-[#FFD700] to-[#1A1A1B]" />
                                <CardContent className="p-8">
                                    <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40">
                                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-red-700 dark:text-red-300 text-sm">Analysis Failed</p>
                                            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : result ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-card dark:bg-[#1A1A1B] rounded-3xl border border-border shadow-xl overflow-hidden w-full min-h-[340px]"
                            >
                                <div className="h-1.5 bg-gradient-to-r from-[#1A1A1B] via-[#FFD700] to-[#1A1A1B]" />
                                <div className="py-3 px-8 text-center bg-[#1A1A1B] dark:bg-black">
                                    <h3 className="text-base font-bold text-[#FFD700] uppercase tracking-wider">Deployment Recommendations</h3>
                                </div>

                                <div className="text-center px-8 pt-6">
                                    <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#FFD700]/15 text-[#1A1A1B] dark:text-[#FFD700] border border-[#FFD700]/30">
                                        <CheckCircle className="h-3 w-3" /> Assessment Complete
                                    </p>
                                    <h4 className="mt-3 text-xl font-black text-foreground dark:text-white tracking-tight">{companyName}</h4>
                                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">Security Intelligence Report</p>
                                </div>

                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={`space-y-3 text-center p-5 rounded-2xl border ${getRiskDisplay(result.riskLevel).panel}`}>
                                        <p className="text-[11px] font-black text-muted-foreground dark:text-gray-400 uppercase tracking-widest leading-none">Risk Level</p>
                                        <div className="flex flex-col items-center">
                                            <span className={`text-3xl font-black uppercase ${getRiskDisplay(result.riskLevel).text}`}>
                                                {getRiskDisplay(result.riskLevel).label}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-muted-foreground/70 dark:text-gray-300 uppercase tracking-tighter">AI-classified site risk profile</p>
                                    </div>

                                    <div className="space-y-3 text-center p-5 bg-gradient-to-br from-[#FFD700]/15 via-[#FFD700]/10 to-transparent dark:from-[#FFD700]/10 dark:via-[#FFD700]/5 dark:to-transparent rounded-2xl border border-[#FFD700]/35">
                                        <p className="text-[11px] font-black text-[#1A1A1B] dark:text-[#FFD700] uppercase tracking-widest leading-none">Recommended Officers</p>
                                        <div className="flex flex-col items-center">
                                            <p className="text-4xl font-black text-[#1A1A1B] dark:text-[#FFD700] leading-none">{result.requiredOfficers}</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-[#1A1A1B]/60 dark:text-[#FFD700]/60 uppercase tracking-tighter">Optimized deployment for 24/7 site coverage</p>
                                    </div>
                                </div>

                                <div className="px-6 pb-2">
                                    <div className="rounded-xl border border-amber-300/40 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800/40 px-4 py-3">
                                        <p className="text-[11px] leading-relaxed font-semibold text-amber-900 dark:text-amber-200">
                                            ⚠️ This is an AI-generated recommendation for guidance only. Final deployment decisions should be confirmed with a professional on-site survey.
                                        </p>
                                    </div>
                                </div>

                                <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Button
                                        onClick={handleDownloadReport}
                                        disabled={downloading}
                                        className="h-14 bg-[#1A1A1B] dark:bg-transparent border border-[#1A1A1B] dark:border-[#FFD700] hover:bg-[#FFD700] text-white dark:text-[#FFD700] hover:text-[#1A1A1B] font-black uppercase tracking-widest rounded-xl text-xs transition-all duration-300 shadow-lg"
                                    >
                                        {downloading ? "Generating..." : "Download Report"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setResult(null);
                                            setError(null);
                                            setEmailSent(false);
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                        className="h-14 border-border dark:border-gray-700 hover:bg-muted dark:hover:bg-gray-900 font-black uppercase tracking-widest rounded-xl text-xs gap-3"
                                    >
                                        <RotateCcw className="h-4 w-4" /> Reset Assessment
                                    </Button>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </section>
            )}

            {/* ── Email Report Section ─────────────────────────────── */}
            {result && !loading && (
                <section ref={emailSectionRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                    <Card className="shadow-xl border-0 bg-card overflow-hidden">
                        <div className="h-1.5 bg-gradient-to-r from-[#1A1A1B] via-[#FFD700] to-[#1A1A1B]" />
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-[#FFD700]/10 p-2 rounded-lg">
                                    <Mail className="h-6 w-6 text-[#1A1A1B]" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Receive Report by Email</CardTitle>
                                    <CardDescription className="mt-1">
                                        Enter your email address to receive your full AI Risk Assessment report as a PDF attachment, along with a personalised summary from our security team.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {emailSent ? (
                                <div className="flex items-center gap-3 p-4 rounded-xl border border-green-200 bg-green-50">
                                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                                    <div>
                                        <p className="font-bold text-green-700 text-sm">Report Sent!</p>
                                        <p className="text-green-700 text-sm">Your report has been emailed to <strong>{emailAddress}</strong>. Please check your inbox (and spam folder).</p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSendEmail} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="reportEmail" className="font-semibold">Email Address *</Label>
                                        <Input
                                            id="reportEmail"
                                            type="email"
                                            value={emailAddress}
                                            onChange={e => setEmailAddress(e.target.value)}
                                            placeholder="you@company.com"
                                            required
                                            maxLength={255}
                                            className="h-11"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Your report will be delivered with a professional security assessment summary from Ace Front Line.
                                        </p>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={sendingEmail || !emailAddress}
                                        className="w-full h-12 text-sm font-black uppercase tracking-widest shadow-lg transition-all bg-[#1A1A1B] dark:bg-transparent border border-[#1A1A1B] dark:border-[#FFD700] hover:bg-[#FFD700] text-white dark:text-[#FFD700] hover:text-[#1A1A1B]"
                                        size="lg"
                                    >
                                        {sendingEmail ? "Sending..." : "Send Report to Email"}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* ── Footer CTA ──────────────────────────────────────── */}
            <section className="bg-[#1A1A1B] text-white py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h3 className="text-2xl font-bold mb-3">Need a Professional Security Survey?</h3>
                    <p className="text-[#FFD700]/60 mb-6">Our team can visit your site for a comprehensive security assessment — at no cost to you.</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a href="tel:+15551234567" className="inline-flex items-center gap-2 bg-[#FFD700] hover:bg-[#FFD700]/80 text-[#1A1A1B] px-6 py-3 rounded-lg font-bold transition-colors">
                            <Phone className="h-5 w-5" /> Call Now
                        </a>
                        <Link to="/inquiries" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg font-bold transition-colors border border-[#FFD700]/40">
                            <Mail className="h-5 w-5" /> Submit Inquiry
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AIRiskAssessment;
