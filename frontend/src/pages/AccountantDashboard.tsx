import { useState, useEffect } from "react";
import { FileText, DollarSign, BarChart3, CreditCard, LayoutDashboard, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthenticatedUser } from "@/hooks/useAuthenticatedUser";
import PayrollContent, { type PayrollSubTab } from "./accountant/PayrollContent";
import ReportsContent from "./accountant/ReportsContent";
import LoanApprovalsContent from "./accountant/LoanApprovalsContent";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardCard from "@/components/DashboardCard";
import WelcomeMessage from "@/components/WelcomeMessage";
import ProfilePage from "@/pages/ProfilePage";
import { authService } from "@/services/authService";
import AdvanceRequests from "./accountant/AdvanceRequests";
import AccountantInvoices from "./accountant/AccountantInvoices";
import AccountantInvoiceQueue from "./accountant/AccountantInvoiceQueue";
import AccountantInvoiceReview from "./accountant/AccountantInvoiceReview";
import AccountantCreateInvoice from "./accountant/AccountantCreateInvoice";
import AccountantCreateDeduction from "./accountant/AccountantCreateDeduction";
import AccountantDeductions from "./accountant/AccountantDeductions";
import AccountantPayments from "./accountant/AccountantPayments";
import AccountantPaymentVerify from "./accountant/AccountantPaymentVerify";
import GeneratePayroll from "./accountant/GeneratePayroll";
import PayrollRecords from "./accountant/PayrollRecords";
import SalaryTrends from "./accountant/SalaryTrends";
import MonthlyStatistics from "@/pages/area-manager/MonthlyStatistics";
import admin_PayrollPage from "./admin_PayrollPage";
import Announcements from "@/pages/Announcements";


import admin_PayrollListPage from "./admin_PayrollListPage";
import admin_PayrollStatisticsPage from "./admin_PayrollStatisticsPage";
import AdminPayrollPageContent from "./AdminPayrollPageContent";
import AdminPayrollListPageContent from "./AdminPayrollListPageContent";

type MainTabType = "dashboard" | "payroll" | "staff-finance" | "invoices" | "deductions" | "payments" | "reports" | "announcements";
type InvoiceSubTab = "list" | "queue" | "create" | "review";
type DeductionSubTab = "list" | "create";
type PaymentSubTab = "list" | "verify";
type PayrollCategoryType = "admin" | "security";


