import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/DashboardHeader";
import { CalendarDays, CreditCard, FileText, LayoutDashboard, MessageSquare } from "lucide-react";

interface ClientDashboardLayoutProps {
  title: string;
  role: string;
  items: { label: string; path: string }[];
  basePath: string;
}

export default function ClientDashboardLayout({
  title,
  role,
  items,
  basePath,
}: ClientDashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/client-login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/client-login");
  };

  const storedRole = localStorage.getItem("role") || "";
  const companyName = localStorage.getItem("companyName") || user?.fullName || title;

  // Determine the active item from the URL
  const currentPath = location.pathname.replace(basePath + "/", "").replace(basePath, "");
  const activeItemId = currentPath || "dashboard";

  const iconMap: Record<string, React.ElementType> = {
    dashboard: LayoutDashboard,
    feedback: MessageSquare,
    invoices: FileText,
    "shift-schedule": CalendarDays,
    payments: CreditCard,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader
        userName={companyName}
        userRole={role}
        onLogout={handleLogout}
        userId={user?.userId || 0}
        backendRole={storedRole}
        profilePath={`${basePath}/profile`}
      />

      <div className="flex flex-1">
        <aside className="w-64 border-r border-slate-700 dark:border-slate-300 bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col gap-1 p-4">
          {items.map((item) => {
            const isActive = activeItemId === item.path || (activeItemId === "" && item.path === "dashboard");
            const Icon = iconMap[item.path];
            return (
              <Link
                key={item.path}
                to={`${basePath}/${item.path}`}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-950 hover:bg-white/20 dark:hover:bg-slate-950/20"
                }`}
              >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {item.label}
              </Link>
            );
          })}
          </nav>
        </aside>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background text-foreground">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-foreground">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
