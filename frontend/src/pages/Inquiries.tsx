import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, MessageCircle, Send, MapPin, Shield, Phone, Mail, Clock, CheckCircle, HelpCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import OfficerRoleSelector from "@/components/OfficerRoleSelector";
// import logoImage from "@/assets/logo.png"; // Logo removed for public repo

const Inquiries = () => {
  const { toast } = useToast();
  const query = new URLSearchParams(window.location.search);
  const defaultTab = query.get("tab") || "service";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [serviceDuration, setServiceDuration] = useState("");
  const [officerRoles, setOfficerRoles] = useState<Record<string, number>>({});
  const [serviceErrors, setServiceErrors] = useState<Record<string, string>>({});
  const [generalErrors, setGeneralErrors] = useState<Record<string, string>>({});

  // Validation patterns
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const SRI_LANKAN_PHONE = /^(?:0|\+94|0094)?7[0-9]{8}$/;

  const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    return SRI_LANKAN_PHONE.test(phone.replace(/[\s-]/g, ""));
  };

  const validateServiceInquiry = (data: any): boolean => {
    const errors: Record<string, string> = {};

    if (!data.companyName?.trim()) {
      errors.companyName = "Company name is required";
    }

    if (!data.contactPerson?.trim()) {
      errors.contactPerson = "Contact person name is required";
    }

    if (!data.email?.trim()) {
      errors.svcEmail = "Email address is required";
    } else if (!validateEmail(data.email)) {
      errors.svcEmail = "Please enter a valid email address (e.g., name@example.com)";
    }

    if (!data.phoneNumber?.trim()) {
      errors.svcPhone = "Phone number is required";
    } else if (!validatePhone(data.phoneNumber)) {
      errors.svcPhone = "Please enter a valid Sri Lankan phone number (e.g., 0771234567)";
    }

    if (!data.companyAddress?.trim()) {
      errors.companyAddress = "Company address is required";
    }

    if (!data.serviceLocation?.trim()) {
      errors.serviceLocation = "Service location is required";
    }

    if (!data.serviceDuration) {
      errors.serviceDuration = "Service duration is required";
    }

    setServiceErrors(errors);

    if (Object.keys(errors).length > 0) {
      return false;
    }

    return true;
  };

  const validateGeneralInquiry = (data: any): boolean => {
    const errors: Record<string, string> = {};

    if (!data.fullName?.trim()) {
      errors.genFullName = "Full name is required";
    }

    if (!data.email?.trim()) {
      errors.genEmail = "Email address is required";
    } else if (!validateEmail(data.email)) {
      errors.genEmail = "Please enter a valid email address (e.g., name@example.com)";
    }

    if (!data.phoneNumber?.trim()) {
      errors.genPhone = "Phone number is required";
    } else if (!validatePhone(data.phoneNumber)) {
      errors.genPhone = "Please enter a valid Sri Lankan phone number (e.g., 0771234567)";
    }

    if (!data.subject?.trim()) {
      errors.genSubject = "Subject is required";
    }

    if (!data.message?.trim()) {
      errors.genMessage = "Message is required";
    }

    setGeneralErrors(errors);

    if (Object.keys(errors).length > 0) {
      return false;
    }

    return true;
  };

  const handleServiceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const totalOfficers = Object.values(officerRoles).reduce((sum, count) => sum + count, 0);
    if (totalOfficers === 0) {
      setServiceErrors(prev => ({ ...prev, officerRoles: "Please select at least one officer role" }));
      return;
    }

    const form = e.target as HTMLFormElement;
    const data = {
      companyName: (form.elements.namedItem("companyName") as HTMLInputElement).value,
      contactPerson: (form.elements.namedItem("contactPerson") as HTMLInputElement).value,
      email: (form.elements.namedItem("svcEmail") as HTMLInputElement).value,
      phoneNumber: (form.elements.namedItem("svcPhone") as HTMLInputElement).value,
      numberOfOfficers: totalOfficers,
      companyAddress: (form.elements.namedItem("companyAddress") as HTMLInputElement).value,
      serviceLocation: (form.elements.namedItem("serviceLocation") as HTMLInputElement).value,
      serviceDuration: serviceDuration,
      additionalNotes: (form.elements.namedItem("svcNotes") as HTMLTextAreaElement).value,
      officerRoles: JSON.stringify(officerRoles),
    };

    if (!validateServiceInquiry(data)) {
      return;
    }

    try {
      const res = await fetch("/api/inquiries/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Network response was not ok");
      toast({
        title: "Service Inquiry Submitted",
        description: "We've received your request. Our team will contact you within 24 hours.",
      });
      form.reset();
      setServiceDuration("");
      setOfficerRoles({});
      setServiceErrors({});
    } catch (err) {
      toast({
        title: "Submission Failed",
        description: "Unable to send inquiry. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleGeneralSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      fullName: (form.elements.namedItem("genFullName") as HTMLInputElement).value,
      email: (form.elements.namedItem("genEmail") as HTMLInputElement).value,
      phoneNumber: (form.elements.namedItem("genPhone") as HTMLInputElement).value,
      subject: (form.elements.namedItem("genSubject") as HTMLInputElement).value,
      message: (form.elements.namedItem("genMessage") as HTMLTextAreaElement).value,
    };

    if (!validateGeneralInquiry(data)) {
      return;
    }

    try {
      const res = await fetch("/api/inquiries/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Network response was not ok");
      toast({
        title: "Inquiry Submitted",
        description: "Thank you for reaching out. We'll respond to your inquiry shortly.",
      });
      form.reset();
      setGeneralErrors({});
    } catch (err) {
      toast({
        title: "Submission Failed",
        description: "Unable to send inquiry. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-black border-b-2 border-gray-300 dark:border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
              {/* Logo removed */}
              <div className="flex flex-col leading-none">
                <span className="text-sm font-extrabold tracking-tight uppercase text-black dark:text-white">Ace Front Line</span>
                <span className="text-[9px] tracking-[0.15em] font-semibold text-gray-600 dark:text-gray-400 uppercase">Security Solutions</span>
              </div>
            </Link>
            <nav className="flex items-center gap-8 ml-auto">
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
      </header>

      {/* Hero Section - matched with AI Risk Assessment */}
      <section className="relative bg-white dark:bg-[#1A1A1B] text-foreground dark:text-white py-24 md:py-32 overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 left-0 w-1/4 h-full bg-gradient-to-r from-[#FFD700]/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-[#FFD700]/10 to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#FFD700]/20 mb-8">
            <div className="w-1.5 h-1.5 bg-[#FFD700] rounded-full animate-pulse" />
            <span className="text-[#FFD700] text-[10px] font-black uppercase tracking-[0.2em] leading-none">24/7 Support Available</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-8 tracking-tight leading-tight">
            How Can We <span className="text-[#FFD700]">Help You?</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground dark:text-gray-400 max-w-3xl mx-auto leading-relaxed font-medium">
            Whether you need security services for your business or have a general question,
            our dedicated team is ready to assist you.
          </p>


          {/* Quick info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 bg-card/50 dark:bg-white/10 backdrop-blur-md p-4 rounded-xl border border-border dark:border-white/10 shadow-sm">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground font-medium">Call Us</p>
                <p className="text-sm font-bold">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card/50 dark:bg-white/10 backdrop-blur-md p-4 rounded-xl border border-border dark:border-white/10 shadow-sm">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground font-medium">Email</p>
                <p className="text-sm font-bold">company123@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card/50 dark:bg-white/10 backdrop-blur-md p-4 rounded-xl border border-border dark:border-white/10 shadow-sm">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground font-medium">Response Time</p>
                <p className="text-sm font-bold">Within 24 hrs</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <a
              href="https://maps.app.goo.gl/gm6SibQrDqco4Pj3A"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-foreground transition-colors text-sm font-semibold"
            >
              <MapPin className="h-4 w-4" /> 123 Business Street, Suite 100, New York, NY 10001 - View on Map
            </a>
          </div>

          {/* Moved AI Risk Assessment CTA */}
          <div className="mt-4 flex flex-col items-center gap-4">
            <div className="w-24 h-[1px] bg-border dark:bg-foreground/10" />
            <Link
              to="/ai-risk-assessment"
              className="inline-flex items-center gap-3 px-10 py-4 rounded-xl border border-primary bg-primary hover:bg-primary transition-all duration-300 group hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] active:shadow-[0_0_10px_rgba(255,215,0,0.3)] shadow-lg"
            >
              <Shield className="h-4 w-4 text-black group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-black">Try Our AI Risk Assessment</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Contact Us - trust signals */}
      <section className="bg-muted/30 py-12 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: "MOD Registered", desc: "Licensed & Authorized" },
              { icon: CheckCircle, label: "50+ Clients", desc: "Trusted Partner" },
              { icon: Clock, label: "Quick Response", desc: "24/7 Availability" },
              { icon: HelpCircle, label: "Free Consultation", desc: "No Obligation" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center gap-2 p-4">
                <div className="bg-card/10 p-3 rounded-full">
                  <item.icon className="h-6 w-6 text-[#1A1A1B] dark:text-white" />
                </div>
                <p className="font-bold text-foreground text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-foreground tracking-tight">
            Submit Your Inquiry
          </h2>
          <p className="text-muted-foreground mt-2">Choose the type of inquiry that best fits your needs</p>
          <div className="w-16 h-1 bg-card mx-auto mt-4 rounded-full" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-[#F4F7F6] rounded-xl p-1 border border-border">
            <TabsTrigger
              value="service"
              className="gap-2 py-3 text-base font-bold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-lg transition-all"
            >
              <Building2 className="h-5 w-5" /> Service Inquiry
            </TabsTrigger>
            <TabsTrigger
              value="general"
              className="gap-2 py-3 text-base font-bold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-lg transition-all"
            >
              <MessageCircle className="h-5 w-5" /> General Inquiry
            </TabsTrigger>
          </TabsList>

          {/* Service Inquiry Tab */}
          <TabsContent value="service">
            <Card className="shadow-xl border-0 bg-card overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#1A1A1B] via-[#FFD700] to-[#1A1A1B]" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-card/10 p-2 rounded-lg">
                    <Building2 className="h-6 w-6 text-[#1A1A1B]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Request Security Services</CardTitle>
                    <CardDescription className="mt-1">For companies looking to hire security officers. Fill in your requirements below.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleServiceSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName" className="font-semibold">Company Name *</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      placeholder="Your company name"
                      required
                      maxLength={200}
                      className={`h-11 ${serviceErrors.companyName ? "border-red-500 border-2 focus:ring-red-500" : ""}`}
                      onChange={() => setServiceErrors(prev => { const { companyName, ...rest } = prev; return rest; })}
                    />
                    {serviceErrors.companyName && <p className="text-xs text-red-500 font-medium">{serviceErrors.companyName}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contactPerson" className="font-semibold">Contact Person Name *</Label>
                      <Input
                        id="contactPerson"
                        name="contactPerson"
                        placeholder="Full name"
                        required
                        maxLength={100}
                        className={`h-11 ${serviceErrors.contactPerson ? "border-red-500 border-2 focus:ring-red-500" : ""}`}
                        onChange={() => setServiceErrors(prev => { const { contactPerson, ...rest } = prev; return rest; })}
                      />
                      {serviceErrors.contactPerson && <p className="text-xs text-red-500 font-medium">{serviceErrors.contactPerson}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="svcEmail" className="font-semibold">Email Address *</Label>
                      <Input
                        id="svcEmail"
                        name="svcEmail"
                        type="email"
                        placeholder="you@company.com"
                        required
                        maxLength={255}
                        className={`h-11 ${serviceErrors.svcEmail ? "border-red-500 border-2 focus:ring-red-500" : ""}`}
                        onChange={() => setServiceErrors(prev => { const { svcEmail, ...rest } = prev; return rest; })}
                      />
                      {serviceErrors.svcEmail && <p className="text-xs text-red-500 font-medium">{serviceErrors.svcEmail}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="svcPhone" className="font-semibold">Phone Number *</Label>
                      <Input
                        id="svcPhone"
                        name="svcPhone"
                        type="tel"
                        placeholder="07X XXXX XXX"
                        required
                        maxLength={15}
                        className={`h-11 ${serviceErrors.svcPhone ? "border-red-500 border-2 focus:ring-red-500" : ""}`}
                        onChange={() => setServiceErrors(prev => { const { svcPhone, ...rest } = prev; return rest; })}
                      />
                      {serviceErrors.svcPhone && <p className="text-xs text-red-500 font-medium">{serviceErrors.svcPhone}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Security Officers Required *</Label>
                    <OfficerRoleSelector value={officerRoles} onChange={setOfficerRoles} />
                    <p className="text-xs text-muted-foreground">Note: This count is preliminary and can be adjusted during our consultation process based on your specific security requirements.</p>
                    {serviceErrors.officerRoles && <p className="text-xs text-red-500 font-medium">{serviceErrors.officerRoles}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="companyAddress" className="font-semibold">Company Address *</Label>
                    <Input
                      id="companyAddress"
                      name="companyAddress"
                      placeholder="Full company address"
                      required
                      maxLength={500}
                      className={`h-11 ${serviceErrors.companyAddress ? "border-red-500 border-2 focus:ring-red-500" : ""}`}
                      onChange={() => setServiceErrors(prev => { const { companyAddress, ...rest } = prev; return rest; })}
                    />
                    {serviceErrors.companyAddress && <p className="text-xs text-red-500 font-medium">{serviceErrors.companyAddress}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="serviceLocation" className="font-semibold">Service Location *</Label>
                      <Input
                        id="serviceLocation"
                        name="serviceLocation"
                        placeholder="Where officers are needed"
                        required
                        maxLength={200}
                        className={`h-11 ${serviceErrors.serviceLocation ? "border-red-500 border-2 focus:ring-red-500" : ""}`}
                        onChange={() => setServiceErrors(prev => { const { serviceLocation, ...rest } = prev; return rest; })}
                      />
                      {serviceErrors.serviceLocation && <p className="text-xs text-red-500 font-medium">{serviceErrors.serviceLocation}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="serviceDuration" className="font-semibold">Service Duration *</Label>
                      <Select value={serviceDuration} onValueChange={(value) => { setServiceDuration(value); setServiceErrors(prev => { const { serviceDuration, ...rest } = prev; return rest; }); }} required>
                        <SelectTrigger className={`h-11 ${serviceErrors.serviceDuration ? "border-red-500 border-2 focus:ring-red-500" : ""}`}>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short-term">Short-term</SelectItem>
                          <SelectItem value="long-term">Long-term</SelectItem>
                        </SelectContent>
                      </Select>
                      {serviceErrors.serviceDuration && <p className="text-xs text-red-500 font-medium">{serviceErrors.serviceDuration}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="svcNotes" className="font-semibold">Additional Notes</Label>
                    <Textarea
                      id="svcNotes"
                      name="svcNotes"
                      placeholder="Any specific requirements or details..."
                      maxLength={1000}
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all bg-card hover:bg-primary hover:text-[#1A1A1B] text-foreground" size="lg">
                    <Send className="h-5 w-5 mr-2" /> Submit Service Inquiry
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Inquiry Tab */}
          <TabsContent value="general">
            <Card className="shadow-xl border-0 bg-card overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#1A1A1B] via-[#FFD700] to-[#1A1A1B]" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">General Inquiry</CardTitle>
                    <CardDescription className="mt-1">For security officers, visitors, or anyone with a question. We're happy to help.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGeneralSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="genFullName" className="font-semibold">Full Name *</Label>
                    <Input
                      id="genFullName"
                      name="genFullName"
                      placeholder="Your full name"
                      required
                      maxLength={100}
                      className={`h-11 ${generalErrors.genFullName ? "border-red-500 border-2 focus:ring-red-500" : ""}`}
                      onChange={() => setGeneralErrors(prev => { const { genFullName, ...rest } = prev; return rest; })}
                    />
                    {generalErrors.genFullName && <p className="text-xs text-red-500 font-medium">{generalErrors.genFullName}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="genEmail" className="font-semibold">Email Address *</Label>
                      <Input
                        id="genEmail"
                        name="genEmail"
                        type="email"
                        placeholder="you@example.com"
                        required
                        maxLength={255}
                        className={`h-11 ${generalErrors.genEmail ? "border-red-500 border-2 focus:ring-red-500" : ""}`}
                        onChange={() => setGeneralErrors(prev => { const { genEmail, ...rest } = prev; return rest; })}
                      />
                      {generalErrors.genEmail && <p className="text-xs text-red-500 font-medium">{generalErrors.genEmail}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="genPhone" className="font-semibold">Phone Number *</Label>
                      <Input
                        id="genPhone"
                        name="genPhone"
                        type="tel"
                        placeholder="07X XXXX XXX"
                        required
                        maxLength={15}
                        className={`h-11 ${generalErrors.genPhone ? "border-red-500 border-2 focus:ring-red-500" : ""}`}
                        onChange={() => setGeneralErrors(prev => { const { genPhone, ...rest } = prev; return rest; })}
                      />
                      {generalErrors.genPhone && <p className="text-xs text-red-500 font-medium">{generalErrors.genPhone}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="genSubject" className="font-semibold">Inquiry Subject *</Label>
                    <Input
                      id="genSubject"
                      name="genSubject"
                      placeholder="What is your inquiry about?"
                      required
                      maxLength={200}
                      className={`h-11 ${generalErrors.genSubject ? "border-red-500 border-2 focus:ring-red-500" : ""}`}
                      onChange={() => setGeneralErrors(prev => { const { genSubject, ...rest } = prev; return rest; })}
                    />
                    {generalErrors.genSubject && <p className="text-xs text-red-500 font-medium">{generalErrors.genSubject}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="genMessage" className="font-semibold">Message / Question *</Label>
                    <Textarea
                      id="genMessage"
                      name="genMessage"
                      placeholder="Type your message here..."
                      required
                      maxLength={2000}
                      className={`min-h-[140px] ${generalErrors.genMessage ? "border-red-500 border-2 focus:ring-red-500" : ""}`}
                      onChange={() => setGeneralErrors(prev => { const { genMessage, ...rest } = prev; return rest; })}
                    />
                    {generalErrors.genMessage && <p className="text-xs text-red-500 font-medium">{generalErrors.genMessage}</p>}
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all bg-card hover:bg-primary hover:text-[#1A1A1B] text-foreground" size="lg">
                    <Send className="h-5 w-5 mr-2" /> Submit Inquiry
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Footer CTA */}
      <section className="bg-card text-foreground py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-3">Need Immediate Assistance?</h3>
          <p className="text-primary/60 mb-6">Our operations team is available around the clock for urgent security needs.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:+15551234567" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-[#1A1A1B] px-6 py-3 rounded-lg font-bold transition-colors">
              <Phone className="h-5 w-5" /> Call Us
            </a>
            <a href="mailto:company123@gmail.com" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg font-bold transition-colors border border-primary/40">
              <Mail className="h-5 w-5" /> Email Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Inquiries;
