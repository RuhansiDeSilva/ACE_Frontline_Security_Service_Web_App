import { useEffect, useState } from "react";
import { Bell, Calendar, Clock, MapPin, Users, CheckCheck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AnnouncementItem {
  id: number;
  targetRole: string;
  vacancyTitle: string;
  interviewDate: string;
  interviewTime: string;
  interviewLocation: string;
  numberOfInterviewees: number;
  read: boolean;
  createdAt: string;
}

const ROLE_MAP: Record<string, string> = {
  "/accountant": "ACCOUNTANT",
  "/account-executive": "ACCOUNTANT",
  "/area-manager": "AREA_MANAGER",
  "/chairman": "CHAIRMAN",
  "/director": "DIRECTOR",
  "/executive-officer": "EXECUTIVE",
};

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const { toast } = useToast();

  const authHeaders = (): HeadersInit => {
    const creds = sessionStorage.getItem("auth");
    return creds ? { Authorization: `Basic ${creds}` } : {};
  };

  // Detect current role from URL path
  const getRole = (): string => {
    const path = window.location.pathname;
    for (const [prefix, role] of Object.entries(ROLE_MAP)) {
      if (path.startsWith(prefix)) return role;
    }
    return "UNKNOWN";
  };

  const role = getRole();

  const fetchAnnouncements = () => {
    fetch(`/api/announcements/role/${role}`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((d) => {
        if (d && Array.isArray(d.data)) setAnnouncements(d.data);
      })
      .catch((err) => console.error("Failed to load announcements:", err));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/announcements/${id}/read`, {
        method: "PUT",
        headers: authHeaders(),
      });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: true } : a))
      );
    } catch {
      toast({ title: "Error", description: "Failed to mark as read", variant: "destructive" });
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/announcements/role/${role}/read-all`, {
        method: "PUT",
        headers: authHeaders(),
      });
      setAnnouncements((prev) => prev.map((a) => ({ ...a, read: true })));
      toast({ title: "Done", description: "All announcements marked as read." });
    } catch {
      toast({ title: "Error", description: "Failed to mark all as read", variant: "destructive" });
    }
  };

  const unreadCount = announcements.filter((a) => !a.read).length;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(":");
      const hr = parseInt(h);
      const ampm = hr >= 12 ? "PM" : "AM";
      const hr12 = hr % 12 || 12;
      return `${hr12}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const formatCreatedAt = (dt: string) => {
    try {
      const d = new Date(dt);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dt;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden bg-card p-5 text-foreground shadow-xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#FFD700]/25 via-[#FFD700]/8 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-40 h-40 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FFD700]/15 rounded-xl border border-[#FFD700]/20">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Announcements</h2>
              <p className="text-sm text-foreground/50">Interview assignments & notifications</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-3">
              <span className="bg-red-500 text-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                {unreadCount} new
              </span>
              <Button
                size="sm"
                variant="secondary"
                className="text-xs"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <Bell className="h-4 w-4 mx-auto mb-1.5 text-primary" />
            <p className="text-xl font-bold">{announcements.length}</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-0.5">Total</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <Eye className="h-4 w-4 mx-auto mb-1.5 text-red-400" />
            <p className="text-xl font-bold">{unreadCount}</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-0.5">Unread</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <CheckCheck className="h-4 w-4 mx-auto mb-1.5 text-emerald-400" />
            <p className="text-xl font-bold">{announcements.length - unreadCount}</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-0.5">Read</p>
          </div>
        </div>
      </div>

      {/* Announcement Cards */}
      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No announcements yet.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              You'll be notified here when you're assigned to interview panels.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card
              key={a.id}
              className={`transition-all ${
                !a.read
                  ? "border-l-4 border-l-indigo-500 bg-indigo-50/30 shadow-md"
                  : "opacity-80"
              }`}
            >
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Title row */}
                    <div className="flex items-center gap-2">
                      {!a.read && (
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shrink-0" />
                      )}
                      <h3 className="font-semibold text-foreground">
                        Interview Panel: {a.vacancyTitle}
                      </h3>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span>{formatDate(a.interviewDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span>{formatTime(a.interviewTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span>{a.interviewLocation}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-4 w-4 text-green-500" />
                        <span>{a.numberOfInterviewees} interviewee{a.numberOfInterviewees !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground/60">
                      {formatCreatedAt(a.createdAt)}
                    </p>
                  </div>

                  {/* Mark as read button */}
                  {!a.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-xs"
                      onClick={() => markAsRead(a.id)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> Mark read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;