export default function AccountantDashboard() {
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>("dashboard");
  const [activeInvoiceSubTab, setActiveInvoiceSubTab] = useState<InvoiceSubTab>("list");
  const [activeDeductionSubTab, setActiveDeductionSubTab] = useState<DeductionSubTab>("list");
  const [activePaymentSubTab, setActivePaymentSubTab] = useState<PaymentSubTab>("list");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [activePayrollCategory, setActivePayrollCategory] = useState<PayrollCategoryType>("security");

  const [activePayrollTab, setActivePayrollTab] = useState<PayrollSubTab>("generate-payroll");
  const [user, setUser] = useState<any>(null);
  const { user: authUser } = useAuthenticatedUser();
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

  // URL-based route detection for navigation
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/payroll/generate")) {
      setActiveMainTab("staff-finance");
      setActivePayrollTab("generate-payroll");
    } else if (path.includes("/payroll-records")) {
      setActiveMainTab("staff-finance");
      setActivePayrollTab("payroll-records");
    } else if (path.includes("/invoices/queue")) {
      setActiveMainTab("invoices");
      setActiveInvoiceSubTab("queue");
    } else if (path.includes("/invoices/create")) {
      setActiveMainTab("invoices");
      setActiveInvoiceSubTab("create");
    } else if (path.includes("/invoices/review/")) {
      setActiveMainTab("invoices");
      setActiveInvoiceSubTab("review");
      const id = parseInt(path.split("/").pop() || "0");
      if (id) setSelectedInvoiceId(id);
    } else if (path.includes("/invoices")) {
      setActiveMainTab("invoices");
      setActiveInvoiceSubTab("list");
    } else if (path.includes("/payments/verify/")) {
      setActiveMainTab("payments");
      setActivePaymentSubTab("verify");
      const id = parseInt(path.split("/").pop() || "0");
      if (id) setSelectedPaymentId(id);
    } else if (path.includes("/payments")) {
      setActiveMainTab("payments");
      setActivePaymentSubTab("list");
    } else if (path.includes("/deductions/create")) {
      setActiveMainTab("deductions");
      setActiveDeductionSubTab("create");
    } else if (path.includes("/deductions")) {
      setActiveMainTab("deductions");
      setActiveDeductionSubTab("list");
    } else if (path.includes("/announcements")) {
      setActiveMainTab("announcements");
    }
  }, [location.pathname]);


  // Reset payroll tab if switching to admin category while on loan tab
  useEffect(() => {
    if (activePayrollCategory === "admin" && (activePayrollTab === "loan" || activePayrollTab === "advance" || activePayrollTab === "salary-trend")) {
      setActivePayrollTab("generate-payroll");
    }
  }, [activePayrollCategory]);

  const handleLogout = () => {
    authService.logout();
    toast({ title: "Logged out", description: "You have been logged out successfully" });
    navigate("/staff-login");
  };

  const payrollSubTabs = [
    { id: "salary-trend", label: "Salary Trend" },
    { id: "generate-payroll", label: "Generate Payroll" },
    { id: "payroll-records", label: "Payroll Records" },
    { id: "monthly-statistics", label: "Monthly Statistics" },
    { id: "advance", label: "Advance" },
    { id: "loan", label: "Loan" },
  ];



  if (isProfile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          userName={user?.fullName || "Account Executive"}
          userRole="Account Executive"
          onLogout={handleLogout}
          userId={user?.userId || 0}
          backendRole="ACCOUNT_EXECUTIVE"
          profilePath="/account-executive/profile"
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
        userName={user?.fullName || "Account Executive"}
        userRole="Account Executive"
        onLogout={handleLogout}
        userId={user?.userId || 0}
        backendRole="ACCOUNT_EXECUTIVE"
        profilePath="/account-executive/profile"
      />

      {/* Main container with sidebar */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-slate-700 dark:border-slate-300 bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col gap-1 p-4">
            <button
              onClick={() => setActiveMainTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeMainTab === "dashboard"
                ? "bg-primary text-primary-foreground"
                : "text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-950 hover:bg-white/20 dark:hover:bg-slate-950/20"
                }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveMainTab("payroll")}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeMainTab === "payroll"
                ? "bg-primary text-primary-foreground"
                : "text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-950 hover:bg-white/20 dark:hover:bg-slate-950/20"
                }`}
            >
              <DollarSign className="h-4 w-4" />
              Admin Finance
            </button>
            <button
              onClick={() => setActiveMainTab("staff-finance")}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeMainTab === "staff-finance"
                ? "bg-primary text-primary-foreground"
                : "text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-950 hover:bg-white/20 dark:hover:bg-slate-950/20"
                }`}
            >
              <DollarSign className="h-4 w-4" />
              Staff Finance
            </button>
            <button
              onClick={() => setActiveMainTab("invoices")}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeMainTab === "invoices"
                ? "bg-primary text-primary-foreground"
                : "text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-950 hover:bg-white/20 dark:hover:bg-slate-950/20"
                }`}
            >
              <FileText className="h-4 w-4" />
              Invoices
            </button>
            <button
              onClick={() => setActiveMainTab("deductions")}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeMainTab === "deductions"
                ? "bg-primary text-primary-foreground"
                : "text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-950 hover:bg-white/20 dark:hover:bg-slate-950/20"
                }`}
            >
              <CreditCard className="h-4 w-4" />
              Deductions
            </button>
            <button
              onClick={() => setActiveMainTab("payments")}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeMainTab === "payments"
                ? "bg-primary text-primary-foreground"
                : "text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-950 hover:bg-white/20 dark:hover:bg-slate-950/20"
                }`}
            >
              <DollarSign className="h-4 w-4" />
              Payments
            </button>
            <button
              onClick={() => setActiveMainTab("reports")}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeMainTab === "reports"
                ? "bg-primary text-primary-foreground"
                : "text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-950 hover:bg-white/20 dark:hover:bg-slate-950/20"
                }`}
            >
              <BarChart3 className="h-4 w-4" />
              Reports
            </button>
            <button
              onClick={() => setActiveMainTab("announcements")}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeMainTab === "announcements"
                ? "bg-primary text-primary-foreground"
                : "text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-950 hover:bg-white/20 dark:hover:bg-slate-950/20"
                }`}
            >
              <Bell className="h-4 w-4" />
              Announcements
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 py-8 overflow-y-auto flex flex-col lg:flex-row gap-6">
          {/* Dashboard View */}
          {activeMainTab === "dashboard" && (
            <div className="flex-1 space-y-8">
              {/* Welcome Message */}
              <WelcomeMessage
                userName={user?.fullName || "Account Executive"}
                userRole="ACCOUNT_EXECUTIVE"
                actionItems={12}
                successMetrics="18 Payrolls Approved This Month"
              />

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Pending Payroll", value: "12", icon: DollarSign },
                  { label: "Outstanding Invoices", value: "8", icon: FileText },
                  { label: "Monthly Revenue", value: "Rs. 2.4M", icon: BarChart3 },
                ].map((stat, idx) => (
                  <Card key={idx} className="bg-card border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-3xl font-bold text-primary mt-2">{stat.value}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/20">
                          <stat.icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Admin Finance View */}
          {activeMainTab === "payroll" && (
            <div className="flex-1 space-y-8">
              {/* Title */}
              <div className="pb-4">
                <h1 className="text-3xl font-bold text-foreground mb-2">Admin Finance</h1>
                <p className="text-muted-foreground">Process and manage administrative staff payroll</p>
              </div>

              {/* Sub-tabs */}
              <div className="flex gap-2 border-b border-border pb-4 overflow-x-auto">
                {payrollSubTabs
                  .filter(tab => {
                    if (tab.id === "loan" || tab.id === "advance" || tab.id === "salary-trend") return false;
                    return true;
                  })
                  .map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === "monthly-statistics") {
                          navigate("/account-executive/payroll/statistics");
                        } else {
                          setActivePayrollTab(tab.id as PayrollSubTab);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${activePayrollTab === tab.id
                        ? "bg-primary/15 text-primary border-primary/40 shadow-sm"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
              </div>

              {/* Content */}
              {activePayrollTab === "generate-payroll" && <AdminPayrollPageContent />}
              {activePayrollTab === "payroll-records" && <AdminPayrollListPageContent />}
            </div>
          )}

          {/* Staff Finance View (Security Force) */}
          {activeMainTab === "staff-finance" && (
            <div className="flex-1 space-y-8">
              {/* Title */}
              <div className="pb-4">
                <h1 className="text-3xl font-bold text-foreground mb-2">Staff Finance</h1>
                <p className="text-muted-foreground">Manage salary, advances, and loans for the Security Force</p>
              </div>

              {/* Sub-tabs */}
              <div className="flex gap-2 border-b border-border pb-4 overflow-x-auto">
                {payrollSubTabs
                  .map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActivePayrollTab(tab.id as PayrollSubTab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${activePayrollTab === tab.id
                        ? "bg-primary/15 text-primary border-primary/40 shadow-sm"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
              </div>

              {/* Content */}
              {activePayrollTab === "salary-trend" && <SalaryTrends />}
              {activePayrollTab === "generate-payroll" && <GeneratePayroll />}
              {activePayrollTab === "payroll-records" && <PayrollRecords />}
              {activePayrollTab === "monthly-statistics" && <MonthlyStatistics />}
              {activePayrollTab === "advance" && <AdvanceRequests role="Accountant" />}
              {activePayrollTab === "loan" && <LoanApprovalsContent />}
            </div>
          )}

          {/* Invoices View */}
          {activeMainTab === "invoices" && (
            <div className="flex-1">
              {(activeInvoiceSubTab === "list" || activeInvoiceSubTab === "queue") && (
                <AccountantInvoices
                  onCreateClick={() => setActiveInvoiceSubTab("create")}
                  onQueueClick={() => setActiveInvoiceSubTab("queue")}
                  activeTab={activeInvoiceSubTab === "queue" ? "queue" : "list"}
                  onTabChange={(tab) => setActiveInvoiceSubTab(tab)}
                  onReviewClick={(id) => {
                    setSelectedInvoiceId(id);
                    setActiveInvoiceSubTab("review");
                  }}
                />
              )}
              {activeInvoiceSubTab === "create" && (
                <AccountantCreateInvoice
                  onCancel={() => setActiveInvoiceSubTab("list")}
                  onSuccess={() => setActiveInvoiceSubTab("list")}
                />
              )}
              {activeInvoiceSubTab === "review" && selectedInvoiceId && (
                <AccountantInvoiceReview
                  invoiceId={selectedInvoiceId}
                  onBack={() => setActiveInvoiceSubTab("list")}
                />
              )}
            </div>
          )}


          {/* Deductions View */}
          {activeMainTab === "deductions" && (
            <div className="flex-1">
              {activeDeductionSubTab === "list" && (
                <AccountantDeductions onCreateClick={() => setActiveDeductionSubTab("create")} />
              )}
              {activeDeductionSubTab === "create" && (
                <AccountantCreateDeduction
                  onCancel={() => setActiveDeductionSubTab("list")}
                  onSuccess={() => setActiveDeductionSubTab("list")}
                />
              )}
            </div>
          )}

          {/* Payments View */}
          {activeMainTab === "payments" && (
            <div className="flex-1">
              {/* Content */}
              {activePaymentSubTab === "list" && (
                <AccountantPayments
                  onVerifyClick={(id) => {
                    setSelectedPaymentId(id);
                    setActivePaymentSubTab("verify");
                    navigate(`/account-executive/payments/verify/${id}`);
                  }}
                />
              )}
              {activePaymentSubTab === "verify" && selectedPaymentId && (
                <AccountantPaymentVerify
                  paymentIdProp={selectedPaymentId}
                  onBack={() => {
                    setActivePaymentSubTab("list");
                    navigate("/account-executive/payments");
                  }}
                />
              )}
            </div>
          )}

          {/* Reports View */}
          {activeMainTab === "reports" && (
            <div className="flex-1 space-y-8">
              <div className="pb-4">
                <h1 className="text-3xl font-bold text-foreground mb-2">Financial Reports</h1>
                <p className="text-muted-foreground">View and generate comprehensive financial reports</p>
              </div>
              <ReportsContent />
            </div>
          )}
          {activeMainTab === "announcements" && (
            <div className="flex-1">
              <Announcements />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
