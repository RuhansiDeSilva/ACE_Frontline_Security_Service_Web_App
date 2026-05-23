import { useState, useEffect } from "react";
import { DollarSign, MapPin, Calendar, CheckCircle2, TrendingUp, Shield, FileText, Clock, Users, Loader2, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { dashboardService } from "@/services/dashboardService";
import { addNotification } from "@/lib/notifications";
import ProfilePage from "@/pages/ProfilePage";
import AreaManagerDashboardContent from "@/pages/area-manager/Dashboard";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardCard from "@/components/DashboardCard";
import WelcomeMessage from "@/components/WelcomeMessage";
import { authService } from "@/services/authService";
import AreaManagerSchedulePage from "@/pages/area-manager/AreaManagerSchedulePage";
import AreaManagerLeaveApprovals from "@/pages/area-manager/AreaManagerLeaveApprovals";
import Attendance from "@/pages/area-manager/Attendance";
import WeeklyReport from "@/pages/area-manager/WeeklyReport";
import MonthlyReport from "@/pages/area-manager/MonthlyReport";
import MonthlyStatistics from "@/pages/area-manager/MonthlyStatistics";
import AdminLeaveHistory from "@/pages/admin-leave/AdminLeaveHistory";
import AdvanceRequests from "@/pages/accountant/AdvanceRequests";
import Announcements from "@/pages/Announcements";

type MainTabType =
  | "dashboard"
  | "security-officers"
  | "admin-leave"
  | "weekly-report"
  | "monthly-report"
  | "attendance"
  | "monthly-statistics"
  | "shift-schedule"
  | "leave-management"
  | "advance-request"
  | "announcements";

export default function AreaManagerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [securityOfficers, setSecurityOfficers] = useState<any[]>([]);
  const [officersLoading, setOfficersLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isProfile = location.pathname.endsWith("/profile");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
    } else {
      navigate("/staff-login");
    }
  }, [navigate]);

  // Load security officers when component mounts or area changes
  useEffect(() => {
    if (user?.assignedArea) {
      loadSecurityOfficers();
    }
  }, [user?.assignedArea]);

  const loadSecurityOfficers = async () => {
    if (!user?.assignedArea) return;
    setOfficersLoading(true);
    try {
      const data = await dashboardService.getAreaManagerDashboard();
      setSecurityOfficers(data.areaOfficers || []);
    } catch (error: any) {
      console.error("Failed to load security officers:", error);
    } finally {
      setOfficersLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<MainTabType>("dashboard");
  const tabRoutes: Record<MainTabType, string> = {
    dashboard: "/area-manager",
    "security-officers": "/area-manager/security-officers",
    "admin-leave": "/area-manager/admin-leave",
    "weekly-report": "/area-manager/weekly-report",
    "monthly-report": "/area-manager/monthly-report",
    attendance: "/area-manager/attendance",
    "monthly-statistics": "/area-manager/monthly-statistics",
    "shift-schedule": "/area-manager/shift-schedule",
    "leave-management": "/area-manager/leave-management",
    "advance-request": "/area-manager/advance-request",
    announcements: "/area-manager/announcements",
  };

  const tabByPath: Record<string, MainTabType> = {
    "/area-manager": "dashboard",
    "/area-manager/security-officers": "security-officers",
    "/area-manager/admin-leave": "admin-leave",
    "/area-manager/weekly-report": "weekly-report",
    "/area-manager/monthly-report": "monthly-report",
    "/area-manager/attendance": "attendance",
    "/area-manager/monthly-statistics": "monthly-statistics",
    "/area-manager/shift-schedule": "shift-schedule",
    "/area-manager/leave-management": "leave-management",
    "/area-manager/advance-request": "advance-request",
    "/area-manager/announcements": "announcements",
  };

  useEffect(() => {
    if (isProfile) return;
    const normalizedPath = location.pathname.replace(/\/+$/, "") || "/area-manager";
    const matchedTab = tabByPath[normalizedPath];
    if (matchedTab && matchedTab !== activeTab) {
      setActiveTab(matchedTab);
    }
  }, [location.pathname, isProfile, activeTab]);

  const navigateToTab = (tab: MainTabType) => {
    setActiveTab(tab);
    const tabPath = tabRoutes[tab];
    if (location.pathname !== tabPath) {
      navigate(tabPath);
    }
  };

  const handleLogout = () => {
    authService.logout();
    toast({ title: "Logged out", description: "You have been logged out successfully" });
    navigate("/staff-login");
  };

  const menuItems = [
    { icon: Users, label: "Security Officers", id: "security-officers" },
    { icon: Calendar, label: "Weekly Report", id: "weekly-report" },
    { icon: FileText, label: "Monthly Report", id: "monthly-report" },
    { icon: CheckCircle2, label: "Attendance", id: "attendance" },
    { icon: TrendingUp, label: "Monthly Stats", id: "monthly-statistics" },
    { icon: Clock, label: "Shift Schedule", id: "shift-schedule" },
    { icon: Users, label: "Leave Management", id: "leave-management" },
    { icon: DollarSign, label: "Advance Requests", id: "advance-request" },
    { icon: Bell, label: "Announcements", id: "announcements" },
  ];

  // Quick action cards for dashboard view
  const quickActions = [
    {
      icon: Users,
      title: "Security Officers",
      description: "View registered security officers in your area",
      onClick: () => setActiveTab("security-officers"),
    },
    {
      icon: Calendar,
      title: "Weekly Report",
      description: "View and manage weekly operational reports",
      onClick: () => setActiveTab("weekly-report"),
    },
    {
      icon: FileText,
      title: "Monthly Report",
      description: "Generate and review monthly performance reports",
      onClick: () => setActiveTab("monthly-report"),
    },
    {
      icon: CheckCircle2,
      title: "Attendance",
      description: "Track and manage officer attendance records",
      onClick: () => setActiveTab("attendance"),
    },
    {
      icon: TrendingUp,
      title: "Monthly Statistics",
      description: "View comprehensive monthly performance metrics",
      onClick: () => setActiveTab("monthly-statistics"),
    },
    {
      icon: Clock,
      title: "Shift Schedule",
      description: "Manage and assign officer shift schedules",
      onClick: () => setActiveTab("shift-schedule"),
    },
    {
      icon: Users,
      title: "Leave Management",
      description: "Process and approve leave applications",
      onClick: () => setActiveTab("leave-management"),
    },
    {
      icon: DollarSign,
      title: "Advance Approval",
      description: "Review and approve advance payment requests",
      onClick: () => setActiveTab("advance-request"),
    },
  ];

  if (isProfile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          userName={user?.fullName || "Area Manager"}
          userRole={user?.assignedArea || "Area Manager"}
          onLogout={handleLogout}
          userId={user?.userId || 0}
          backendRole="AREA_MANAGER"
          profilePath="/area-manager/profile"
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <ProfilePage />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <DashboardHeader
        userName={user?.fullName || "Area Manager"}
        userRole={user?.assignedArea || "Area Manager"}
        onLogout={handleLogout}
        userId={user?.userId || 0}
        backendRole="AREA_MANAGER"
        profilePath="/area-manager/profile"
      />

      {/* Main container with sidebar */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-slate-700 dark:border-slate-300 bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col gap-1 p-4">
            <button
              onClick={() => navigateToTab("dashboard")}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === "dashboard"
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-950 hover:bg-white/20 dark:hover:bg-slate-950/20"
                }`}
            >
              Dashboard
            </button>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateToTab(item.id as MainTabType)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-950 hover:bg-white/20 dark:hover:bg-slate-950/20"
                  }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 py-8 overflow-y-auto flex flex-col">
          {/* Dashboard View */}
          {activeTab === "dashboard" && <AreaManagerDashboardContent />}

          {/* Other Tab Views */}
          {activeTab === "shift-schedule" && <AreaManagerSchedulePage />}
          {activeTab === "leave-management" && <AreaManagerLeaveApprovals />}
          {activeTab === "attendance" && <Attendance />}
          {activeTab === "weekly-report" && <WeeklyReport />}
          {activeTab === "monthly-report" && <MonthlyReport />}
          {activeTab === "monthly-statistics" && <MonthlyStatistics />}
          {activeTab === "advance-request" && <AdvanceRequests role="Area Manager" />}
          {activeTab === "admin-leave" && <AdminLeaveHistory />}
          {activeTab === "announcements" && <Announcements />}

          {/* Security Officers Tab */}
          {activeTab === "security-officers" && (
            <div className="space-y-6">
              {/* Back Button & Title */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateToTab("dashboard")}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  ← Back
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Security Officers</h1>
                  <p className="text-muted-foreground text-sm">Registered security officers in {user?.assignedArea}</p>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Officers</p>
                        <p className="text-3xl font-bold text-primary mt-2">{securityOfficers.length}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/20">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Area</p>
                        <p className="text-xl font-bold text-primary mt-2 line-clamp-1">{user?.assignedArea || '-'}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/20">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Status</p>
                        <p className="text-3xl font-bold text-green-500 mt-2">
                          {securityOfficers.filter(o => o.active).length}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-green-500/20">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Officers Table */}
              <Card className="bg-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-foreground">Officer Directory</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {officersLoading ? "Loading..." : `${securityOfficers.length} officer(s) registered`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {officersLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                      <p className="text-muted-foreground">Loading security officers...</p>
                    </div>
                  ) : securityOfficers.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="h-16 w-16 text-primary/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No security officers registered in your area yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-primary">ID</th>
                            <th className="text-left py-3 px-4 font-semibold text-primary">Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-primary">Designation</th>
                            <th className="text-left py-3 px-4 font-semibold text-primary">Assigned Company</th>
                            <th className="text-left py-3 px-4 font-semibold text-primary">Email</th>
                            <th className="text-left py-3 px-4 font-semibold text-primary">Phone</th>
                            <th className="text-left py-3 px-4 font-semibold text-primary">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {securityOfficers.map((officer, idx) => (
                            <tr key={officer.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-4 font-mono text-sm text-muted-foreground">#{officer.id}</td>
                              <td className="py-3 px-4 text-foreground font-medium">{officer.fullName || '-'}</td>
                              <td className="py-3 px-4 text-foreground">
                                {officer.designation ? officer.designation.replace(/_/g, ' ') : '-'}
                              </td>
                              <td className="py-3 px-4 text-foreground">{officer.assignedCompany || '-'}</td>
                              <td className="py-3 px-4 text-muted-foreground text-sm">{officer.email || '-'}</td>
                              <td className="py-3 px-4 text-muted-foreground text-sm">{officer.mobileNumber || '-'}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${officer.active
                                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                                    }`}
                                >
                                  {officer.active ? '✓ Active' : '✕ Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
