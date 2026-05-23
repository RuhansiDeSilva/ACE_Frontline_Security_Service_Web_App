import { useState } from "react";
import { clientApi } from "@/lib/api";
import type { SuccessData } from "@/utils/client";
import { ArrowLeft, Building2, CircleDollarSign, MapPin, Shield, User } from "lucide-react";

interface ClientRegistrationProps {
    onBack: () => void;
    onSuccess: (data: SuccessData) => void;
}

type RegisterForm = {
    companyName: string;
    companyRegistrationNo: string;
    vatNumber: string;
    industryType: string;
    address: string;
    serviceLocation: string;
    city: string;
    contactPersonName: string;
    contactPersonDesignation: string;
    contactPersonEmail: string;
    contactPersonPhone: string;
    serviceStartDate: string;
    contractDurationMonths: string;

    // 4-Tier Staffing Model
    entryLevelCount: string;
    midLevelCount: string;
    specializedCount: string;
    supervisorCount: string;

    entryLevelRatePerShift: string;
    midLevelRatePerShift: string;
    specializedRatePerShift: string;
    supervisorRatePerShift: string;

    otRatePerHour: string;
    entryLevelOtRatePerHour: string;
    midLevelOtRatePerHour: string;
    specializedOtRatePerHour: string;
    supervisorOtRatePerHour: string;

    riskLevel: string;
    recommendedOfficers: string;
};

const emptyForm: RegisterForm = {
    companyName: "", companyRegistrationNo: "", vatNumber: "", industryType: "",
    address: "", serviceLocation: "", city: "",
    contactPersonName: "", contactPersonDesignation: "", contactPersonEmail: "", contactPersonPhone: "",
    serviceStartDate: "", contractDurationMonths: "12",

    entryLevelCount: "0", midLevelCount: "0", specializedCount: "0", supervisorCount: "0",
    entryLevelRatePerShift: "0", midLevelRatePerShift: "0", specializedRatePerShift: "0", supervisorRatePerShift: "0",

    otRatePerHour: "0",
    entryLevelOtRatePerHour: "0", midLevelOtRatePerHour: "0", specializedOtRatePerHour: "0", supervisorOtRatePerHour: "0",

    riskLevel: "LOW", recommendedOfficers: "",
};

const TABS = [
    { label: "Company Info", icon: Building2, sectionId: "section-company" },
    { label: "Contact", icon: User, sectionId: "section-contact" },
    { label: "Deployment", icon: MapPin, sectionId: "section-deployment" },
    { label: "Rates", icon: CircleDollarSign, sectionId: "section-rates" },
    { label: "AI Risk", icon: Shield, sectionId: "section-ai-risk" },
];

