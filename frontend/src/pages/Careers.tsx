import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { User, Briefcase, ChevronDown, Upload, X, Shield, Award, Users, CheckCircle, MapPin, Star, Clock, Send, FileText, Phone, Mail, AlertCircle, Home, GraduationCap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
// import logoImage from "@/assets/logo.png"; // Logo removed for public repo
import heroImage from "@/assets/hero-security.jpg";

interface Vacancy {
  id: number;
  jobTitle: string;
  description?: string;
  requirements?: string;
  experienceLevel?: string;
  location?: string;
  minSalary?: number;
  maxSalary?: number;
  status?: string;
}

interface FormErrors {
  [key: string]: string;
}

const SRI_LANKAN_PHONE = /^(?:0|\+94|0094)?7[0-9]{8}$/;
const NIC_OLD = /^[0-9]{9}[VvXx]$/;
const NIC_NEW = /^[0-9]{12}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z\s.'-]{3,}$/;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const FieldError = ({ error }: { error?: string }) =>
  error ? (
    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3" /> {error}
    </p>
  ) : null;

const benefits = [
  { icon: Shield, title: "Professional Training", desc: "Comprehensive security training programs by ex-military instructors" },
  { icon: Award, title: "Career Growth", desc: "Clear promotion pathways and leadership development opportunities" },
  { icon: Users, title: "Team Culture", desc: "Join a disciplined, supportive team of 500+ security professionals" },
  { icon: CheckCircle, title: "Full Benefits", desc: "EPF/ETF contributions, insurance coverage, and competitive salary" },
];

const Careers = () => {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedJob, setSelectedJob] = useState<Vacancy | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  const [declaration, setDeclaration] = useState(false);
  const vacanciesRef = useRef<HTMLDivElement>(null);
  const cvSectionRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // CV form state
  const [showCvForm, setShowCvForm] = useState(false);
  const [cvFormFile, setCvFormFile] = useState<File | null>(null);
  const cvFormInputRef = useRef<HTMLInputElement>(null);
  const [cvSubmitting, setCvSubmitting] = useState(false);

  // Validation state
  const [appErrors, setAppErrors] = useState<FormErrors>({});
  const [cvErrors, setCvErrors] = useState<FormErrors>({});

  const validateApplicationForm = useCallback((form: HTMLFormElement, cv: File | null, declared: boolean): FormErrors => {
    const errors: FormErrors = {};
    const fullName = (form.elements.namedItem("fullName") as HTMLInputElement).value.trim();
    const nic = (form.elements.namedItem("nic") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    const address = (form.elements.namedItem("address") as HTMLTextAreaElement).value.trim();

    if (!fullName) errors.fullName = "Full name is required";
    else if (!NAME_REGEX.test(fullName)) errors.fullName = "Enter a valid name (min 3 letters)";

    if (!nic) errors.nic = "NIC number is required";
    else if (!NIC_OLD.test(nic) && !NIC_NEW.test(nic)) errors.nic = "Enter a valid NIC (e.g. 200012345678 or 912345678V)";

    if (!email) errors.email = "Email is required";
    else if (!EMAIL_REGEX.test(email)) errors.email = "Enter a valid email address";

    if (!phone) errors.phone = "Phone number is required";
    else if (!SRI_LANKAN_PHONE.test(phone.replace(/[\s-]/g, ""))) errors.phone = "Enter a valid phone number (e.g. 0771234567)";

    if (!address) errors.address = "Address is required";
    else if (address.length < 10) errors.address = "Address must be at least 10 characters";

    if (!cv) errors.cvFile = "Please upload your CV (PDF)";
    else if (cv.size > MAX_FILE_SIZE) errors.cvFile = "CV file must be under 10MB";
    else if (!cv.name.toLowerCase().endsWith(".pdf")) errors.cvFile = "Only PDF files are accepted";

    if (!declared) errors.declaration = "You must agree to the declaration to proceed";

    return errors;
  }, []);

  const validateCvForm = useCallback((form: HTMLFormElement, cv: File | null): FormErrors => {
    const errors: FormErrors = {};
    const fullName = (form.elements.namedItem("cvFullName") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("cvEmail") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("cvPhone") as HTMLInputElement).value.trim();

    if (!fullName) errors.cvFullName = "Full name is required";
    else if (!NAME_REGEX.test(fullName)) errors.cvFullName = "Enter a valid name (min 3 letters)";

    if (!email) errors.cvEmail = "Email is required";
    else if (!EMAIL_REGEX.test(email)) errors.cvEmail = "Enter a valid email address";

    if (!phone) errors.cvPhone = "Phone number is required";
    else if (!SRI_LANKAN_PHONE.test(phone.replace(/[\s-]/g, ""))) errors.cvPhone = "Enter a valid phone number (e.g. 0771234567)";

    if (!cv) errors.cvFile = "Please upload your CV";
    else if (cv.size > MAX_FILE_SIZE) errors.cvFile = "CV file must be under 10MB";

    return errors;
  }, []);

  const handleApply = (job: Vacancy) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
    setCvFile(null);
    setCertFile(null);
    setAppErrors({});
    setDeclaration(false);
  };

  useEffect(() => {
    fetch("/api/public/vacancies")
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.data)) {
          setVacancies((data.data as Vacancy[]).filter(v => v.status === "OPEN"));
        }
      })
      .catch(() => {});
  }, []);

  const scrollToVacancies = () => {
    vacanciesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedJob) return;
    const form = e.target as HTMLFormElement;

    // Validate
    const errors = validateApplicationForm(form, cvFile, declaration);
    setAppErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast({ title: "Validation Error", description: "Please fix the highlighted fields.", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("fullName", (form.elements.namedItem("fullName") as HTMLInputElement).value.trim());
    formData.append("nic", (form.elements.namedItem("nic") as HTMLInputElement).value.trim());
    formData.append("email", (form.elements.namedItem("email") as HTMLInputElement).value.trim());
    formData.append("phoneNumber", (form.elements.namedItem("phone") as HTMLInputElement).value.trim());
    formData.append("address", (form.elements.namedItem("address") as HTMLTextAreaElement).value.trim());
    formData.append("experience", (form.elements.namedItem("experience") as HTMLTextAreaElement).value.trim());
    formData.append("vacancyId", String(selectedJob.id));
    if (cvFile) formData.append("cvFile", cvFile);
    if (certFile) formData.append("certificateFile", certFile);

    try {
      const response = await fetch("/api/applications/apply", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = data?.message || "Submission failed";
        throw new Error(msg);
      }
      toast({
        title: "Application Submitted",
        description: `Your application for ${selectedJob?.jobTitle} has been received. We'll contact you soon.`,
      });
    } catch (err: any) {
      toast({
        title: "Submission Error",
        description: err?.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    }
    setIsDialogOpen(false);
    setSelectedJob(null);
    setCvFile(null);
    setCertFile(null);
    setAppErrors({});
  };

  const handleCvFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    // Validate
    const errors = validateCvForm(form, cvFormFile);
    setCvErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast({ title: "Validation Error", description: "Please fix the highlighted fields.", variant: "destructive" });
      return;
    }

    setCvSubmitting(true);
    const formData = new FormData();
    formData.append("fullName", (form.elements.namedItem("cvFullName") as HTMLInputElement).value.trim());
    formData.append("email", (form.elements.namedItem("cvEmail") as HTMLInputElement).value.trim());
    formData.append("phoneNumber", (form.elements.namedItem("cvPhone") as HTMLInputElement).value.trim());
    formData.append("cvFile", cvFormFile!);

    try {
      const response = await fetch("/api/cv-submissions/submit", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Submission failed");
      }
      toast({
        title: "CV Submitted Successfully!",
        description: "Thank you for your interest. We'll review your CV and get back to you.",
      });
      setShowCvForm(false);
      setCvFormFile(null);
      setCvErrors({});
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      toast({
        title: "Submission Error",
        description: err?.message || "Failed to submit CV. Please try again.",
        variant: "destructive",
      });
    }
    setCvSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <nav className="flex items-center gap-8 ml-auto">
              <Link to="/" className="text-black dark:text-white hover:text-yellow-400 dark:hover:text-primary transition-colors font-semibold text-sm">
                Home
              </Link>
              <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/?scroll=services'; }} className="text-black dark:text-white hover:text-yellow-400 dark:hover:text-primary transition-colors font-semibold text-sm cursor-pointer">
                Services
              </a>
              <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/?scroll=about-us'; }} className="text-black dark:text-white hover:text-yellow-400 dark:hover:text-primary transition-colors font-semibold text-sm cursor-pointer">
                About Us
              </a>
              <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/?scroll=clients'; }} className="text-black dark:text-white hover:text-yellow-400 dark:hover:text-primary transition-colors font-semibold text-sm cursor-pointer">
                Clients
              </a>
              <Link to="/careers" className="text-yellow-400 dark:text-primary font-semibold text-sm">
                Careers
              </Link>
              <Link to="/inquiries" className="text-black dark:text-white hover:text-yellow-400 dark:hover:text-primary transition-colors font-semibold text-sm">
                Inquiries
              </Link>
              <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/?scroll=contact'; }} className="text-black dark:text-white hover:text-yellow-400 dark:hover:text-primary transition-colors font-semibold text-sm cursor-pointer">
                Contact
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Dark gradient like home page */}
      <section className="relative w-full">
        <div className="relative min-h-[550px] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src={heroImage} alt="Security team" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1B]/95 via-[#1A1A1B]/80 to-[#1A1A1B]/60" />
          </div>

          {/* Animated decorative elements */}
          <div className="absolute top-20 right-20 w-72 h-72 bg-[#FFD700]/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#FFD700]/10 rounded-full blur-2xl" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-2xl flex flex-col gap-6"
            >
              <div className="inline-flex items-center gap-2 bg-[#FFD700]/30 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#FFD700]/30 w-fit">
                <Users className="h-4 w-4 text-[#FFD700]" />
                <span className="text-[#FFD700] text-xs font-bold uppercase tracking-widest">Now Hiring</span>
              </div>

              <h1 className="text-white text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                Join Our <span className="text-[#FFD700]">Security</span> Team
              </h1>

              <p className="text-white/70 text-lg md:text-xl font-normal max-w-lg leading-relaxed">
                Be part of Sri Lanka's most trusted private security provider. We offer professional
                training, career growth, and the opportunity to protect what matters most.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Button variant="hero" size="xl" onClick={scrollToVacancies} className="bg-[#FFD700] hover:bg-[#FFD700]/80 text-white">
                  View Vacancies <ChevronDown className="h-5 w-5 ml-1" />
                </Button>
                <Button
                  variant="heroOutline"
                  size="xl"
                  className="text-white border-[#FFD700]/40 hover:bg-[#FFD700]/10"
                  onClick={() => cvSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                >
                  <Send className="h-4 w-4 mr-2" /> Send Your CV
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats bar - overlapping hero */}
      <div className="relative z-20 -mt-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-card p-6 rounded-xl shadow-2xl border"
        >
          {[
            { value: "500+", label: "Team Members" },
            { value: "50+", label: "Client Sites" },
            { value: "24/7", label: "Operations" },
            { value: "9Y+", label: "Experience" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center justify-center text-center p-3">
              <span className={`text-2xl md:text-3xl font-black ${i % 2 === 0 ? "text-foreground" : "text-[#1A1A1B]"}`}>{s.value}</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Why Join Us section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-[#1A1A1B] text-sm font-black uppercase tracking-[0.3em] mb-3">Why Join Us</h2>
          <p className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Build Your Career With Us</p>
          <div className="w-20 h-1.5 bg-[#1A1A1B] mx-auto mt-6 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-card p-6 rounded-xl border hover:border-[#FFD700]/50 hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className="h-14 w-14 rounded-lg bg-[#F4F7F6] flex items-center justify-center mx-auto mb-4 group-hover:bg-[#1A1A1B] group-hover:text-white transition-all">
                <b.icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Vacancies Section */}
      <section ref={vacanciesRef} className="bg-[#F4F7F6] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-[#1A1A1B] text-sm font-black uppercase tracking-[0.3em] mb-3">Opportunities</h2>
            <p className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Open Positions</p>
            <div className="w-20 h-1.5 bg-[#1A1A1B] mx-auto mt-6 rounded-full" />
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mt-4">
              Explore our current vacancies and find the role that matches your skills and ambition.
            </p>
          </div>

          {vacancies.length === 0 && (
            <p className="text-center text-muted-foreground">No open vacancies at the moment. Send us your CV below!</p>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vacancies.map((job, i) => {
              const reqs = job.requirements ? job.requirements.split("\n").filter(Boolean) : [];
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 border-border hover:border-[#FFD700]/50 flex flex-col h-full">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="h-12 w-12 rounded-lg bg-[#1A1A1B]/10 flex items-center justify-center group-hover:bg-[#1A1A1B] group-hover:text-white transition-all">
                          <Briefcase className="h-6 w-6" />
                        </div>
                        {job.experienceLevel && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#1A1A1B]/10 text-[#1A1A1B] px-2.5 py-1 rounded-full">
                            {job.experienceLevel}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-xl font-bold text-foreground mt-3">{job.jobTitle}</CardTitle>
                      {job.location && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1">
                      {reqs.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-bold text-foreground mb-2.5 uppercase tracking-wider">Requirements</h4>
                          <ul className="space-y-1.5">
                            {reqs.slice(0, 4).map((req, ri) => (
                              <li key={ri} className="text-sm text-muted-foreground flex items-start gap-2">
                                <CheckCircle className="h-3.5 w-3.5 text-[#388E3C] mt-0.5 shrink-0" />
                                {req}
                              </li>
                            ))}
                            {reqs.length > 4 && (
                              <li className="text-xs text-muted-foreground/70 pl-5">+{reqs.length - 4} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                      <div className="mt-auto pt-4">
                        <Button className="w-full bg-[#1A1A1B] hover:bg-[#FFD700] hover:text-[#1A1A1B] text-white font-bold" onClick={() => handleApply(job)}>
                          Apply Now <ChevronDown className="h-4 w-4 ml-1 -rotate-90" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Send Your CV Section */}
      <section ref={cvSectionRef} className="bg-white dark:bg-[#1A1A1B] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left - info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-yellow-400 dark:text-[#FFD700] text-sm font-black uppercase tracking-[0.3em] mb-3">Don't See Your Role?</h2>
              <h3 className="text-3xl md:text-4xl font-black text-black dark:text-white leading-tight mb-6">
                Send Us Your <span className="text-yellow-400 dark:text-[#FFD700]">CV</span>
              </h3>
              <p className="text-gray-600 dark:text-white/60 text-lg leading-relaxed mb-8">
                We're always looking for talented, disciplined individuals to join our growing team.
                Even if there's no current vacancy that fits your profile, submit your CV and we'll
                keep it on file for future opportunities.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  "Quick and easy submission process",
                  "Your CV will be reviewed by our HR team",
                  "We'll contact you when a matching role opens",
                  "All information is kept strictly confidential",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-black dark:text-white">
                    <CheckCircle className="h-5 w-5 text-[#388E3C] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {!showCvForm && (
                <Button variant="hero" size="xl" onClick={() => setShowCvForm(true)} className="bg-[#FFD700] hover:bg-[#FFD700]/80 text-white">
                  <Send className="h-5 w-5 mr-2" /> Send Your CV
                </Button>
              )}
            </motion.div>

            {/* Right - form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {showCvForm ? (
                <Card className="shadow-2xl border-[#FFD700]/30">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" /> Submit Your CV
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCvFormSubmit} className="space-y-4" noValidate>
                      <div className="space-y-1.5">
                        <Label htmlFor="cvFullName">Full Name *</Label>
                        <Input id="cvFullName" name="cvFullName" placeholder="Enter your full name" maxLength={100} className={cvErrors.cvFullName ? "border-destructive" : ""} onChange={() => setCvErrors(prev => { const { cvFullName, ...rest } = prev; return rest; })} />
                        <FieldError error={cvErrors.cvFullName} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cvEmail">Email Address *</Label>
                        <Input id="cvEmail" name="cvEmail" type="email" placeholder="you@example.com" maxLength={255} className={cvErrors.cvEmail ? "border-destructive" : ""} onChange={() => setCvErrors(prev => { const { cvEmail, ...rest } = prev; return rest; })} />
                        <FieldError error={cvErrors.cvEmail} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cvPhone">Phone Number *</Label>
                        <Input id="cvPhone" name="cvPhone" type="tel" placeholder="0771234567" maxLength={15} className={cvErrors.cvPhone ? "border-destructive" : ""} onChange={() => setCvErrors(prev => { const { cvPhone, ...rest } = prev; return rest; })} />
                        <FieldError error={cvErrors.cvPhone} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Upload CV (PDF/DOC) *</Label>
                        <input
                          ref={cvFormInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => { setCvFormFile(e.target.files?.[0] || null); setCvErrors(prev => { const { cvFile, ...rest } = prev; return rest; }); }}
                        />
                        <div
                          onClick={() => cvFormInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/30 ${cvErrors.cvFile ? "border-destructive" : "border-input"}`}
                        >
                          {cvFormFile ? (
                            <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                              <FileText className="h-5 w-5 text-primary" />
                              <span className="truncate max-w-[200px] font-medium">{cvFormFile.name}</span>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setCvFormFile(null); }} className="text-muted-foreground hover:text-destructive">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Upload className="h-8 w-8" />
                              <span className="text-sm font-medium">Click to upload your CV</span>
                              <span className="text-xs">PDF, DOC or DOCX (max 10MB)</span>
                            </div>
                          )}
                        </div>
                        <FieldError error={cvErrors.cvFile} />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button type="submit" className="flex-1" size="lg" disabled={cvSubmitting}>
                          {cvSubmitting ? "Submitting..." : "Submit CV"}
                        </Button>
                        <Button type="button" variant="outline" size="lg" onClick={() => { setShowCvForm(false); setCvFormFile(null); }}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <div className="bg-gray-200 dark:bg-card/50 backdrop-blur-sm border border-dashed border-yellow-400 dark:border-[#FFD700]/40 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                  <div className="h-20 w-20 rounded-full bg-yellow-200 dark:bg-[#FFD700]/20 flex items-center justify-center mb-6">
                    <Send className="h-10 w-10 text-yellow-400 dark:text-[#FFD700]" />
                  </div>
                  <h4 className="text-xl font-bold text-black dark:text-foreground mb-2">Ready to Apply?</h4>
                  <p className="text-gray-700 dark:text-[#1A1A1B] font-medium mb-6 max-w-sm">
                    Click the button to open the submission form and send us your CV today.
                  </p>
                  <Button variant="default" size="lg" onClick={() => setShowCvForm(true)}>
                    <Send className="h-4 w-4 mr-2" /> Open Form
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="bg-gray-100 dark:bg-[#1A1A1B] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 dark:text-[#FFD700]/50 text-sm">
            © 2026 Ace Front Line Security Solutions (Pvt) Ltd. All rights reserved.
          </p>
        </div>
      </section>

      {/* Application Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {/* Dialog Header */}
          <div className="bg-[#1A1A1B] px-6 py-5 text-center rounded-t-lg">
            {/* Logo image removed for public repo */}
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-bold text-white tracking-wide">Security Officer Application Form</DialogTitle>
              <DialogDescription className="text-[#FFD700]/70 text-xs">
                Apply for: <span className="font-semibold text-[#FFD700]">{selectedJob?.jobTitle}</span>. Please complete the form below with accurate details.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-5" noValidate>
            {/* Section: Personal Information */}
            <div className="bg-muted/30 border rounded-xl p-5 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground">
                <User className="h-4 w-4" /> Personal Information
              </h3>
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name (as per NIC) *</Label>
                <Input id="fullName" name="fullName" placeholder="Enter your full legal name" maxLength={100} className={appErrors.fullName ? "border-destructive" : ""} onChange={() => setAppErrors(prev => { const { fullName, ...rest } = prev; return rest; })} />
                <FieldError error={appErrors.fullName} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nic" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">NIC Number *</Label>
                <Input id="nic" name="nic" placeholder="e.g. 200012345678 or 912345678V" maxLength={12} className={appErrors.nic ? "border-destructive" : ""} onChange={() => setAppErrors(prev => { const { nic, ...rest } = prev; return rest; })} />
                <FieldError error={appErrors.nic} />
              </div>
            </div>

            {/* Section: Contact Details */}
            <div className="bg-muted/30 border rounded-xl p-5 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground">
                <Home className="h-4 w-4" /> Contact Details
              </h3>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Permanent Address *</Label>
                <Textarea id="address" name="address" placeholder="Enter your full home address" maxLength={500} className={`min-h-[60px] ${appErrors.address ? "border-destructive" : ""}`} onChange={() => setAppErrors(prev => { const { address, ...rest } = prev; return rest; })} />
                <FieldError error={appErrors.address} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mobile Number *</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">+94</span>
                    <Input id="phone" name="phone" type="tel" placeholder="7X XXX XXXX" maxLength={15} className={`rounded-l-none ${appErrors.phone ? "border-destructive" : ""}`} onChange={() => setAppErrors(prev => { const { phone, ...rest } = prev; return rest; })} />
                  </div>
                  <FieldError error={appErrors.phone} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address *</Label>
                  <Input id="email" name="email" type="email" placeholder="email@example.com" maxLength={255} className={appErrors.email ? "border-destructive" : ""} onChange={() => setAppErrors(prev => { const { email, ...rest } = prev; return rest; })} />
                  <FieldError error={appErrors.email} />
                </div>
              </div>
            </div>

            {/* Section: Experience */}
            <div className="bg-muted/30 border rounded-xl p-5 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground">
                <GraduationCap className="h-4 w-4" /> Experience
              </h3>
              <div className="space-y-1.5">
                <Label htmlFor="experience" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Previous Experience</Label>
                <Textarea id="experience" name="experience" placeholder="Briefly describe your relevant experience, positions held, and years of service" maxLength={1000} className="min-h-[60px]" />
              </div>
            </div>

            {/* Section: Documents */}
            <div className="bg-muted/30 border rounded-xl p-5 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground">
                <FileText className="h-4 w-4" /> Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CV Upload */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upload CV / Documents *</Label>
                  <input ref={cvInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { setCvFile(e.target.files?.[0] || null); setAppErrors(prev => { const { cvFile, ...rest } = prev; return rest; }); }} />
                  <div
                    onClick={() => cvInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer hover:border-[#FFD700]/60 transition-colors bg-background ${appErrors.cvFile ? "border-destructive" : "border-input"}`}
                  >
                    {cvFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                        <FileText className="h-4 w-4 text-[#FFD700]" />
                        <span className="truncate max-w-[140px] font-medium">{cvFile.name}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setCvFile(null); }} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <span className="text-xs font-medium">PDF (Max 10MB)</span>
                        <Button type="button" variant="outline" size="sm" className="text-xs mt-1">Select File</Button>
                      </div>
                    )}
                  </div>
                  <FieldError error={appErrors.cvFile} />
                </div>

                {/* Certificates Upload */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upload Certificates (optional)</Label>
                  <input ref={certInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setCertFile(e.target.files?.[0] || null)} />
                  <div
                    onClick={() => certInputRef.current?.click()}
                    className="border-2 border-dashed border-input rounded-lg p-5 text-center cursor-pointer hover:border-[#FFD700]/60 transition-colors bg-background"
                  >
                    {certFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                        <FileText className="h-4 w-4 text-[#FFD700]" />
                        <span className="truncate max-w-[140px] font-medium">{certFile.name}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setCertFile(null); }} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <span className="text-xs font-medium">PDF or JPG (Max 5MB)</span>
                        <Button type="button" variant="outline" size="sm" className="text-xs mt-1">Select File</Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div className="bg-muted/30 border rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} className="mt-1 h-4 w-4 rounded border-input accent-[#FFD700]" />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I hereby certify that the information provided above is true and complete to the best of my knowledge. I understand that any false statement or omission may disqualify me from employment or lead to termination.
                </span>
              </label>
              {appErrors.declaration && <FieldError error={appErrors.declaration} />}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" /> Applications are processed within 3-5 working days.
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#1A1A1B] font-bold uppercase tracking-wider">
                  Submit Application
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Careers;
