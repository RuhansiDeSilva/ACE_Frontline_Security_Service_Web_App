import { Shield, MapPin, Phone, Mail, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-wide text-primary">STALLION SECURITY</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Professional security solutions trusted by leading organizations across the nation.
          </p>
          <div className="mt-4 flex gap-3">
            {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
              <a key={i} href="#" className="text-muted-foreground transition-colors hover:text-primary">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Quick Links</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link>
            <Link to="/careers" className="hover:text-primary">Careers</Link>
            <Link to="/clients" className="hover:text-primary">Clients</Link>
            <Link to="/inquiries" className="hover:text-primary">Inquiries</Link>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Services</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span>Manned Guarding</span>
            <span>CCTV Surveillance</span>
            <span>Event Security</span>
            <span>VIP Protection</span>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Contact</h4>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>No. 42, Security Avenue, Colombo 07, Sri Lanka</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <span>+94 11 234 5678</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <span>info@stallionsecurity.lk</span>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © 2026 Stallion Security. All rights reserved.
      </div>
    </footer>
  );
}
