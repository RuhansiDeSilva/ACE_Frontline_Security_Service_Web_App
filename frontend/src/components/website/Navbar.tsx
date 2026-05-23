import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Menu, X, LogIn, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/#services" },
  { label: "Careers", path: "/careers" },
  { label: "Contact Us", path: "/inquiries" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm dark:shadow-lg dark:shadow-primary/5">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-primary bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
            <Shield className="h-5 w-5 text-primary font-bold" />
          </div>
          <div className="leading-tight hidden sm:block">
            <span className="block text-sm font-bold tracking-wider text-primary">ACE FRONT LINE</span>
            <span className="block text-[10px] tracking-widest text-muted-foreground font-semibold">SECURITY SOLUTIONS</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className={`text-sm font-semibold transition-colors border-b-2 pb-1 ${
                location.pathname === l.path 
                  ? "text-primary border-b-primary" 
                  : "text-foreground/70 border-b-transparent hover:text-primary hover:border-b-primary/50"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Link to="/login" className="hidden md:block">
            <Button size="sm" className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg">
              <LogIn className="mr-2 h-4 w-4" /> Login
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-foreground hover:bg-primary/10 hover:text-primary md:hidden transition-colors" 
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background/98 backdrop-blur p-4 md:hidden space-y-2">
          {navLinks.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className="block py-3 px-2 text-sm font-semibold text-foreground/80 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/login" onClick={() => setOpen(false)} className="block pt-2">
            <Button className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all" size="sm">
              <LogIn className="mr-2 h-4 w-4" /> Login
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
