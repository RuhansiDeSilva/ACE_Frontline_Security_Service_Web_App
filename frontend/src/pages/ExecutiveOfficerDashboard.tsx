import { useState, useEffect } from "react";
import { CheckCircle2, DollarSign, TrendingUp, Award, User, LogOut, Menu, X, Shirt, Calendar, Check, AlertCircle, XCircle, Loader, FileText, Bell, HelpCircle } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { loanService, type LoanRequest } from "@/services/loanService";
import { notificationService } from "@/services/notificationService";
import { addNotification } from "@/lib/notifications";
import DashboardHeader from "@/components/DashboardHeader";
import WelcomeMessage from "@/components/WelcomeMessage";
import ProfilePage from "@/pages/ProfilePage";
import { useAuthenticatedUser } from "@/hooks/useAuthenticatedUser";
import { authService } from "@/services/authService";
import Announcements from "@/pages/Announcements";
import AdminInquiries from "@/pages/AdminInquiries";
// import AdminLeaveHistory from "@/pages/AdminLeaveHistory"; // TODO: Create this component

export default function ExecutiveOfficerDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuthenticatedUser();
  const isProfile = location.pathname.endsWith("/profile");

  // new states
  // make sure every loan in the array has a defined `user`
  const [pendingLoans, setPendingLoans] = useState<
    (LoanRequest & { user: NonNullable<LoanRequest["user"]> })[]
  >([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingLoanId, setRejectingLoanId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approvedLoans, setApprovedLoans] = useState<(LoanRequest & { user: NonNullable<LoanRequest["user"]>, approvalDate?: string })[]>([]);
  const [rejectedLoans, setRejectedLoans] = useState<(LoanRequest & { user: NonNullable<LoanRequest["user"]>, rejectionDate?: string })[]>([]);

  // sidebar / cards definitions placed before effects
  const sidebarItems = [
    { icon: CheckCircle2, label: "Loan Approvals", id: "loan-approvals", link: "/loan-approval" },
    { icon: Award, label: "Approval Format", id: "approval-format", link: "#" },
    { icon: Shirt, label: "Uniform Distribution", id: "uniform", link: "#" },
    { icon: HelpCircle, label: "Inquiries", id: "inquiries", link: "#" },
    { icon: Bell, label: "Announcements", id: "announcements", link: "#" },
  ];

  const [activeItem, setActiveItem] = useState(sidebarItems[0].id);

  const performanceCards = [
    {
      icon: CheckCircle2,
      title: "Review Loans",
      desc: "Approve or reject pending loan requests from staff.",
      buttonText: "Go to loans",
      link: "/loan-approval",
    },
    {
      icon: TrendingUp,
      title: "View Reports",
      desc: "Analyze financial trends and create reports.",
      buttonText: "Open reports",
      link: "#",
    },
    {
      icon: DollarSign,
      title: "Portfolio Overview",
      desc: "Monitor the current loan portfolio and balances.",
      buttonText: "See portfolio",
      link: "#",
    },
  ];

  // fetch pending loans when loan-approvals active with polling
  useEffect(() => {
    if (activeItem === "loan-approvals") {
      // Fetch immediately
      const fetchLoans = () => {
        return loanService.getPendingLoans()
          .then((loans) => {
            const filtered = loans.filter(
              (l): l is LoanRequest & { user: NonNullable<LoanRequest["user"]> } =>
                l.user?.role === "SECURITY_OFFICER"
            );
            setPendingLoans(filtered);
          })
          .catch(console.error);
      };
      setLoadingLoans(true);
      fetchLoans().finally(() => setLoadingLoans(false));

      // Poll every 10 seconds
      const interval = setInterval(() => {
        fetchLoans();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [activeItem]);

  // fetch all loans (approved & rejected) when approval-format active with polling
  useEffect(() => {
    if (activeItem === "approval-format") {
      // Fetch immediately
      const fetchLoans = () => {
        return loanService.getAllLoans()
          .then((loans) => {
            const approved = loans.filter(
              (l): l is LoanRequest & { user: NonNullable<LoanRequest["user"]> } =>
                l.status === "APPROVED" && l.user?.role === "SECURITY_OFFICER"
            );
            const rejected = loans.filter(
              (l): l is LoanRequest & { user: NonNullable<LoanRequest["user"]> } =>
                l.status === "REJECTED" && l.user?.role === "SECURITY_OFFICER"
            );
            setApprovedLoans(approved);
            setRejectedLoans(rejected);
          })
          .catch(console.error);
      };

      setLoadingLoans(true);
      fetchLoans().finally(() => setLoadingLoans(false));

      // Poll every 10 seconds
      const interval = setInterval(() => {
        fetchLoans();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [activeItem]);

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Error",
        description: "User data could not be loaded. Please log in again.",
        variant: "destructive",
      });
      navigate("/staff-login");
    }
  }, [isLoading, user, toast, navigate]);

  // Show loading state while user data is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Ensure user is loaded before rendering
  if (!user) {
    return null;
  }

  const handleLogout = () => {
    authService.logout();
    toast({ title: "Logged out", description: "You have been logged out successfully" });
    navigate("/staff-login");
  };

  if (isProfile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          userName={user.fullName}
          userRole="Executive Officer"
          onLogout={handleLogout}
          userId={user.userId || 0}
          backendRole="EXECUTIVE_OFFICER"
          profilePath="/executive-officer/profile"
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
        userName={user.fullName}
        userRole="Executive Officer"
        onLogout={handleLogout}
        userId={user.userId || 0}
        backendRole="EXECUTIVE_OFFICER"
        profilePath="/executive-officer/profile"
      />

      {/* Main container with sidebar */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-slate-700 dark:border-slate-300 bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col gap-1 p-4">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.link && item.link !== "#") navigate(item.link);
                  setActiveItem(item.id);
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeItem === item.id
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

        {/* Main content */}
        <main className="flex-1 px-4 sm:px-6 py-8 overflow-y-auto flex flex-col">
          {activeItem === "loan-approvals" && (
            <div>
              <WelcomeMessage
                userName={user?.fullName || "Executive Officer"}
                userRole="EXECUTIVE_OFFICER"
                actionItems={pendingLoans.length}
                successMetrics={`${approvedLoans.length} Loans Approved`}
              />
              <p className="text-muted-foreground mb-8">Review and approve pending loan applications.</p>
              {/* overview cards (same as screenshot) */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {performanceCards.map((card, idx) => (
                  <Card
                    key={idx}
                    className="overflow-hidden border-border/60 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
                  >
                    <CardContent className="flex flex-col items-center p-8 text-center">
                      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                        <card.icon className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-foreground">{card.title}</h3>
                      <p className="mb-6 text-sm text-muted-foreground">{card.desc}</p>
                      <Button
                        onClick={() => navigate(card.link)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      >
                        {card.buttonText}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {loadingLoans ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading pending loans...</p>
                  </div>
                </div>
              ) : pendingLoans.length === 0 ? (
                <Card className="bg-card border-border/60">
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">No pending loans to review</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/60">
                        <TableHead className="text-foreground font-semibold">Loan ID</TableHead>
                        <TableHead className="text-foreground font-semibold">Security Officer Name</TableHead>
                        <TableHead className="text-foreground font-semibold">Amount (LKR)</TableHead>
                        <TableHead className="text-foreground font-semibold">Repayment Period</TableHead>
                        <TableHead className="text-foreground font-semibold">Reason / Details</TableHead>
                        <TableHead className="text-foreground font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLoans.map((loan) => {
                        const userInfo = loan.user;
                        return (
                          <TableRow key={loan.id} className="border-border/60 hover:bg-muted/50">
                            <TableCell className="font-mono text-foreground font-medium">#{loan.id}</TableCell>
                            <TableCell className="text-foreground font-medium">{userInfo.fullName}</TableCell>
                            <TableCell className="text-foreground font-semibold">{Math.round(loan.amount).toLocaleString()}</TableCell>
                            <TableCell className="text-foreground">{loan.repaymentMonths} months</TableCell>
                            <TableCell className="text-muted-foreground max-w-xs truncate" title={loan.reason}>{loan.reason}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-foreground"
                                  onClick={async () => {
                                    try {
                                      await loanService.reviewLoan(loan.id, {
                                        approved: true,
                                      });
                                      setPendingLoans(prev => prev.filter(l => l.id !== loan.id));
                                      
                                      // Add to approved loans
                                      setApprovedLoans(prev => [...prev, { ...loan, approvalDate: new Date().toISOString() }]);
                                      
                                      // Send backend notification to security officer
                                      try {
                                        await notificationService.notifyUser(
                                          userInfo.id,
                                          `Your loan request for LKR ${Math.round(loan.amount).toLocaleString()} has been APPROVED. A monthly deduction schedule of ${loan.repaymentMonths} months will be applied to your salary.`
                                        );
                                      } catch (notifyErr) {
                                        console.error("Failed to send notification:", notifyErr);
                                      }
                                      
                                      // Notify all account executives about approval (role-based broadcast)
                                      try {
                                        await notificationService.notifyRole(
                                          "ACCOUNT_EXECUTIVE",
                                          `LOAN APPROVED: ${userInfo.fullName} - LKR ${Math.round(loan.amount).toLocaleString()} for ${loan.repaymentMonths} months. Deduction schedule has been generated.`
                                        );
                                      } catch (broadcastErr) {
                                        console.error("Failed to broadcast notification:", broadcastErr);
                                      }
                                      
                                      toast({
                                        title: "Approved",
                                        description: `Loan #${loan.id} approved. Notifications sent to security officer and account executives.`,
                                      });
                                    } catch (e) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to approve loan",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setRejectingLoanId(loan.id);
                                    setRejectReason("");
                                    setRejectDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          )}

          {activeItem === "approval-format" && (
            <div className="space-y-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground">Approval Format Summary</h2>
                <p className="text-muted-foreground mt-2">View all approved and rejected loan requests</p>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card border-border/60">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Approved</p>
                      <p className="text-2xl font-bold text-foreground">{approvedLoans.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border/60">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Rejected</p>
                      <p className="text-2xl font-bold text-foreground">{rejectedLoans.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border/60">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Approved Amount</p>
                      <p className="text-2xl font-bold text-foreground">LKR {approvedLoans.reduce((sum, l) => sum + (l.amount || 0), 0).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Approved Loans */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">Approved Loans</h3>
                {approvedLoans.length === 0 ? (
                  <Card className="bg-card border-border/60">
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">No approved loans yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {approvedLoans.map((loan) => (
                      <Card key={loan.id} className="bg-green-500/5 border-green-500/30 overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/20">
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">Loan Approved</p>
                                  <p className="text-sm text-muted-foreground">Loan ID: #{loan.id}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Security Officer</p>
                                  <p className="font-medium text-foreground">{loan.user.fullName}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Amount</p>
                                  <p className="font-semibold text-green-600">LKR {Math.round(loan.amount).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Repayment Period</p>
                                  <p className="font-medium text-foreground">{loan.repaymentMonths} months</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Approval Date</p>
                                  <p className="font-medium text-foreground">{new Date().toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Reason</p>
                                <p className="text-sm text-foreground">{loan.reason}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Rejected Loans */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">Rejected Loans</h3>
                {rejectedLoans.length === 0 ? (
                  <Card className="bg-card border-border/60">
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">No rejected loans yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {rejectedLoans.map((loan) => (
                      <Card key={loan.id} className="bg-red-500/5 border-red-500/30 overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/20">
                                  <XCircle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">Loan Rejected</p>
                                  <p className="text-sm text-muted-foreground">Loan ID: #{loan.id}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Security Officer</p>
                                  <p className="font-medium text-foreground">{loan.user.fullName}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Amount</p>
                                  <p className="font-semibold text-red-600">LKR {Math.round(loan.amount).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Repayment Period</p>
                                  <p className="font-medium text-foreground">{loan.repaymentMonths} months</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Rejection Date</p>
                                  <p className="font-medium text-foreground">{new Date().toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Reason</p>
                                <p className="font-medium text-foreground">{loan.reason}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Rejection Reason</p>
                                <p className="text-sm text-red-600">{loan.rejectionReason || "No reason provided"}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeItem === "inquiries" && (
            <AdminInquiries />
          )}

          {activeItem === "announcements" && (
            <Announcements />
          )}

          {/* Additional activeItem sections can be added here */}

          {activeItem === "uniform" && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold">Uniform Distribution</h2>
                <p className="text-muted-foreground">Manage security personnel uniform inventory</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Shirt, label: "Total Uniforms", value: "157" },
                  { icon: Shirt, label: "Pending", value: "12" },
                  { icon: Shirt, label: "Returned", value: "8" },
                ].map((stat, idx) => (
                  <Card key={idx} className="border-border/40 bg-card">
                    <CardContent className="p-6 flex items-center gap-4">
                      <stat.icon className="h-6 w-6 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}


        </main>
      </div>

      {/* Reject Loan Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Reject Loan Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Reason for Rejection</Label>
            <Textarea
              placeholder="Please provide a reason for rejecting this loan request..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!rejectingLoanId || !rejectReason.trim()) {
                  toast({
                    title: "Error",
                    description: "Please provide a reason for rejection",
                    variant: "destructive",
                  });
                  return;
                }
                try {
                  const loan = pendingLoans.find(l => l.id === rejectingLoanId);
                  await loanService.reviewLoan(rejectingLoanId, {
                    approved: false,
                    rejectionReason: rejectReason.trim(),
                  });
                  setPendingLoans(prev => prev.filter(l => l.id !== rejectingLoanId));
                  
                  // Add to rejected loans
                  if (loan) {
                    setRejectedLoans(prev => [...prev, { ...loan, rejectionReason: rejectReason.trim(), rejectionDate: new Date().toISOString() }]);
                  }
                  
                  // Send backend notification to security officer about rejection
                  try {
                    await notificationService.notifyUser(
                      loan?.user?.id || 0,
                      `Your loan request for LKR ${Math.round(loan?.amount || 0).toLocaleString()} has been REJECTED. Reason: ${rejectReason.trim()}`
                    );
                  } catch (notifyErr) {
                    console.error("Failed to notify security officer:", notifyErr);
                  }
                  
                  // Notify all account executives about rejection (role-based broadcast)
                  try {
                    await notificationService.notifyRole(
                      "ACCOUNT_EXECUTIVE",
                      `LOAN REJECTED: ${loan?.user?.fullName} - LKR ${Math.round(loan?.amount || 0).toLocaleString()}. Reason: ${rejectReason.trim()}`
                    );
                  } catch (broadcastErr) {
                    console.error("Failed to broadcast rejection:", broadcastErr);
                  }
                  
                  toast({
                    title: "Rejected",
                    description: `Loan #${rejectingLoanId} rejected. Notifications sent to security officer and account executives.`,
                  });
                  setRejectDialogOpen(false);
                  setRejectingLoanId(null);
                  setRejectReason("");
                } catch (e) {
                  toast({
                    title: "Error",
                    description: e instanceof Error ? e.message : "Failed to reject loan",
                    variant: "destructive",
                  });
                }
              }}
            >
              <XCircle className="w-3 h-3 mr-1" />Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
