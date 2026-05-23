import { useState, useEffect } from "react";
import {
  getNotificationsForUser,
  markNotificationRead as markLocalRead,
  markAllNotificationsRead as markAllLocalRead,
  type Notification as LocalNotification,
} from "@/lib/notifications";
import { notificationService, NotificationItem } from "@/services/notificationService";
import { Bell, CheckCircle, XCircle, DollarSign, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

/** Combined type to handle both local and server notifications */
interface UnifiedNotification {
  id: string | number;
  dbId?: number; // Real database ID for backend notifications
  source: "local" | "backend";
  message: string;
  time: string;
  read: boolean;
}

const LoanNotificationBell = () => {
  const userId = Number(localStorage.getItem("userId") || "0");
  const role = localStorage.getItem("role") || "";
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);

  const refresh = async () => {
    // 1. Get local notifications
    const local = getNotificationsForUser(userId, role).map((n) => ({
      ...n,
      source: "local" as const,
    }));

    // 2. Get backend notifications
    let backend: UnifiedNotification[] = [];
    try {
      const serverNotifs = await notificationService.getMyNotifications();
      backend = serverNotifs.map((n) => ({
        id: `be-${n.id}`,
        dbId: n.id,
        source: "backend" as const,
        message: n.message,
        time: n.createdAt,
        read: n.read,
      }));
    } catch (err) {
      console.error("Failed to fetch backend notifications:", err);
    }

    // 3. Merge and Sort
    const merged = [...local, ...backend].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
    setNotifications(merged);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (n: UnifiedNotification) => {
    if (n.source === "backend" && n.dbId) {
      await notificationService.markAsRead(n.dbId);
    } else {
      markLocalRead(Number(n.id));
    }
    refresh();
  };

  const handleMarkAllRead = async () => {
    // Mark local as read
    markAllLocalRead(userId);
    
    // Mark backend as read (optional: could implement markAllAsRead in backend too)
    const unreadBackend = notifications.filter(n => n.source === "backend" && !n.read);
    for (const n of unreadBackend) {
      if (n.dbId) await notificationService.markAsRead(n.dbId);
    }
    
    refresh();
  };

  const getIcon = (message: string) => {
    if (message.includes("APPROVED") || message.includes("approved"))
      return <CheckCircle className="w-4 h-4 text-[hsl(var(--success))] shrink-0" />;
    if (message.includes("REJECTED") || message.includes("rejected"))
      return <XCircle className="w-4 h-4 text-destructive shrink-0" />;
    return <DollarSign className="w-4 h-4 text-primary shrink-0" />;
  };

  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-primary"
              onClick={handleMarkAllRead}>
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                  onClick={() => handleMarkRead(n)}
                >
                  <div className="flex gap-3">
                    {getIcon(n.message)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${!n.read ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">{formatTime(n.time)}</span>
                        {!n.read && (
                          <Badge className="h-4 px-1.5 text-[9px] bg-primary/15 text-primary border-0">NEW</Badge>
                        )}
                        {n.source === 'backend' && (
                          <span className="text-[8px] text-muted-foreground/60 uppercase tracking-tighter ml-2">System</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default LoanNotificationBell;
