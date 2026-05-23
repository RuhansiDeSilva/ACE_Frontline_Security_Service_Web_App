import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, Moon, Sun, User, X, Clock } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import {
  notificationService,
  type NotificationItem,
} from "@/services/notificationService";
import logoImage from "@/assets/logo.png";

interface DashboardHeaderProps {
  userName: string;
  userRole: string;
  onLogout: () => void;
  userId?: number;
  backendRole?: string;
  profilePath?: string;
}

export default function DashboardHeader({
  userName,
  userRole,
  onLogout,
  userId = 0,
  backendRole,
  profilePath,
}: DashboardHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }));
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }));
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // ── Time Update ──
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Notifications ──
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only load notifications for staff users (skip for clients)
    if (backendRole === "CLIENT" || userRole?.toLowerCase().includes("client")) {
      return;
    }

    const load = () => {
      notificationService.getMyNotifications()
        .then(setNotifications)
        .catch(() => { }); // silently fail if not authenticated yet
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [userId, backendRole, userRole]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const handleMarkRead = (id: number) => {
    notificationService.markAsRead(id).catch(() => { });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Logo & Brand with Date/Time */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoImage} alt="Ace Front Line Logo" className="h-9 w-9 rounded-full" />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-[17px] font-extrabold tracking-tight uppercase text-foreground">
                Ace Front Line
              </span>
              <span className="text-[10px] tracking-[0.15em] font-medium text-muted-foreground uppercase">
                Security Solutions
              </span>
            </div>
          </Link>

          {/* Date & Time Display */}
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-border/30">
            <Clock className="h-4 w-4 text-primary/70" />
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-medium text-foreground">{currentDate}</span>
              <span className="text-[12px] text-muted-foreground">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-[15px]">No notifications</div>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-border/50 last:border-0 flex items-start gap-3 cursor-pointer hover:bg-muted transition-colors ${!n.read ? "bg-primary/5" : ""
                          }`}
                        onClick={() => handleMarkRead(n.id)}
                      >
                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-muted-foreground/20" : "bg-primary"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-foreground leading-snug">{n.message}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && (
                          <button
                            className="p-1 rounded hover:bg-primary/10 transition-colors shrink-0"
                            onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                          >
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Info & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[15px] font-semibold text-foreground leading-tight">{userName}</p>
                <p className="text-[12px] text-primary/80 uppercase tracking-wider font-medium">{userRole}</p>
              </div>
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50">
                    <p className="text-[15px] font-semibold text-foreground">{userName}</p>
                    <p className="text-[13px] text-primary/70">{userRole}</p>
                  </div>
                  {profilePath && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate(profilePath);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[15px] text-foreground/80 hover:bg-primary/10 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      View Profile
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[15px] text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
