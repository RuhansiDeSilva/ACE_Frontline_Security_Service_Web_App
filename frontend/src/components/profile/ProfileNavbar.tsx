import { Moon, Sun, Search, Shield, User } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { UserProfile } from "@/services/authService";
import LoanNotificationBell from "@/components/profile/LoanNotificationBell";

interface ProfileNavbarProps {
  user?: UserProfile | null;
  avatarPreview?: string | null;
  onProfileClick?: () => void;
}

const ProfileNavbar = ({ user, avatarPreview, onProfileClick }: ProfileNavbarProps) => {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const displayName = user?.fullName?.split(" ")[0] || "User";
  const generatedId = user
    ? `SL-${user.designation || "SO"}-${String(user.id).padStart(4, "0")}`
    : "";
  const avatarSrc = avatarPreview || user?.photoUrl;


  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-6 gap-6 shrink-0 relative z-50">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-foreground text-base tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Ace Frontline
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex items-center gap-1">
        <button className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Details
        </button>
      </nav>

      {/* Search */}
      <div className="flex-1 max-w-md ml-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search profiles..."
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <LoanNotificationBell />

        {/* Profile click — name + ID + avatar */}
        <button
          className="flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
          onClick={onProfileClick}
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground leading-tight">{displayName}</p>
            <p className="text-[10px] text-muted-foreground font-mono leading-tight">{generatedId}</p>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/30 bg-muted flex items-center justify-center">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Theme Toggle */}
        <button className="p-2 rounded-lg hover:bg-muted transition-colors" onClick={toggleTheme} title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          {theme === "dark" ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
        </button>
      </div>
    </header>
  );
};

export default ProfileNavbar;
