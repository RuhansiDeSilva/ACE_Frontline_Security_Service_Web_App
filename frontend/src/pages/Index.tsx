import { Link } from "react-router-dom";
import { Shield, Video, Truck, CheckCircle, Star, Phone, Mail, MapPin, ChevronRight, Menu, X, Lock, Users, Eye, Crosshair, UserCheck, Flame, Facebook, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useMotionValue, useTransform, animate, Variants } from "framer-motion";
import { useState, useEffect } from "react";
import { feedbackApi } from "@/lib/api";
// import logoImage from "@/assets/logo.png"; // Logo removed for public repo
import heroImage from "@/assets/hero-security.jpg";
import companyProfile from "@/assets/company-profile.png";
import teamPhoto from "@/assets/team-photo.jpg";
import solarFactory from "@/assets/sectors/solar-factory.png";
import helaBuilding from "@/assets/sectors/hela-building.png";
import industrialPipes from "@/assets/sectors/industrial-pipes.png";
import garmentWorkers from "@/assets/sectors/garment-workers.jpg";
import { ThemeToggle } from "@/components/ThemeToggle";

const heroSlides = [solarFactory, helaBuilding, industrialPipes, garmentWorkers];
const navItems = ["Home", "Services", "About Us", "Clients", "Careers", "Inquiries", "Contact"];

const stats = [
  { value: "500+", label: "Personnel", highlight: false },
  { value: "24/7", label: "Monitoring", highlight: true },
  { value: "50+", label: "Clients", highlight: false },
  { value: "9Y+", label: "Experience", highlight: true },
];

const coverageAreas = [
  "Colombo", "Biyagama", "Katunayake", "Nittambuwa", "Kurunegala", "Matale", "Southern Province", "Kalutara"
];

const services = [
  { icon: Shield, title: "Manned Guarding", desc: "Elite on-site security personnel including armed and unarmed guards, trained ex-military professionals for commercial and industrial sites.", detail: "Our manned guarding service provides highly trained security officers drawn from elite military backgrounds. Services include static guarding, mobile patrols, access control, perimeter security, and emergency response. All officers undergo rigorous training in threat assessment, conflict resolution, first aid, and fire safety. We deploy personnel equipped with modern communication devices and maintain strict supervision through area managers and operations coordinators." },
  { icon: Video, title: "CCTV Monitoring", desc: "Cutting-edge surveillance systems with expert monitoring teams, motion detection, glass breaking detection, and proximity access control.", detail: "Our CCTV monitoring solutions include installation, maintenance, and 24/7 remote monitoring of advanced surveillance systems. Features include HD/IP camera systems, motion detection alerts, glass break detection, proximity access control, night vision capabilities, and cloud-based storage. Our trained monitoring staff provide real-time incident response and detailed reporting for complete situational awareness." },
  { icon: Truck, title: "Cash in Transit", desc: "Secure armed escort services for cash transportation with GPS tracking and highly trained response teams.", detail: "Our Cash-in-Transit service provides secure transportation of cash and valuables with armed escort teams. All vehicles are GPS-tracked in real-time, and crews consist of highly trained ex-military personnel. We follow strict chain-of-custody protocols, use tamper-proof containers, and maintain insurance coverage for all consignments. Available for bank transfers, ATM replenishment, and corporate cash handling." },
  { icon: UserCheck, title: "VIP Protection", desc: "Personal bodyguards and drivers for VIP/VVIP protection, drawn from elite special forces with diplomatic mission experience.", detail: "Our VIP/VVIP protection service provides close protection officers (CPOs) drawn from elite special forces units with experience in diplomatic missions and high-risk environments. Services include personal bodyguards, secure transportation with trained drivers, advance security planning, threat assessments, and event security coordination. Each protection detail is customized based on the threat level and client requirements." },
  { icon: Crosshair, title: "Security Consultation", desc: "Comprehensive security assessments, survey reports, audits and tailored security solutions for any industry requirement.", detail: "Our security consultation services include comprehensive site surveys, vulnerability assessments, security audits, and risk analysis. We provide detailed reports with actionable recommendations tailored to your industry. Our consultants have decades of military and corporate security experience, offering solutions for physical security, electronic surveillance integration, emergency response planning, and regulatory compliance." },
  { icon: Flame, title: "Event Security", desc: "Specialized security coverage for private functions, residences, sporting events, cricket matches and corporate gatherings.", detail: "We provide specialized event security for private functions, corporate events, sporting events, exhibitions, and public gatherings. Our services include crowd management, access control, VIP area security, perimeter control, and emergency evacuation planning. All event security officers are briefed on event-specific protocols and coordinate with local law enforcement when required." },
];

