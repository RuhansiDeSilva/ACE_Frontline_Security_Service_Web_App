import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/DashboardHeader";
import ProfilePage from "@/pages/ProfilePage";

interface DashboardLayoutProps {
  title: string;
  role: string;
  items: { label: string; path: string }[];
  basePath: string;
}

export default function DashboardLayout({ title, role, items, basePath }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/staff-login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    toast({ title: "Logged out", description: "You have been logged out successfully" });
    navigate("/staff-login");
  };

  const storedRole = localStorage.getItem("role") || "";
  const isProfile = location.pathname.endsWith("/profile");

  // Determine the active item from the URL
  const currentPath = location.pathname.replace(basePath + "/", "").replace(basePath, "");
  const activeItemId = currentPath || "dashboard";

  // Render ProfilePage when on /profile sub-route
  if (isProfile) {
    return (
      <div className="min-h-screen bg-background">
        <ProfilePage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader
        userName={user?.fullName || title}
        userRole={role}
        onLogout={handleLogout}
        userId={user?.userId || 0}
        backendRole={storedRole}
        profilePath={`${basePath}/profile`}
      />

      {/* Tab Navigation */}
      <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {items.map((item) => {
              const isActive = activeItemId === item.path || (activeItemId === "dashboard" && item.path === "dashboard");
              return (
                <Link
                  key={item.path}
                  to={`${basePath}/${item.path}`}
                  className={`px-4 py-2 rounded-lg text-[15px] font-medium whitespace-nowrap transition-all border ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-card/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