const ClientRegistration = ({ onBack, onSuccess }: ClientRegistrationProps) => {
    const [activeTab, setActiveTab] = useState(0);
    const [form, setForm] = useState<RegisterForm>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        setFormError("");
        if (errors[name as keyof RegisterForm]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[name as keyof RegisterForm];
                return next;
            });
        }
    };

    const validate = () => {
        const newErrors: Partial<Record<keyof RegisterForm, string>> = {};
        if (!form.companyName.trim()) newErrors.companyName = "Company name is required";
        if (!form.serviceLocation.trim()) newErrors.serviceLocation = "Service location is required";
        if (!form.contactPersonName.trim()) newErrors.contactPersonName = "Contact person name is required";

        if (!form.contactPersonEmail.trim()) {
            newErrors.contactPersonEmail = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactPersonEmail)) {
            newErrors.contactPersonEmail = "Invalid email format";
        }

        if (!form.contactPersonPhone.trim()) {
            newErrors.contactPersonPhone = "Phone number is required";
        } else if (!/^(\+\d{1,3}[- ]?)?\d{10}$/.test(form.contactPersonPhone.replace(/\s/g, ''))) {
            newErrors.contactPersonPhone = "Invalid phone number (e.g. +94XXXXXXXXX or 10 digits)";
        }

        if (!form.serviceStartDate) newErrors.serviceStartDate = "Service start date is required";
        if (Number(form.contractDurationMonths) < 1) newErrors.contractDurationMonths = "Min duration is 1 month";

        const totalStrength =
            Number(form.entryLevelCount) +
            Number(form.midLevelCount) +
            Number(form.specializedCount) +
            Number(form.supervisorCount);

        if (totalStrength === 0) {
            newErrors.entryLevelCount = "At least one officer category must have a strength > 0";
        }

        // Validate rates if count > 0
        const categories = [
            { id: 'entryLevel', label: 'Entry-level' },
            { id: 'midLevel', label: 'Mid-level' },
            { id: 'specialized', label: 'Specialized' },
            { id: 'supervisor', label: 'Supervisor' }
        ];

        categories.forEach(cat => {
            const count = Number((form as any)[`${cat.id}Count`]);
            const rate = Number((form as any)[`${cat.id}RatePerShift`]);
            const otRate = Number((form as any)[`${cat.id}OtRatePerHour`]);

            if (count > 0) {
                if (rate < 0) (newErrors as any)[`${cat.id}RatePerShift`] = `${cat.label} rate must be >= 0`;
                if (otRate < 0) (newErrors as any)[`${cat.id}OtRatePerHour`] = `${cat.label} OT rate must be >= 0`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            setFormError("Please correct the highlighted errors before submitting.");
            // Scroll to top or first error
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        setSubmitting(true);
        setFormError("");
        try {
            const payload = {
                ...form,
                contractDurationMonths: Number(form.contractDurationMonths),
                entryLevelCount: Number(form.entryLevelCount),
                midLevelCount: Number(form.midLevelCount),
                specializedCount: Number(form.specializedCount),
                supervisorCount: Number(form.supervisorCount),
                entryLevelRatePerShift: Number(form.entryLevelRatePerShift),
                midLevelRatePerShift: Number(form.midLevelRatePerShift),
                specializedRatePerShift: Number(form.specializedRatePerShift),
                supervisorRatePerShift: Number(form.supervisorRatePerShift),
                otRatePerHour: Number(form.otRatePerHour),
                entryLevelOtRatePerHour: Number(form.entryLevelOtRatePerHour),
                midLevelOtRatePerHour: Number(form.midLevelOtRatePerHour),
                specializedOtRatePerHour: Number(form.specializedOtRatePerHour),
                supervisorOtRatePerHour: Number(form.supervisorOtRatePerHour),
                recommendedOfficers: Number(form.recommendedOfficers),
            };

            const data = await clientApi.register(payload);
            onSuccess({
                companyName: data.companyName,
                username: data.username,
                temporaryPassword: (data as { temporaryPassword?: string }).temporaryPassword,
                contactPersonEmail: data.contactPersonEmail,
            });
        } catch (e: any) {
            console.error("Registration error:", e);
            if (e?.validationErrors && Array.isArray(e.validationErrors)) {
                // Map backend field errors to frontend error state
                const backendErrors: Partial<Record<keyof RegisterForm, string>> = {};
                e.validationErrors.forEach((err: string) => {
                    const [field, ...messageParts] = err.split(": ");
                    const message = messageParts.join(": ");
                    if (field in form) {
                        (backendErrors as any)[field] = message;
                    }
                });
                setErrors(backendErrors);
                setFormError("The server found some issues with your input. Please check the fields below.");
            } else {
                setFormError(e?.message || "Registration failed. Please try again.");
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = "w-full border border-input bg-muted/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
    const labelClass = "block text-xs font-bold text-foreground mb-1.5";

    // Risk score mock
    const riskScore = form.riskLevel === "LOW" ? 25 : form.riskLevel === "MEDIUM" ? 60 : 90;
    const riskLabel = form.riskLevel === "LOW" ? "LOW RISK" : form.riskLevel === "MEDIUM" ? "MEDIUM RISK" : "HIGH RISK";
    const riskTone =
        riskScore < 40
            ? { badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" }
            : riskScore < 75
                ? { badge: "bg-amber-100 text-amber-700", bar: "bg-amber-500" }
                : { badge: "bg-orange-100 text-orange-700", bar: "bg-orange-500" };

    return (
        <div className="mx-auto w-full max-w-4xl space-y-8 pb-6">
            {/* Header */}
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Client List
                </button>
                <h1 className="text-3xl font-black tracking-tight">Client Registration</h1>
                <p className="text-muted-foreground mt-1">Onboard a new corporate partner to the security management ecosystem.</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {TABS.map((tab, i) => (
                    <button
                        key={tab.label}
                        onClick={() => {
                            setActiveTab(i);
                            document.getElementById(tab.sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${i === activeTab
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-card border text-muted-foreground hover:bg-muted"
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {formError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm">
                    ⚠ {formError}
                </div>
            )}

            {/* All sections rendered, scroll-style single page like screen-3 */}
            <div className="space-y-8">
                {/* Company Info */}
                <section id="section-company" className="bg-card rounded-2xl border shadow-sm p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Company Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Company Name *</label>
                            <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="e.g. Global Tech Solutions" className={`${inputClass} ${errors.companyName ? 'border-destructive ring-destructive/20' : ''}`} />
                            {errors.companyName && <p className="text-[10px] text-destructive mt-1 font-bold">{errors.companyName}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>Registration Number</label>
                            <input name="companyRegistrationNo" value={form.companyRegistrationNo} onChange={handleChange} placeholder="CR-2024-XXXX" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>VAT Number</label>
                            <input name="vatNumber" value={form.vatNumber} onChange={handleChange} placeholder="VAT-123456789" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Industry Type</label>
                            <select name="industryType" value={form.industryType} onChange={handleChange} className={inputClass}>
                                <option value="">Select industry...</option>
                                <option>Banking & Finance</option>
                                <option>Apparel</option>
                                <option>Commercial Real Estate</option>
                                <option>Retail & Supermarkets</option>
                                <option>Manufacturing</option>
                                <option>Healthcare</option>
                                <option>Education</option>
                                <option>Hospitality & Hotels</option>
                                <option>Logistics & Warehousing</option>
                                <option>Construction</option>
                                <option>Technology</option>
                                <option>Government</option>
                                <option>Energy & Utilities</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Registered Address</label>
                            <textarea name="address" value={form.address} onChange={handleChange} placeholder="Enter full legal address" rows={3} className={inputClass} />
                        </div>
                    </div>
                </section>

                {/* Contact */}
                <section id="section-contact" className="bg-card rounded-2xl border shadow-sm p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Primary Contact Person
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Full Name *</label>
                            <input name="contactPersonName" value={form.contactPersonName} onChange={handleChange} placeholder="Enter contact name" className={`${inputClass} ${errors.contactPersonName ? 'border-destructive ring-destructive/20' : ''}`} />
                            {errors.contactPersonName && <p className="text-[10px] text-destructive mt-1 font-bold">{errors.contactPersonName}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>Designation</label>
                            <input name="contactPersonDesignation" value={form.contactPersonDesignation} onChange={handleChange} placeholder="e.g. Facilities Manager" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Email Address *</label>
                            <input name="contactPersonEmail" type="email" value={form.contactPersonEmail} onChange={handleChange} placeholder="email@company.com" className={`${inputClass} ${errors.contactPersonEmail ? 'border-destructive ring-destructive/20' : ''}`} />
                            {errors.contactPersonEmail && <p className="text-[10px] text-destructive mt-1 font-bold">{errors.contactPersonEmail}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>Phone Number *</label>
                            <input name="contactPersonPhone" value={form.contactPersonPhone} onChange={handleChange} placeholder="+1 (555) 000-0000" className={`${inputClass} ${errors.contactPersonPhone ? 'border-destructive ring-destructive/20' : ''}`} />
                            {errors.contactPersonPhone && <p className="text-[10px] text-destructive mt-1 font-bold">{errors.contactPersonPhone}</p>}
                        </div>
                    </div>
                </section>

                {/* Deployment */}
                <section id="section-deployment" className="bg-card rounded-2xl border shadow-sm p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Service & Deployment Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Service Location (Deployment Address) *</label>
                            <input name="serviceLocation" value={form.serviceLocation} onChange={handleChange} placeholder="Physical deployment address" className={`${inputClass} ${errors.serviceLocation ? 'border-destructive ring-destructive/20' : ''}`} />
                            {errors.serviceLocation && <p className="text-[10px] text-destructive mt-1 font-bold">{errors.serviceLocation}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>City</label>
                            <input name="city" value={form.city} onChange={handleChange} placeholder="City name" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Service Start Date *</label>
                            <input name="serviceStartDate" type="date" value={form.serviceStartDate} onChange={handleChange} className={`${inputClass} ${errors.serviceStartDate ? 'border-destructive ring-destructive/20' : ''}`} />
                            {errors.serviceStartDate && <p className="text-[10px] text-destructive mt-1 font-bold">{errors.serviceStartDate}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>Contract Duration (Months)</label>
                            <input name="contractDurationMonths" type="number" min="1" value={form.contractDurationMonths} onChange={handleChange} className={`${inputClass} ${errors.contractDurationMonths ? 'border-destructive ring-destructive/20' : ''}`} />
                            {errors.contractDurationMonths && <p className="text-[10px] text-destructive mt-1 font-bold">{errors.contractDurationMonths}</p>}
                        </div>
                    </div>
                </section>

                {/* Staffing & Rates */}
                <section id="section-rates" className="bg-card rounded-2xl border shadow-sm p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <CircleDollarSign className="h-5 w-5 text-primary" />
                        Staffing Requirements & Rates
                    </h3>
                    <div className="space-y-6">
                        {/* Headers */}
                        <div className="hidden md:grid grid-cols-4 gap-6 px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Officer Category</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Strength</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Rate (Per Shift)</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">OT Rate (Per Hr)</span>
                        </div>

                        {[
                            { id: 'entryLevel', label: 'Entry-level' },
                            { id: 'midLevel', label: 'Mid-level' },
                            { id: 'specialized', label: 'Specialized' },
                            { id: 'supervisor', label: 'Supervisor/Management' }
                        ].map((category) => (
                            <div key={category.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-muted/20 p-4 rounded-xl border border-border/40">
                                <div className="font-bold text-sm text-foreground">{category.label}</div>
                                <div>
                                    <label className="md:hidden text-[10px] font-black uppercase text-muted-foreground mb-1 block">Strength</label>
                                    <input
                                        name={`${category.id}Count`}
                                        type="number"
                                        min="0"
                                        value={(form as any)[`${category.id}Count`]}
                                        onChange={handleChange}
                                        className={`${inputClass} ${(errors as any)[`${category.id}Count`] ? 'border-destructive ring-destructive/20' : ''}`}
                                    />
                                    {(errors as any)[`${category.id}Count`] && <p className="text-[10px] text-destructive mt-1 font-bold">{(errors as any)[`${category.id}Count`]}</p>}
                                </div>
                                <div>
                                    <label className="md:hidden text-[10px] font-black uppercase text-muted-foreground mb-1 block">Rate (Shift)</label>
                                    <input
                                        name={`${category.id}RatePerShift`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={(form as any)[`${category.id}RatePerShift`]}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className={`${inputClass} ${(errors as any)[`${category.id}RatePerShift`] ? 'border-destructive ring-destructive/20' : ''}`}
                                    />
                                    {(errors as any)[`${category.id}RatePerShift`] && <p className="text-[10px] text-destructive mt-1 font-bold">{(errors as any)[`${category.id}RatePerShift`]}</p>}
                                </div>
                                <div>
                                    <label className="md:hidden text-[10px] font-black uppercase text-muted-foreground mb-1 block">OT Rate (Hr)</label>
                                    <input
                                        name={`${category.id}OtRatePerHour`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={(form as any)[`${category.id}OtRatePerHour`]}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className={`${inputClass} ${(errors as any)[`${category.id}OtRatePerHour`] ? 'border-destructive ring-destructive/20' : ''}`}
                                    />
                                    {(errors as any)[`${category.id}OtRatePerHour`] && <p className="text-[10px] text-destructive mt-1 font-bold">{(errors as any)[`${category.id}OtRatePerHour`]}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* AI Risk */}
                <section id="section-ai-risk" className="rounded-2xl border border-amber-200/80 bg-[#f7f3e3] dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 dark:border-amber-400/20 shadow-sm p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Shield className="h-5 w-5 text-amber-500 dark:text-amber-300" />
                        <span className="text-amber-500 dark:text-amber-300">AI Risk Integration</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Risk gauge card */}
                        <div className="bg-card dark:bg-zinc-900/70 rounded-xl border border-border/80 dark:border-amber-400/15 p-6 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Calculated Risk Level</p>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${riskTone.badge}`}>
                                    {riskLabel}
                                </span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-black text-amber-500">{riskScore}</span>
                                <span className="text-muted-foreground mb-1">/ 100</span>
                            </div>
                            <div className="h-2 bg-muted/70 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${riskTone.bar}`}
                                    style={{ width: `${riskScore}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground italic">*Based on industry type and location historical data.</p>

                            <select name="riskLevel" value={form.riskLevel} onChange={handleChange} className={inputClass}>
                                <option value="LOW">Low Risk</option>
                                <option value="MEDIUM">Medium Risk</option>
                                <option value="HIGH">High Risk</option>
                            </select>
                        </div>

                        {/* Staffing Summary */}
                        <div className="bg-card dark:bg-zinc-900/70 rounded-xl border border-border/80 dark:border-amber-400/15 p-6 space-y-4 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Staffing Summary</p>
                            <div className="space-y-3">
                                {[
                                    { label: 'Entry-level', val: form.entryLevelCount },
                                    { label: 'Mid-level', val: form.midLevelCount },
                                    { label: 'Specialized', val: form.specializedCount },
                                    { label: 'Supervisor', val: form.supervisorCount }
                                ].map(cat => (
                                    <div key={cat.label} className="flex justify-between">
                                        <span className="text-sm">{cat.label}</span>
                                        <span className="font-bold text-amber-500">{String(Number(cat.val) || 0).padStart(2, "0")}</span>
                                    </div>
                                ))}
                                <div className="border-t pt-3 flex justify-between">
                                    <span className="text-sm font-semibold">Total Staffing</span>
                                    <span className="text-2xl font-black">
                                        {String(
                                            Number(form.entryLevelCount) +
                                            Number(form.midLevelCount) +
                                            Number(form.specializedCount) +
                                            Number(form.supervisorCount)
                                        ).padStart(2, "0")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-4 pb-8">
                <button onClick={onBack} className="px-6 py-3 border rounded-xl font-semibold text-sm hover:bg-muted transition-colors">
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-colors text-sm disabled:opacity-60 shadow-lg shadow-primary/20"
                >
                    {submitting ? "Registering..." : "Register Client"}
                </button>
            </div>
        </div>
    );
};

export default ClientRegistration;
