import { useState, useEffect } from "react";
import { UserPlus, Shield, Users, Building2 } from "lucide-react";
import AdminRegistration from "./AdminRegistration";
import SecurityOfficerRegistration from "./SecurityOfficerRegistration";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardCard from "@/components/DashboardCard";

export default function OperationalManagerRegistration() {
  const [view, setView] = useState<"cards" | "admin" | "security">("cards");
  const [user, setUser] = useState<any>({ fullName: "Operation Manager", role: "OPERATION_MANAGER" });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser({ fullName: "Operation Manager", role: "OPERATION_MANAGER" });
    // Redirect to login page if needed
  };

  if (view === "admin") {
    return <AdminRegistration onBack={() => setView("cards")} />;
  }
  if (view === "security") {
    return <SecurityOfficerRegistration onBack={() => setView("cards")} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={user?.fullName || "Operation Manager"}
        userRole="Operation Manager"
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome to Ace Frontline Security Solutions</p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <DashboardCard
            icon={UserPlus}
            title="Admin Personnel"
            description="Onboard Directors, Chairmen, Operation Managers, and Account Executives. Grant administrative access to the core platform."
            buttonText="Start Admin Registration"
            onClick={() => setView("admin")}
          />

          <DashboardCard
            icon={Shield}
            title="Security Force"
            description="Onboard Security Officers and Area Managers. Configure patrol routes, designations, and reporting permissions."
            buttonText="Start Staff Registration"
            onClick={() => setView("security")}
          />

          <DashboardCard
            icon={Users}
            title="View All Users"
            description="Browse registered personnel across all roles. View profiles, assigned areas, and manage user status."
            buttonText="View Users"
            variant="outline"
          />
        </div>

        {/* Full Width Card */}
        <DashboardCard
          icon={Building2}
          title="Client Registration"
          description="Register and manage client companies and contracts."
          buttonText="Coming Soon"
          disabled={true}
          variant="outline"
          fullWidth={true}
        />
      </main>
    </div>
  );
}
