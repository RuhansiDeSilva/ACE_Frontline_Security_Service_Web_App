import { useEffect, useState } from "react";
import { UserProfile } from "@/services/authService";
import { Phone, Mail, MapPin, User, CreditCard, Printer, Building2, Calendar, Award, Briefcase, DollarSign, Wrench, CheckCircle2, XCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import GenerateIDCard from "@/components/profile/GenerateIDCard";
import PaysheetHistoryTab from "@/components/profile/PaysheetHistoryTab";
import MonthlyPaysheetTab from "@/components/profile/MonthlyPaysheetTab";
import { loanService } from "@/services/loanService";
import { advanceService } from "@/services/advanceService";

interface ProfileContentProps {
  user: UserProfile;
  activeView?: string;
}

const equipmentLabels: Record<string, string> = {
  TACTICAL_RADIO: "Tactical Radio",
  MOBILE_PHONE: "Mobile Phone",
};

const InfoField = ({ label, value, icon: Icon }: { label: string; value: string | undefined; icon?: any }) => (
  <div className="space-y-1">
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
      {value || "—"}
    </p>
  </div>
);

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
};

const safeDate = (val: any): string => {
  if (!val) return "—";
  if (Array.isArray(val)) {
    const [y, m, d] = val;
    return new Date(y, m - 1, d).toLocaleDateString();
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? String(val) : parsed.toLocaleDateString();
};

const ProfileContent = ({ user, activeView }: ProfileContentProps) => {
  const [myLoans, setMyLoans] = useState<any[]>([]);
  const [myAdvances, setMyAdvances] = useState<any[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [loadingAdvances, setLoadingAdvances] = useState(false);

  useEffect(() => {
    if (activeView === "loan-request") {
      setLoadingLoans(true);
      loanService.getMyLoans()
        .then(setMyLoans)
        .catch(console.error)
        .finally(() => setLoadingLoans(false));
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === "advance-history") {
      setLoadingAdvances(true);
      advanceService.getMyAdvances()
        .then(setMyAdvances)
        .catch(console.error)
        .finally(() => setLoadingAdvances(false));
    }
  }, [activeView]);

  // Loan history view
  if (activeView === "loan-request") {
    const loanStatusBadge = (status: string) => {
      if (status === "APPROVED")
        return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Approved</Badge>;
      if (status === "REJECTED")
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
      return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
    };
    const refreshLoans = () => {
      setLoadingLoans(true);
      loanService.getMyLoans().then(setMyLoans).catch(console.error).finally(() => setLoadingLoans(false));
    };
    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Loan Requests</h2>
            <p className="text-sm text-muted-foreground">Track the status of your loan applications</p>
          </div>
          <Button size="sm" variant="outline" onClick={refreshLoans}>
            <RefreshCw className="w-4 h-4 mr-1" />Refresh
          </Button>
        </div>
        {loadingLoans ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : myLoans.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No loan requests yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Loan Request" in the sidebar to submit one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myLoans.map((loan: any) => (
              <div key={loan.id} className="bg-card rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Loan #{loan.id}</span>
                  {loanStatusBadge(loan.status)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-semibold text-primary">LKR {loan.amount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Repayment</p>
                    <p className="font-medium text-foreground">{loan.repaymentMonths} months</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="font-medium text-foreground">{safeDate(loan.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reviewed</p>
                    <p className="font-medium text-foreground">{safeDate(loan.reviewedAt)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reason</p>
                  <p className="text-sm text-foreground">{loan.reason || "—"}</p>
                </div>
                {loan.rejectionReason && (
                  <div className="bg-red-500/10 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-400">{loan.rejectionReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Advance history view
  if (activeView === "advance-history") {
    const advStatusBadge = (status: string) => {
      if (status === "APPROVED")
        return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Approved</Badge>;
      if (status === "REJECTED")
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
      if (status === "APPROVED_BY_AREA_MANAGER")
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1"><Clock className="w-3 h-3" />Area Approved</Badge>;
      return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
    };
    const refreshAdvances = () => {
      setLoadingAdvances(true);
      advanceService.getMyAdvances().then(setMyAdvances).catch(console.error).finally(() => setLoadingAdvances(false));
    };
    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Advance Requests</h2>
            <p className="text-sm text-muted-foreground">Track the status of your salary advance applications</p>
          </div>
          <Button size="sm" variant="outline" onClick={refreshAdvances}>
            <RefreshCw className="w-4 h-4 mr-1" />Refresh
          </Button>
        </div>
        {loadingAdvances ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : myAdvances.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No advance requests yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Advance Request" in the sidebar to submit one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myAdvances.map((adv: any) => (
              <div key={adv.id} className="bg-card rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Advance #{adv.id} — {adv.forMonth}</span>
                  {advStatusBadge(adv.status)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-semibold text-primary">Rs. {adv.amount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">For Month</p>
                    <p className="font-medium text-foreground">{adv.forMonth}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="font-medium text-foreground">{safeDate(adv.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reason</p>
                  <p className="text-sm text-foreground">{adv.reason || "—"}</p>
                </div>
                {adv.rejectionReason && (
                  <div className="bg-red-500/10 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-400">{adv.rejectionReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show Generated ID Card view
  if (activeView === "generated-id-card") {
    return (
      <div className="flex-1 overflow-auto p-6">
        <GenerateIDCard user={user} />
      </div>
    );
  }

  // Show Paysheet History view
  if (activeView === "paysheet-history") {
    return (
      <div className="flex-1 overflow-auto p-6">
        <PaysheetHistoryTab />
      </div>
    );
  }

  // Show Monthly Paysheet view
  if (activeView === "month-paysheet") {
    return (
      <div className="flex-1 overflow-auto p-6">
        <MonthlyPaysheetTab />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="bg-muted/60 border border-border rounded-full px-1 py-1 h-auto gap-1">
          <TabsTrigger value="personal" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground">Personal Info</TabsTrigger>
          <TabsTrigger value="professional" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground">Professional</TabsTrigger>
          <TabsTrigger value="bank" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground">Bank Details</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6 space-y-6">
          {/* Contact Details & Emergency */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Contact Details
              </h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <InfoField label="Full Name" value={user.fullName} />
                <InfoField label="NIC Number" value={user.nicNumber} icon={CreditCard} />
                <div className="col-span-2">
                  <InfoField label="Residential Address" value={user.residentialAddress} icon={MapPin} />
                </div>
                <InfoField label="Mobile Number" value={user.mobileNumber} icon={Phone} />
                <InfoField label="Email" value={user.email} icon={Mail} />
                <InfoField label="Date of Birth" value={formatDate(user.dateOfBirth)} icon={Calendar} />
                <InfoField label="Sex" value={user.sex === "MALE" ? "Male" : user.sex === "FEMALE" ? "Female" : user.sex} />
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Emergency Contact
              </h3>
              <div className="space-y-4">
                {user.emergencyContact ? (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Emergency Contact</p>
                        <p className="text-xs text-muted-foreground">Primary Contact</p>
                      </div>
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm text-primary font-medium mt-1">{user.emergencyContact}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No emergency contact provided.</p>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Equipment */}
          {user.handoverEquipment && user.handoverEquipment.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  Assigned Equipment
                </h3>
                <button className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                  <Printer className="w-3 h-3" />
                  Print Inventory
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Item Name</th>
                      <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Serial / ID</th>
                      <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Issued Date</th>
                      <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.handoverEquipment.map((eq, idx) => (
                      <tr key={eq} className={idx % 2 === 1 ? "bg-muted/20" : ""}>
                        <td className="px-4 py-3 font-medium text-foreground">{equipmentLabels[eq] || eq.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{`EQ-${String(idx + 1).padStart(3, "0")}-${eq.slice(0, 3)}`}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(user.joinDate)}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded text-[hsl(var(--success))] bg-[hsl(var(--success))]/10">
                            GOOD
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bottom Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user.professionalCertificate && (
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  Certifications
                </h4>
                <div className="space-y-2">
                  {user.professionalCertificate.split(",").map((cert) => (
                    <div key={cert.trim()} className="flex items-center justify-between">
                      <span className="text-xs text-foreground">{cert.trim()}</span>
                      <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded text-[hsl(var(--success))] bg-[hsl(var(--success))]/10">
                        VALID
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user.assignedArea && (
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  Current Post
                </h4>
                <p className="text-sm font-bold text-foreground">{user.assignedArea}</p>
                {user.assignedCompany && <p className="text-xs text-muted-foreground mt-1">{user.assignedCompany}</p>}
                <span className="inline-block mt-2 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded text-[hsl(var(--success))] bg-[hsl(var(--success))]/10">
                  ACTIVE DUTY
                </span>
              </div>
            )}

            {user.specialSkills && (
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  Special Skills
                </h4>
                <div className="space-y-1">
                  {user.specialSkills.split(",").map((skill) => (
                    <p key={skill.trim()} className="text-xs text-foreground">{skill.trim()}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="professional" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Professional Details
              </h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <InfoField label="Assigned Area" value={user.assignedArea} icon={MapPin} />
                <InfoField label="Assigned Company" value={user.assignedCompany} icon={Building2} />
                <InfoField label="Join Date" value={formatDate(user.joinDate)} icon={Calendar} />
                <InfoField label="Basic Salary" value={user.basicSalary ? `LKR ${user.basicSalary.toLocaleString()}` : "—"} icon={DollarSign} />
                {user.designation && <InfoField label="Designation" value={user.designation} />}
                {user.adminPosition && <InfoField label="Position" value={user.adminPosition} />}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                Skills & Certifications
              </h3>
              <div className="space-y-4">
                <InfoField label="Professional Certificates" value={user.professionalCertificate} />
                <InfoField label="Special Skills" value={user.specialSkills} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <div className="max-w-lg bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Bank Details
            </h3>
            <div className="space-y-5">
              <InfoField label="Bank Name" value={user.bankName} icon={Building2} />
              <InfoField label="Account Number" value={user.bankAccountNumber} />
              <InfoField label="Branch" value={user.bankBranch} icon={MapPin} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm">
            <p className="text-muted-foreground text-sm">No documents uploaded yet.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileContent;
