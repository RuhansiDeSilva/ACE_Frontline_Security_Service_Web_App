import { useState } from "react";
import { UserProfile } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Pencil, Calendar, FileText, LogOut, Shield, DollarSign, CreditCard, BadgeDollarSign, User, CalendarOff, IdCard, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileSidebarProps {
  user: UserProfile;
  activeView: string;
  onViewChange: (view: string) => void;
  avatarPreview: string | null;
  onAvatarChange: (file: File) => void;
  onLogout: () => void;
}

const designationLabels: Record<string, string> = {
  LSO: "Leading Security Officer",
  JSO: "Junior Security Officer",
  SSO: "Senior Security Officer",
  CSO: "Chief Security Officer",
  ISO: "Industrial Security Officer",
};

const roleLabels: Record<string, string> = {
  SECURITY_OFFICER: "Security Officer",
  AREA_MANAGER: "Area Manager",
  ACCOUNT_EXECUTIVE: "Account Executive",
  EXECUTIVE_OFFICER: "Executive Officer",
  OPERATION_MANAGER: "Operational Manager",
  DIRECTOR: "Director",
  CHAIRMAN: "Chairman",
};

// Roles that should only see profile overview tab
const RESTRICTED_NAV_ROLES = ['ACCOUNT_EXECUTIVE', 'AREA_MANAGER', 'EXECUTIVE_OFFICER', 'DIRECTOR', 'CHAIRMAN', 'OPERATION_MANAGER'];

// Navigation items (without loan and advance request forms)
const allNavItems = [
  { icon: User, label: "My Profile", value: "overview" },
  { icon: Calendar, label: "My Schedule", value: "schedule" },
  { icon: FileText, label: "Paysheet History", value: "paysheet-history" },
  { icon: DollarSign, label: "Month Paysheet", value: "month-paysheet" },
  { icon: CreditCard, label: "Advance Request", value: "advance-request" },
  { icon: BadgeDollarSign, label: "Loan Request", value: "loan-request" },
  { icon: BadgeDollarSign, label: "My Deductions", value: "deduction-schedule" },
  { icon: CalendarOff, label: "Leave Request", value: "leave-request" },
  { icon: IdCard, label: "Generated ID Card", value: "generated-id-card" },
  { icon: Lock, label: "Change Password", value: "change-password" },
];

// Navigation items for restricted roles (profile overview, paysheets, leave, ID, password)
const restrictedNavItems = [
  { icon: User, label: "My Profile", value: "overview" },
  { icon: FileText, label: "Paysheet History", value: "paysheet-history" },
  { icon: DollarSign, label: "Month Paysheet", value: "month-paysheet" },
  { icon: CalendarOff, label: "Leave Request", value: "request-leave" },
  { icon: IdCard, label: "Generated ID Card", value: "generated-id-card" },
  { icon: Lock, label: "Change Password", value: "change-password" },
];

// Navigation items for Security Officer
const securityOfficerNavItems = [
  { icon: User, label: "My Profile", value: "overview" },
  { icon: Calendar, label: "Shift Schedule", value: "shift-schedule" },
  { icon: FileText, label: "Paysheet", value: "paysheet" },
  { icon: FileText, label: "Paysheet History", value: "paysheet-history" },
  { icon: CreditCard, label: "Advance Request", value: "advance-request" },
  { icon: BadgeDollarSign, label: "Loan Request", value: "loan-request" },
  { icon: BadgeDollarSign, label: "My Deductions", value: "deduction-schedule" },
  { icon: CalendarOff, label: "Request Leave", value: "request-leave" },
  { icon: IdCard, label: "Generated ID Card", value: "generated-id-card" },
  { icon: Lock, label: "Change Password", value: "change-password" },
];

const ProfileSidebar = ({ user, activeView, onViewChange, avatarPreview, onAvatarChange, onLogout }: ProfileSidebarProps) => {
  const navigate = useNavigate();
  const designation = user.designation ? (designationLabels[user.designation] || user.designation) : (roleLabels[user.role] || user.role);
  const [isActive] = useState(user.active ?? true);

  // Determine which navigation items to show based on user role
  let navItems: typeof allNavItems;
  if (user.role === 'SECURITY_OFFICER') {
    navItems = securityOfficerNavItems;
  } else if (RESTRICTED_NAV_ROLES.includes(user.role)) {
    navItems = restrictedNavItems;
  } else {
    navItems = allNavItems;
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onAvatarChange(file);
    }
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-border bg-card">
      {/* Profile Card */}
      <div className="p-6 flex flex-col items-center border-b border-border">
        <div className="relative mb-4 group cursor-pointer">
          <label className="cursor-pointer">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-amber-400 relative bg-muted flex items-center justify-center">
              {avatarPreview || user.photoUrl ? (
                <img
                  src={avatarPreview || user.photoUrl}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-[10px] font-semibold">Change Photo</span>
              </div>
            </div>
            <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={handleAvatarUpload} />
          </label>
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-card ${isActive ? "bg-[hsl(var(--success))]" : "bg-muted-foreground"}`} />
        </div>
        <h2 className="text-[19px] font-bold text-foreground text-center">{user.fullName}</h2>
        <span className="text-[13px] font-semibold tracking-wider uppercase text-amber-500 mt-1">
          {designation}
        </span>
        <span className="text-[13px] text-muted-foreground mt-1">
          <Shield className="inline w-3 h-3 mr-1" />
          {`SL-${user.designation || "SO"}-${String(user.id).padStart(4, "0")}`}
        </span>

        {/* Active Status */}
        <div className="flex items-center gap-3 mt-4 w-full">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Duty Status</span>
            <span className={`text-[15px] font-semibold ${isActive ? "text-[hsl(var(--success))]" : "text-muted-foreground"}`}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <Button
          className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
          onClick={() => navigate("/edit-profile")}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-auto">
        {navItems.map((item) => (
          <button
            key={item.value}
            onClick={() => onViewChange(item.value)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] transition-colors ${
              activeView === item.value
                ? "bg-primary/10 text-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default ProfileSidebar;
