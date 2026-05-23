import { useState, useEffect } from "react";
import { LayoutDashboard, FileText, UserPlus, Users, Shield, Building2, ClipboardList, ExternalLink, Briefcase, HelpCircle, Users2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/DashboardHeader";
import WelcomeMessage from "@/components/WelcomeMessage";
import ProfilePage from "@/pages/ProfilePage";
import AdminRegistration from "@/pages/AdminRegistration";
import SecurityOfficerRegistration from "@/pages/SecurityOfficerRegistration";
import UserDirectory from "@/pages/UserDirectory";
import { authService } from "@/services/authService";
import ClientManagement from "@/pages/operational-manager/ClientManagement";
import OperationalCareers from "@/pages/OperationalCareers";
import OperationalInquiries from "@/pages/OperationalInquiries";
import Interviews from "@/pages/Interviews";
import OperationalManagerFeedback from "@/pages/operational-manager/OperationalManagerFeedback";
import OperationalWeeklyReport from "@/pages/OperationalWeeklyReport";

const OpManagerWeeklyReport = () => (
  <OperationalWeeklyReport />
);

type TabType = "dashboard" | "weekly-report" | "registration" | "registration-list" | "interview" | "recruitment" | "inquiry-management" | "client-management" | "feedback-management";

/* ─── Feature card: centred icon → title → description → CTA ─── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  buttonText,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonText: string;
  onClick?: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2 text-center">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed text-center mb-6 flex-1">{description}</p>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {buttonText}
      </button>
    </div>
  );
}

function StatCard({ title, value, description }: { title: string; value: number; description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-4xl font-bold text-primary mb-2">{value.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default function OperationalManagerDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [registrationView, setRegistrationView] = useState<"cards" | "admin" | "security" | "directory">("cards");
  const [user, setUser] = useState<any>(null);
  const [totalRegistrations, setTotalRegistrations] = useState<number>(0);
  const [totalVacancies, setTotalVacancies] = useState<number>(0);
  const [totalApplicants, setTotalApplicants] = useState<number>(0);
  const [totalInquiries, setTotalInquiries] = useState<number>(0);
  const [selectedForInterviewCount, setSelectedForInterviewCount] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isProfile = location.pathname.endsWith("/profile");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/staff-login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setStatsLoading(true);
      setStatsError("");
      try {
        const users = await authService.getAllUsers();
        setTotalRegistrations(Array.isArray(users) ? users.length : 0);

        const creds = sessionStorage.getItem("auth");
        const headers = creds ? { Authorization: `Basic ${creds}` } : {};

        // Fetch vacancies count
        try {
          const vacanciesRes = await fetch("/api/vacancies", { headers });
          if (vacanciesRes.ok) {
            const data = await vacanciesRes.json();
            setTotalVacancies(Array.isArray(data.data) ? data.data.length : 0);
          }
        } catch (error) {
          console.error("Failed to fetch vacancies:", error);
          setTotalVacancies(0);
        }

        // Fetch job applications and CV submissions
        try {
          let jobAppCount = 0;
          let cvCount = 0;

          const appRes = await fetch("/api/applications", { headers });
          if (appRes.ok) {
            const data = await appRes.json();
            jobAppCount = Array.isArray(data.data) ? data.data.length : 0;
          }

          const cvRes = await fetch("/api/cv-submissions", { headers });
          if (cvRes.ok) {
            const data = await cvRes.json();
            cvCount = Array.isArray(data.data) ? data.data.length : 0;
          }

          setTotalApplicants(jobAppCount + cvCount);
        } catch (error) {
          console.error("Failed to fetch applicants:", error);
          setTotalApplicants(0);
        }

        // Fetch inquiries count
        try {
          const serviceInqRes = await fetch("/api/inquiries/service", { headers });
          const generalInqRes = await fetch("/api/inquiries/general", { headers });

          let serviceCount = 0;
          let generalCount = 0;

          if (serviceInqRes.ok) {
            const data = await serviceInqRes.json();
            serviceCount = Array.isArray(data.data) ? data.data.length : 0;
          }

          if (generalInqRes.ok) {
            const data = await generalInqRes.json();
            generalCount = Array.isArray(data.data) ? data.data.length : 0;
          }

          setTotalInquiries(serviceCount + generalCount);
        } catch (error) {
          console.error("Failed to fetch inquiries:", error);
          setTotalInquiries(0);
        }

        // Fetch selected interview applicants count
        try {
          const interviewRes = await fetch("/api/interviews", { headers });
          if (interviewRes.ok) {
            const data = await interviewRes.json();
            const interviews = Array.isArray(data.data) ? data.data : [];

            let selectedCount = 0;
            interviews.forEach((interview: any) => {
              if (Array.isArray(interview.applicants)) {
                selectedCount += interview.applicants.filter((app: any) => app.applicationStatus === "SELECTED").length;
              }
              if (Array.isArray(interview.cvApplicants)) {
                selectedCount += interview.cvApplicants.filter((cv: any) => cv.status === "SELECTED").length;
              }
            });

            setSelectedForInterviewCount(selectedCount);
          }
        } catch (error) {
          console.error("Failed to fetch interview applicants:", error);
          setSelectedForInterviewCount(0);
        }
      } catch (error: any) {
        setStatsError(error?.message || "Unable to load dashboard stats");
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const handleLogout = () => {
    authService.logout();
    toast({ title: "Logged out", description: "You have been logged out successfully" });
    navigate("/staff-login");
  };

  const tabItems = [
    { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" as TabType },
    { icon: FileText, label: "Weekly Report", id: "weekly-report" as TabType },
    { icon: UserPlus, label: "Registration Management", id: "registration" as TabType },
    { icon: Users, label: "Registration List", id: "registration-list" as TabType },
    { icon: Users, label: "Interview Management", id: "interview" as TabType },
    { icon: Briefcase, label: "Recruitment", id: "recruitment" as TabType },
    { icon: HelpCircle, label: "Inquiry Management", id: "inquiry-management" as TabType },
    { icon: Users2, label: "Client Management", id: "client-management" as TabType },
    { icon: FileText, label: "Feedback Management", id: "feedback-management" as TabType },
  ];

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    if (tabId !== "registration") setRegistrationView("cards");
  };

  /* ─── Shared header ─── */
  const renderHeader = () => (
    <DashboardHeader
      userName={user?.fullName || "Operation Manager"}
      userRole="Operation Manager"
      onLogout={handleLogout}
      userId={user?.userId || 0}
      backendRole="OPERATION_MANAGER"
      profilePath="/operational-manager/profile"
    />
  );

  /* ─── Footer ─── */
  const renderFooter = () => (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground tracking-wide uppercase">
          © {new Date().getFullYear()} Ace Front Line Security Solutions
        </p>
        <div className="flex items-center gap-6">
          <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer tracking-wide uppercase">Privacy Policy</span>
          <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer tracking-wide uppercase">Security Terms</span>
          <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer tracking-wide uppercase">Support</span>
        </div>
      </div>
    </footer>
  );

  /* ─── View All Users bar ─── */
  const renderUserDirectoryBar = () => (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <ClipboardList className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-foreground mb-1">View All Users</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Access the comprehensive central database of all registered personnel.
            Audit active profiles, update operational status, and review historical data across all levels.
          </p>
        </div>
        <button 
          onClick={() => setRegistrationView("directory")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0"
        >
          <ExternalLink className="h-4 w-4" />
          Open User Directory
        </button>
      </div>
    </div>
  );

  // Profile route
  if (isProfile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader()}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1"><ProfilePage /></main>
        {renderFooter()}
      </div>
    );
  }

  // Registration sub-views
  if (activeTab === "registration" && registrationView === "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader()}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1">
          <AdminRegistration onBack={() => setRegistrationView("cards")} />
        </main>
        {renderFooter()}
      </div>
    );
  }

  if (activeTab === "registration" && registrationView === "security") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader()}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1">
          <SecurityOfficerRegistration onBack={() => setRegistrationView("cards")} />
        </main>
        {renderFooter()}
      </div>
    );
  }

  if (activeTab === "registration" && registrationView === "directory") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader()}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1">
          <UserDirectory onBack={() => setRegistrationView("cards")} />
        </main>
        {renderFooter()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {renderHeader()}

      {/* Main container with sidebar */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-border bg-card text-foreground sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto dark:bg-card dark:text-foreground dark:border-border">
          <nav className="flex flex-col gap-1 p-4">
            {tabItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
        {/* ─── Dashboard Tab ─── */}
        {activeTab === "dashboard" && (
          <div>
            <WelcomeMessage
              userName={user?.fullName || "Operational Manager"}
              userRole="OPERATIONAL_MANAGER"
              actionItems={totalRegistrations}
              successMetrics={`${selectedForInterviewCount} Total Selected Applicants`}
            />

            <div className="mb-6">
              <p className="text-muted-foreground">Key operational statistics for your team.</p>
            </div>

            {statsError && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4 mb-6">
                <p className="text-sm text-destructive">{statsError}</p>
              </div>
            )}

            {statsLoading ? (
              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <p className="text-muted-foreground">Loading dashboard statistics...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                  title="Total Registrations"
                  value={totalRegistrations}
                  description="Total number of users registered in the system."
                />
                <StatCard
                  title="Total Vacancies"
                  value={totalVacancies}
                  description="Total number of job vacancies posted."
                />
                <StatCard
                  title="Total Applicants"
                  value={totalApplicants}
                  description="Total job applications and CV submissions received."
                />
                <StatCard
                  title="Total Inquiries"
                  value={totalInquiries}
                  description="Combined count of service and general inquiries received."
                />
              </div>
            )}
          </div>
        )}

        {/* ─── Weekly Report Tab ─── */}
        {activeTab === "weekly-report" && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Weekly Report</h2>
            <p className="text-muted-foreground mb-8">View and manage weekly reports and summaries.</p>
            <OpManagerWeeklyReport />
          </div>
        )}

        {/* ─── Registration Management Tab ─── */}
        {activeTab === "registration" && registrationView === "cards" && (
          <div>
            <div className="mb-10">
              <h2 className="text-4xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Registration Management</h2>
              <p className="text-muted-foreground">Register new admin personnel, security officers, and area managers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <FeatureCard
                icon={UserPlus}
                title="Admin Personnel"
                description="Complete onboarding for Directors, Chairmen, Operation Managers, and Account Executives. Manage administrative access levels and core platform permissions."
                buttonText="Start Admin Registration"
                onClick={() => setRegistrationView("admin")}
              />
              <FeatureCard
                icon={Shield}
                title="Security Force"
                description="Register Security Officers and Area Managers. Define patrol zones, shift assignments, and operational reporting structures."
                buttonText="Start Staff Registration"
                onClick={() => setRegistrationView("security")}
              />
              <FeatureCard
                icon={Building2}
                title="Client Registration"
                description="Module for onboarding corporate partners, managing service contracts, and configuring site-specific security requirements and personnel needs."
                buttonText="Start Registration"
              />
            </div>

            {renderUserDirectoryBar()}
          </div>
        )}

        {/* ─── Interview Management Tab ─── */}
        {activeTab === "interview" && (
          <div>
            <Interviews />
          </div>
        )}

        {/* ─── Recruitment Tab ─── */}
        {activeTab === "recruitment" && (
          <div>
            <OperationalCareers />
          </div>
        )}

        {/* ─── Inquiry Management Tab ─── */}
        {activeTab === "inquiry-management" && (
          <div>
            <OperationalInquiries />
          </div>
        )}

        {/* ─── Client Management Tab ─── */}
        {activeTab === "client-management" && (
          <div>
            <ClientManagement />
          </div>
        )}

        {/* ─── Feedback Management Tab ─── */}
        {activeTab === "feedback-management" && (
          <div>
            <OperationalManagerFeedback />
          </div>
        )}

        {/* ─── Registration List Tab ─── */}
        {activeTab === "registration-list" && (
          <UserDirectory />
        )}
        </main>
      </div>

      {renderFooter()}
    </div>
  );
}