const clients = [
  "Acme Manufacturing Group", "Apex Logistics Solutions", "Aurora Tech Services",
  "Blue Horizon Enterprises", "Capital Building Systems", "Clearwater Industries",
  "Compass Distribution", "Crescent Energy Corp", "Delta Security Services",
  "Emerald Commerce Ltd", "Epsilon Development Co", "Falcon Industrial Works",
  "Fusion Technology Labs", "Granite Construction", "Guardian Financial Group",
  "Harmony Health Solutions", "Horizon Trade Partners", "Ignite Ventures Inc",
  "Infinity Retail Corp", "Jacomax Electronics", "Keystone Operations",
  "Lambda Manufacturing", "Liberty Supply Chain", "Luminant Solutions Inc",
  "Matrix Global Services", "Nexus Innovations", "Omega Industries Ltd",
  "Paramount Group Holdings", "Quest Global Enterprises", "Radiant Energy Systems",
  "Stellar Logistics", "Titan Commercial Services", "Unity Healthcare Network",
  "Vanguard Distribution", "Vertex Engineering", "Victory Trade Partners",
  "Vigor Manufacturing", "Wavelength Communications", "Zenith Capital Group",
  "Zephyr Development", "Pinnacle Systems Corp",
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TESTIMONIALS_PER_PAGE = 3;

const FALLBACK_TESTIMONIALS = [
  { name: "Apex Logistics Solutions", role: "Manufacturing Client", quote: "Ace Front Line provides exceptional security services across our multiple facility locations. Their ex-military personnel bring unmatched professionalism and discipline.", rating: 5 },
  { name: "Granite Construction", role: "Construction Client", quote: "The reliability and training standards of Ace Front Line's security officers have significantly improved our facility security. Their 24/7 commitment is outstanding.", rating: 5 },
  { name: "Delta Security Services", role: "Industrial Client", quote: "Their comprehensive approach to security, combining manned guarding with electronic surveillance, gives us complete peace of mind for our operations.", rating: 5 },
  { name: "Guardian Financial Group", role: "Finance Client", quote: "Ace Front Line has been instrumental in maintaining the security standards at our facilities. Their officers are well-trained, punctual, and always professional.", rating: 5 },
  { name: "Luminant Solutions Inc", role: "Corporate Client", quote: "The security team provided by Ace Front Line for our corporate complex is exemplary. Employees feel safe and well-protected around the clock.", rating: 5 },
  { name: "Harmony Health Solutions", role: "Healthcare Client", quote: "We trust Ace Front Line with the safety of our staff and patients. Their guards are courteous, vigilant, and highly dependable.", rating: 5 },
];

const fadeInUp: any = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const AnimatedCounter = ({ value }: { value: string }) => {
  const num = parseInt(value.replace(/\D/g, ""));
  const suffix = value.replace(/\d/g, "");
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const [hasAnimated, setHasAnimated] = useState(false);

  return (
    <motion.span
      onViewportEnter={() => {
        if (!hasAnimated && !isNaN(num)) {
          animate(count, num, { duration: 2.5, ease: "easeOut" });
          setHasAnimated(true);
        }
      }}
      viewport={{ once: true }}
    >
      <motion.span>{isNaN(num) ? value : rounded}</motion.span>
      {!isNaN(num) && suffix}
    </motion.span>
  );
};

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedService, setExpandedService] = useState<number | null>(null);
  const [testimonialPage, setTestimonialPage] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [liveTestimonials, setLiveTestimonials] = useState<any[]>([]);
  const [testimonialsLoaded, setTestimonialsLoaded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    feedbackApi.getApproved()
      .then(data => {
        setLiveTestimonials(data ?? []);
        setTestimonialsLoaded(true);
      })
      .catch(() => {
        setLiveTestimonials([]);
        setTestimonialsLoaded(true);
      });
  }, []);

  // Handle scroll to section from query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scrollTo = params.get('scroll');

    if (scrollTo) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById(scrollTo);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }, 100);
    }
  }, []);

  const liveTestimonialsMapped = testimonialsLoaded && liveTestimonials.length > 0
    ? liveTestimonials.map(fb => ({
        name: fb.isAnonymous ? "Verified Client" : (fb.companyName ?? "Anonymous"),
        role: fb.submissionMonth && fb.submissionYear
          ? `${MONTHS[fb.submissionMonth - 1]} ${fb.submissionYear}`
          : new Date(fb.createdAt).toLocaleDateString("en-LK", { month: "long", year: "numeric" }),
        quote: fb.comments,
        rating: fb.overallRating,
      }))
    : [];

  const testimonials = (liveTestimonialsMapped.length > 0 ? liveTestimonialsMapped : FALLBACK_TESTIMONIALS);
  const topTestimonials = [...testimonials, ...FALLBACK_TESTIMONIALS]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 6);

  const testimonialPages = [
    topTestimonials.slice(0, TESTIMONIALS_PER_PAGE),
    topTestimonials.slice(TESTIMONIALS_PER_PAGE, TESTIMONIALS_PER_PAGE * 2),
  ];
  const visibleTestimonials = testimonialPages[testimonialPage] ?? testimonialPages[0];
  const totalTestimonialPages = testimonialPages.length;

  useEffect(() => {
    if (totalTestimonialPages <= 1) return;
    const timer = setInterval(() => {
      setTestimonialPage((current) => (current + 1) % totalTestimonialPages);
    }, 7000);
    return () => clearInterval(timer);
  }, [totalTestimonialPages]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md shadow-sm transition-shadow duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3">
              {/* Logo image removed for public repo */}
              <div className="flex flex-col leading-none">
                <span className="text-lg font-extrabold tracking-tight uppercase text-foreground">Ace Front Line</span>
                <span className="text-[10px] tracking-[0.2em] font-medium text-muted-foreground uppercase">Security Solutions</span>
              </div>
            </Link>

            <nav className="hidden md:flex flex-1 justify-center gap-6">
              {navItems.map((item) => (
                <Button key={item} variant="nav" size="sm" asChild>
                  {item === "Careers" || item === "Inquiries" ? (
                    <Link to={`/${item.toLowerCase()}`}>{item}</Link>
                  ) : (
                    <a href={item === "Home" ? "#" : `#${item.toLowerCase().replace(/\s/g, "-")}`}>{item}</a>
                  )}
                </Button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <Button size="sm" asChild className="gap-2">
                <Link to="/login">
                  <Lock className="h-4 w-4" /> Login
                </Link>
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t bg-card px-4 py-4 space-y-2">
            {navItems.map((item) =>
              item === "Careers" || item === "Inquiries" ? (
                <Link key={item} to={`/${item.toLowerCase()}`} className="block py-2 text-sm font-semibold text-foreground hover:text-primary">{item}</Link>
              ) : (
                <a key={item} href={item === "Home" ? "#" : `#${item.toLowerCase().replace(/\s/g, "-")}`} className="block py-2 text-sm font-semibold text-foreground hover:text-primary">{item}</a>
              )
            )}
            <div className="flex items-center gap-3 pt-2">
              <ThemeToggle />
              <Button size="sm" asChild className="w-full gap-2">
                <Link to="/login">
                  <Lock className="h-4 w-4" /> Login
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Slideshow */}
      <section className="relative w-full">
        <div className="relative min-h-[700px] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <AnimatePresence mode="wait">
              <motion.img 
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                alt="Professional security" 
                className="absolute inset-0 w-full h-full object-cover" 
                src={heroSlides[currentSlide]} 
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: "easeOut" }} className="max-w-2xl flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-md px-3 py-1 rounded-full border border-primary/30 w-fit">
                <Shield className="h-3 w-3 text-primary" />
                <span className="text-primary text-xs font-bold uppercase tracking-widest">Trusted Protection</span>
              </div>
              <h1 className="text-white text-5xl md:text-7xl font-black leading-[1.1] tracking-tight">
                World Class <span className="text-primary">Security Solutions</span>
              </h1>
              <p className="text-white/80 text-lg md:text-xl font-normal max-w-lg leading-relaxed">
                Led by elite ex-military professionals with over 35 years of experience, providing comprehensive commercial, industrial and maritime security services across Sri Lanka.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/inquiries">Get a Quote</Link>
                </Button>
                <Button variant="heroOutline" size="xl" className="text-white border-white/30 hover:bg-white/10">Our Services</Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="relative z-20 -mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-card p-6 rounded-xl shadow-2xl border">
          {stats.map((s, i) => (
            <motion.div variants={fadeInUp} key={i} className="flex flex-col items-center justify-center text-center p-4">
              <span className={`text-3xl font-black ${s.highlight ? "text-primary" : "text-foreground"}`}><AnimatedCounter value={s.value} /></span>
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest mt-1">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>



      {/* Services */}
      <section id="services" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-3">Professional Services</h2>
          <p className="text-4xl font-black text-foreground tracking-tight">Our Security Offerings</p>
          <div className="w-20 h-1.5 bg-primary mx-auto mt-6 rounded-full" />
        </div>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <motion.div variants={fadeInUp} key={i} whileHover={{ y: -8, scale: 1.02 }} className="group relative bg-card p-8 rounded-xl border hover:border-primary/50 transition-all duration-300">
              <div className="size-14 rounded-lg bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all mb-6 ring-1 ring-primary/20">
                <s.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-foreground">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">{s.desc}</p>
              <button
                className="inline-flex items-center text-sm font-bold text-foreground hover:text-primary transition-colors"
                onClick={() => setExpandedService(expandedService === i ? null : i)}
              >
                {expandedService === i ? "Show Less" : "Learn More"} <ChevronRight className={`ml-2 h-4 w-4 transition-transform ${expandedService === i ? "rotate-90" : ""}`} />
              </button>
              <AnimatePresence>
                {expandedService === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-4 pt-4 border-t text-muted-foreground text-sm leading-relaxed">{s.detail}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Team Photo Section */}
      <section className="py-16 bg-secondary overflow-hidden">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeInUp}>
              <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-3">Our Team</h2>
              <h3 className="text-4xl font-extrabold leading-tight text-white mb-6">Professional Security Personnel</h3>
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                With over 500 trained security officers deployed across Sri Lanka, our team of ex-military professionals ensures the highest standards of protection for your assets and personnel.
              </p>
              <div className="flex flex-wrap gap-2">
                {coverageAreas.map((area) => (
                  <span key={area} className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-bold rounded-full border border-primary/20">
                    {area}
                  </span>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="relative group overflow-hidden rounded-2xl shadow-2xl">
              <motion.img whileHover={{ scale: 1.05 }} transition={{ duration: 0.4, ease: "easeInOut" }} alt="Ace Front Line security team" className="w-full object-cover relative z-10" src={teamPhoto} />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Company Philosophy */}
      <section id="about-us" className="bg-accent py-24 dark:bg-muted/50">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div variants={fadeInUp} className="relative group">
            <motion.img whileHover={{ scale: 1.05 }} transition={{ duration: 0.4, ease: "easeInOut" }} alt="Ace Front Line team" className="rounded-2xl shadow-2xl relative z-10 w-full object-cover" src={companyProfile} />
            <div className="absolute -top-6 -left-6 size-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -right-10 px-8 py-6 bg-primary text-primary-foreground rounded-xl shadow-xl z-20 hidden md:block">
              <p className="text-4xl font-black italic">"Excellence"</p>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">Since 2016</p>
            </div>
          </motion.div>
          <motion.div variants={fadeInUp} className="flex flex-col gap-6">
            <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em]">About Us</h2>
            <h3 className="text-4xl font-extrabold leading-tight text-white dark:text-foreground">Ex-Military Leadership, World-Class Standards</h3>
            <p className="text-white/70 dark:text-muted-foreground text-lg leading-relaxed">
              Founded in 2016 by highly experienced retired senior military veterans, Ace Front Line Security Solutions provides unmatchable standards in security services with customized, modernized solutions for every client.
            </p>
            <ul className="flex flex-col gap-4">
              {["Registered under Ministry of Defence", "EPF/ETF & Insurance for all personnel", "Trained ex-servicemen from Elite Forces", "24-Hour Emergency Response Teams"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-white/90 dark:text-foreground/80">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </section>

      {/* Vision & Mission */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div variants={fadeInUp} whileHover={{ y: -5 }} className="bg-card p-10 rounded-2xl border shadow-lg transition-all duration-300">
            <h3 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">Our Vision</h3>
            <p className="text-2xl font-bold text-foreground leading-snug">Achieve world class in commercial, industrial and maritime security services.</p>
          </motion.div>
          <motion.div variants={fadeInUp} whileHover={{ y: -5 }} className="bg-card p-10 rounded-2xl border shadow-lg transition-all duration-300">
            <h3 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">To evolve and initiate new standards to become the most professional service provider in the business, becoming the benchmarked organization within the industry through a well-trained and highly motivated team headed by exemplary leadership.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Our Clients */}
      <section id="clients" className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="text-center mb-16">
            <motion.h2 variants={fadeInUp} className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-3">Our Clientele</motion.h2>
            <motion.p variants={fadeInUp} className="text-4xl font-black text-foreground tracking-tight">Trusted by 50+ Organizations</motion.p>
            <motion.div variants={fadeInUp} className="w-20 h-1.5 bg-primary mx-auto mt-6 rounded-full" />
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {clients.map((client) => (
              <motion.div variants={fadeInUp} key={client} className="flex items-center gap-3 bg-background p-4 rounded-xl border hover:border-primary/40 transition-colors">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{client}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <div className="mb-12">
              <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-3">Client Testimonials</h2>
              <p className="text-4xl font-black text-foreground tracking-tight">What Our Clients Say</p>
            </div>

            <div key={testimonialPage} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {visibleTestimonials.map((t, i) => (
                <div key={testimonialPage * TESTIMONIALS_PER_PAGE + i} className="bg-card p-8 rounded-2xl shadow-lg border flex flex-col gap-4 ring-1 ring-border/50 min-h-[210px]">
                  <div>
                    <h4 className="font-bold text-foreground">{t.name}</h4>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.role}</p>
                  </div>
                  <div className="flex text-primary">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className={`h-4 w-4 ${j < (t.rating ?? 5) ? "fill-primary" : "fill-muted text-muted-foreground/40"}`} />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground italic leading-relaxed">"{t.quote}"</blockquote>
                </div>
              ))}
            </div>

            {totalTestimonialPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalTestimonialPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTestimonialPage(i)}
                    className={`w-3 h-3 rounded-full transition-colors ${i === testimonialPage ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                    aria-label={`Show testimonials page ${i + 1}`}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-center mt-10">
              <Link
                to="/reviews"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-all shadow-sm text-sm"
              >
                <Star className="h-4 w-4" /> See All Client Reviews
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Get In Touch & Consultation Section */}
      <section id="contact" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left Side: Contact Information */}
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.div variants={fadeInUp} className="mb-12">
                <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-3">Contact Us</h2>
                <p className="text-5xl font-black text-foreground tracking-tight mb-6">Get In Touch</p>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                  Ready to discuss your security needs? Our team is available 24/7 to provide expert guidance and customized solutions.
                </p>
              </motion.div>

              <div className="space-y-6">
                {[
                  { icon: Phone, title: "Phone", details: "+1 (555) 123-4567 / +1 (555) 123-4568", subtitle: "Available 24/7" },
                  { icon: Mail, title: "Email", details: "company123@gmail.com", subtitle: "Response within 24 hours" },
                  { icon: Facebook, title: "Facebook", details: "Security Solutions", href: "https://www.facebook.com/", subtitle: "Follow our updates" },
                  { icon: MapPin, title: "Head Office", details: "123 Business Street, Suite 100, New York, NY 10001", subtitle: "Open Mon-Sat" },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeInUp} className="flex items-center gap-6 group">
                    <div className="size-14 rounded-xl bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{item.title}</p>
                      {item.title === "Head Office" ? (
                        <a href="http://google.com/maps/place/Ace+Front+Line+Security+Solutions+(Private)+Limited/@6.91031,79.9296691,14z/data=!4m6!3m5!1s0x3ae25b7cfb35ff15:0xdb99af33f809471a!8m2!3d6.906926!4d79.9265049!16s%2Fg%2F11h37w8pdf?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-foreground hover:text-primary transition-colors">{item.details}</a>
                      ) : item.href ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-foreground hover:text-primary transition-colors">{item.details}</a>
                      ) : (
                        <p className="text-lg font-bold text-foreground">{item.details}</p>
                      )}
                      <p className="text-xs text-muted-foreground/60 font-medium mt-0.5">{item.subtitle}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side: Contact Us Section */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative">
              <div className="bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900 p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(255,255,255,0.05)] border border-white/5 dark:border-black/5 transition-all duration-300">
                <h3 className="text-3xl font-black mb-6 text-white dark:text-foreground">Get in Touch</h3>
                <p className="text-lg text-slate-300 dark:text-slate-600 mb-8 leading-relaxed">
                  Have questions about our security services? Our dedicated team is ready to help you find the perfect solution for your needs. Fill out our general inquiry form and we'll get back to you within 24 hours.
                </p>
                <Link
                  to="/inquiries?tab=general"
                  className="inline-flex items-center justify-center w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 font-black rounded-lg transition-all shadow-xl shadow-primary/20 text-lg"
                >
                  Contact Us Now <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-charcoal-foreground/50 text-sm">© 2026 Ace Front Line Security Solutions (Pvt) Ltd. All rights reserved.</p>
          <a href="https://www.facebook.com/acefrontline/" target="_blank" rel="noopener noreferrer" className="text-charcoal-foreground/50 hover:text-primary transition-colors">
            <Facebook className="h-5 w-5" />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
