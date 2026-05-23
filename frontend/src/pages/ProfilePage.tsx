import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService, UserProfile } from "@/services/authService";
import { extractUserRole } from "@/lib/roleUtils";
import ProfileNavbar from "@/components/profile/ProfileNavbar";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import ProfileContent from "@/components/profile/ProfileContent";
import LoanRequestForm from "@/components/profile/LoanRequestForm";
import AdvanceRequestForm from "@/components/profile/AdvanceRequestForm";
import LeaveRequestForm from "@/components/profile/LeaveRequestForm";
import JsoSchedulePage from "@/pages/JsoSchedulePage";
import MyPayslips from "@/pages/accountant/MyPayslips";
import SecurityOfficerLeaveHistory from "@/pages/SecurityOfficerLeaveHistory";
import AdminLeaveHistory from "@/pages/admin-leave/AdminLeaveHistory";
// import MyLeaveRequests from "@/pages/MyLeaveRequests"; // TODO: Create this component
// import PaysheetView from "@/pages/PaysheetView"; // TODO: Create this component
// import SalaryHistory from "@/pages/SalaryHistory"; // TODO: Create this component
import AdvanceRequests from "@/pages/accountant/AdvanceRequests";
import PaysheetHistoryTab from "@/components/profile/PaysheetHistoryTab";
import { Loader2 } from "lucide-react";

// Admin roles that should display profile in full page without header
const ADMIN_ROLES = ['EXECUTIVE_OFFICER', 'DIRECTOR', 'ACCOUNT_EXECUTIVE', 'ACCOUNTANT', 'OPERATION_MANAGER'];

// Roles that should only see profile overview (no loan/advance request forms)
const RESTRICTED_FORMS_ROLES = ['ACCOUNT_EXECUTIVE', 'AREA_MANAGER', 'EXECUTIVE_OFFICER', 'DIRECTOR', 'CHAIRMAN', 'OPERATION_MANAGER'];

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("overview");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loanOpen, setLoanOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [isAdminRole, setIsAdminRole] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get user role from localStorage
        const storedRole = localStorage.getItem('role');
        const role = extractUserRole(storedRole);
        setUserRole(role);
        setIsAdminRole(ADMIN_ROLES.includes(role));

        const profile = await authService.getMyProfile();
        setUser(profile);
      } catch (err: any) {
        console.error("Failed to load profile:", err);
        if (err?.message?.includes("401") || err?.message?.includes("Unauthorized")) {
          authService.logout();
          navigate("/login");
          return;
        }
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleAvatarChange = async (file: File) => {
    // Preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to backend
    try {
      const updated = await authService.updatePhoto(file);
      setUser(updated);
      // Update localStorage with new photo to persist on refresh
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        userObj.photoUrl = updated.photoUrl;
        localStorage.setItem('user', JSON.stringify(userObj));
      }
    } catch (err) {
      console.error("Failed to upload photo:", err);
    }
  };

  const handleViewChange = (view: string) => {
    if (view === "loan-request") {
      setActiveView("loan-request");
      setLoanOpen(true);
      return;
    }
    if (view === "advance-request") {
      setActiveView("advance-request");
      setAdvanceOpen(true);
      return;
    }
    if (view === "leave-request") {
      setLeaveOpen(true);
      return;
    }
    if (view === "request-leave") {
      setActiveView("request-leave");
      return;
    }
    if (view === "shift-schedule") {
      setActiveView("shift-schedule");
      return;
    }
    if (view === "paysheet") {
      setActiveView("paysheet");
      return;
    }
    if (view === "paysheet-history") {
      setActiveView("paysheet-history");
      return;
    }
    if (view === "advance-history") {
      setActiveView("advance-history");
      return;
    }
    if (view === "change-password") {
      navigate("/change-password");
      return;
    }
    if (view === "deduction-schedule") {
      navigate("/security-officer/deductions");
      return;
    }
    setActiveView(view);
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-destructive font-medium">{error || "User not found"}</p>
        <button
          onClick={() => navigate("/login")}
          className="text-sm text-primary hover:underline"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {!isAdminRole && (
        <ProfileNavbar
          user={user}
          avatarPreview={avatarPreview}
          onProfileClick={() => setActiveView("overview")}
        />
      )}
      <div className={`flex flex-1 overflow-hidden ${isAdminRole ? 'h-screen' : ''}`}>
        <ProfileSidebar
          user={user}
          activeView={activeView}
          onViewChange={handleViewChange}
          avatarPreview={avatarPreview}
          onAvatarChange={handleAvatarChange}
          onLogout={handleLogout}
        />
        {user?.role === "SECURITY_OFFICER" ? (
          activeView === "paysheet" ? (
            <div className="flex-1 overflow-y-auto">
              <MyPayslips mode="latest" />
            </div>
          ) : activeView === "paysheet-history" ? (
            <div className="flex-1 overflow-y-auto">
              <MyPayslips mode="history" />
            </div>
          ) : activeView === "shift-schedule" ? (
            <div className="flex-1 overflow-y-auto">
              <JsoSchedulePage />
            </div>
          ) : activeView === "request-leave" ? (
            <div className="flex-1 overflow-y-auto">
              <SecurityOfficerLeaveHistory />
            </div>
          ) : activeView === "advance-request" ? (
            <div className="flex-1 overflow-y-auto p-6">
              <AdvanceRequests role="Security Officer" />
            </div>
          ) : (
            <ProfileContent user={user} activeView={activeView} />
          )
        ) : activeView === "paysheet" ? (
          <div className="flex-1 overflow-y-auto">
            {/* <PaysheetView /> */}
            <div className="p-4">Paysheet View - Coming Soon</div>
          </div>
        ) : activeView === "paysheet-history" ? (
          <div className="flex-1 overflow-y-auto p-6">
            <PaysheetHistoryTab />
          </div>
        ) : activeView === "advance-history" ? (
          <div className="flex-1 overflow-y-auto">
            <AdvanceRequests />
          </div>
        ) : activeView === "shift-schedule" ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">Shift Schedule - Coming Soon</div>
          </div>
        ) : activeView === "request-leave" ? (
          <div className="flex-1 overflow-y-auto">
            {['AREA_MANAGER', 'EXECUTIVE_OFFICER', 'OPERATION_MANAGER'].includes(user.role) ? (
              <AdminLeaveHistory />
            ) : (
              <div className="p-4">Leave Requests - Coming Soon</div>
            )}
          </div>
        ) : (
          <ProfileContent user={user} activeView={activeView} />
        )}
      </div>

      {/* Dialog forms - only render for roles that support them */}
      {!RESTRICTED_FORMS_ROLES.includes(userRole) && (
        <>
          <LoanRequestForm open={loanOpen} onOpenChange={setLoanOpen} />
          <AdvanceRequestForm open={advanceOpen} onOpenChange={setAdvanceOpen} />
        </>
      )}
      <LeaveRequestForm open={leaveOpen} onOpenChange={setLeaveOpen} />
    </div>
  );
};

export default ProfilePage;
