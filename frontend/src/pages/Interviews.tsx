import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, ChevronDown, ChevronRight, User, Calendar, MapPin, Clock,
  Download, Users, CheckCircle2, CalendarClock, ClipboardList, Mail, Phone,
  Search, Trash2, ArrowUpDown, UserCheck, Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InterviewApplicant {
  applicationId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  applicationStatus: string;
}

interface CvApplicant {
  cvSubmissionId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  status: string;
}

interface InterviewRecord {
  id: number;
  vacancyId: number | null;
  vacancyTitle?: string;
  interviewDate: string;
  interviewTime: string;
  interviewLocation: string;
  createdAt?: string;
  applicants: InterviewApplicant[];
  cvApplicants?: CvApplicant[];
  interviewerRoles?: string[];
}

const ROLE_LABELS: Record<string, string> = {
  DIRECTOR: "Director",
  EXECUTIVE: "Executive",
  CHAIRMAN: "Chairman",
  ACCOUNTANT: "Accountant",
  AREA_MANAGER: "Area Manager",
};

const Interviews = () => {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "vacancy" | "candidates">("date-desc");
  const [vacancyFilter, setVacancyFilter] = useState<number | "ALL">("ALL");

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InterviewRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Select modal state (for job applications)
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectTarget, setSelectTarget] = useState<InterviewApplicant | null>(null);
  const [reportDate, setReportDate] = useState("");
  const [selectDescription, setSelectDescription] = useState("");
  const [selectLoading, setSelectLoading] = useState(false);

  // Select modal state for CV submissions
  const [cvSelectModalOpen, setCvSelectModalOpen] = useState(false);
  const [cvSelectTarget, setCvSelectTarget] = useState<CvApplicant | null>(null);
  const [cvReportDate, setCvReportDate] = useState("");
  const [cvSelectDescription, setCvSelectDescription] = useState("");
  const [cvSelectLoading, setCvSelectLoading] = useState(false);

  const { toast } = useToast();

  const authHeaders = (): HeadersInit => {
    const creds = sessionStorage.getItem("auth");
    return creds ? { Authorization: `Basic ${creds}` } : {};
  };

  const fetchInterviews = async () => {
    try {
      const r = await fetch("/api/interviews", { headers: authHeaders() });
      if (r.ok) {
        const d = await r.json();
        if (d && Array.isArray(d.data)) {
          setInterviews(d.data);
        }
      }
    } catch (err) {
      console.error("Failed to load interviews:", err);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  // Unique vacancies in interviews for filter dropdown
  const interviewVacancies = useMemo(() => {
    const map = new Map<number, string>();
    interviews.forEach(i => {
      if (i.vacancyId !== null && !map.has(i.vacancyId)) {
        map.set(i.vacancyId, i.vacancyTitle || `Vacancy #${i.vacancyId}`);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [interviews]);

  const openSelectModal = (app: InterviewApplicant) => {
    setSelectTarget(app);
    setReportDate("");
    setSelectDescription("");
    setSelectModalOpen(true);
  };

  const handleConfirmSelect = async () => {
    if (!selectTarget) return;
    if (!reportDate) {
      toast({ title: "Date Required", description: "Please select a reporting date.", variant: "destructive" });
      return;
    }
    setSelectLoading(true);
    try {
      const res = await fetch(`/api/applications/${selectTarget.applicationId}/select`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ reportDate, description: selectDescription }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Candidate Selected", description: `Selection email sent to ${selectTarget.fullName}.` });
      setSelectModalOpen(false);
      fetchInterviews();
    } catch {
      toast({ title: "Error", description: "Unable to mark selection", variant: "destructive" });
    } finally {
      setSelectLoading(false);
    }
  };

  // CV Select modal functions
  const openCvSelectModal = (cv: CvApplicant) => {
    setCvSelectTarget(cv);
    setCvReportDate("");
    setCvSelectDescription("");
    setCvSelectModalOpen(true);
  };

  const handleConfirmCvSelect = async () => {
    if (!cvSelectTarget) return;
    if (!cvReportDate) {
      toast({ title: "Date Required", description: "Please select a reporting date.", variant: "destructive" });
      return;
    }
    setCvSelectLoading(true);
    try {
      const res = await fetch(`/api/cv-submissions/${cvSelectTarget.cvSubmissionId}/select`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ reportDate: cvReportDate, description: cvSelectDescription }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Candidate Selected", description: `Selection email sent to ${cvSelectTarget.fullName}.` });
      setCvSelectModalOpen(false);
      fetchInterviews();
    } catch {
      toast({ title: "Error", description: "Unable to mark selection", variant: "destructive" });
    } finally {
      setCvSelectLoading(false);
    }
  };

  // Stats
  const totalCandidates = useMemo(() => interviews.reduce((sum, i) => sum + i.applicants.length + (i.cvApplicants?.length || 0), 0), [interviews]);
  const selectedCount = useMemo(() => interviews.reduce((sum, i) => sum + i.applicants.filter(a => a.applicationStatus === "SELECTED").length + (i.cvApplicants?.filter(cv => cv.status === "SELECTED").length || 0), 0), [interviews]);
  const pendingCount = totalCandidates - selectedCount;

  // Filter interviews by search + vacancy filter
  const filteredInterviews = useMemo(() => {
    let result = interviews;
    if (vacancyFilter !== "ALL") {
      result = result.filter(i => i.vacancyId === vacancyFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        (i.vacancyTitle || "").toLowerCase().includes(q) ||
        i.interviewLocation.toLowerCase().includes(q) ||
        i.interviewDate.includes(q) ||
        i.applicants.some(a => a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)) ||
        (i.cvApplicants || []).some(cv => cv.fullName.toLowerCase().includes(q) || cv.email.toLowerCase().includes(q))
      );
    }
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return a.interviewDate.localeCompare(b.interviewDate) || a.interviewTime.localeCompare(b.interviewTime);
        case "date-desc":
          return b.interviewDate.localeCompare(a.interviewDate) || b.interviewTime.localeCompare(a.interviewTime);
        case "vacancy":
          return (a.vacancyTitle || "").localeCompare(b.vacancyTitle || "");
        case "candidates":
          return (b.applicants.length + (b.cvApplicants?.length || 0)) - (a.applicants.length + (a.cvApplicants?.length || 0));
        default:
          return 0;
      }
    });
  }, [interviews, searchQuery, sortBy, vacancyFilter]);

  // Group filtered interviews by session (date + time + location)
  // Each session may contain interviews from different vacancies
  const groupedSessions = useMemo(() => {
    const map = new Map<string, InterviewRecord[]>();
    filteredInterviews.forEach(i => {
      const key = `${i.interviewDate}|${i.interviewTime}|${i.interviewLocation}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(i);
    });
    return Array.from(map.entries()).map(([key, records]) => {
      const [date, time, location] = key.split("|");
      const totalApplicants = records.reduce((s, r) => s + r.applicants.length + (r.cvApplicants?.length || 0), 0);
      const selectedApplicants = records.reduce((s, r) => s + r.applicants.filter(a => a.applicationStatus === "SELECTED").length + (r.cvApplicants?.filter(cv => cv.status === "SELECTED").length || 0), 0);
      // Collect unique interviewer roles across all records in the session
      const allRoles = [...new Set(records.flatMap(r => r.interviewerRoles || []))];
      return { key, date, time, location, records, totalApplicants, selectedApplicants, allRoles };
    });
  }, [filteredInterviews]);

  const handleDeleteInterview = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/interviews/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Interview Deleted", description: `Interview for "${deleteTarget.vacancyTitle || "Vacancy #" + deleteTarget.vacancyId}" has been deleted.` });
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchInterviews();
    } catch {
      toast({ title: "Error", description: "Unable to delete interview.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative rounded-2xl overflow-hidden bg-card p-5 text-foreground shadow-xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#FFD700]/25 via-[#FFD700]/8 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-40 h-40 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FFD700]/15 rounded-xl border border-[#FFD700]/20">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Interview Management</h2>
              <p className="text-sm text-foreground/50">Track and manage all scheduled interviews</p>
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <ClipboardList className="h-4 w-4 mx-auto mb-1.5 text-primary" />
            <p className="text-xl font-bold">{interviews.length}</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-0.5">Interviews</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <Users className="h-4 w-4 mx-auto mb-1.5 text-purple-400" />
            <p className="text-xl font-bold">{totalCandidates}</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-0.5">Total Candidates</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <Clock className="h-4 w-4 mx-auto mb-1.5 text-amber-400" />
            <p className="text-xl font-bold">{pendingCount}</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-0.5">Awaiting Selection</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <CheckCircle2 className="h-4 w-4 mx-auto mb-1.5 text-emerald-400" />
            <p className="text-xl font-bold">{selectedCount}</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-0.5">Selected</p>
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by vacancy, candidate name, location, or date..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary flex-shrink-0" />
          <select
            value={vacancyFilter === "ALL" ? "ALL" : String(vacancyFilter)}
            onChange={e => setVacancyFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 min-w-[180px]"
          >
            <option value="ALL">All Vacancies</option>
            {interviewVacancies.map(v => (
              <option key={v.id} value={v.id}>{v.title}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sort:</span>
          {([
            { value: "date-desc" as const, label: "Newest" },
            { value: "date-asc" as const, label: "Oldest" },
            { value: "vacancy" as const, label: "Vacancy" },
            { value: "candidates" as const, label: "Candidates" },
          ]).map(s => (
            <Button
              key={s.value}
              size="sm"
              variant={sortBy === s.value ? "default" : "outline"}
              className={sortBy === s.value ? "bg-card hover:bg-[#FFD700] hover:text-[#1A1A1B] text-foreground text-xs h-7 px-3" : "text-xs h-7 px-3 border-[#FFD700]/30 hover:bg-[#FFD700]/10"}
              onClick={() => setSortBy(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredInterviews.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <CalendarClock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {searchQuery || vacancyFilter !== "ALL" ? "No matching interviews" : "No interviews scheduled"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery || vacancyFilter !== "ALL"
                ? "Try adjusting your search or filter to find what you're looking for."
                : "Schedule interviews from the Recruitment page to get started."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Interview Session Cards */}
      <div className="space-y-4">
        {groupedSessions.map(session => (
          <Card key={session.key} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-[#FFD700]/40">
            <button
              type="button"
              onClick={() => setExpandedId(prev => prev === session.key ? null : session.key)}
              className="w-full px-6 py-5 bg-gradient-to-r from-muted/60 to-muted/30 hover:from-muted hover:to-muted/50 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  {/* Date, Time, Location */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
                      <Calendar className="h-3.5 w-3.5" />
                      {session.date}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-purple-800 bg-purple-100 px-3 py-1 rounded-full">
                      <Clock className="h-3.5 w-3.5" />
                      {session.time}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-orange-800 bg-orange-100 px-3 py-1 rounded-full">
                      <MapPin className="h-3.5 w-3.5" />
                      {session.location}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
                      {session.totalApplicants} candidate{session.totalApplicants !== 1 ? "s" : ""}
                    </span>
                    {session.records.length > 1 && (
                      <span className="text-xs bg-[#FFD700]/10 text-[#1A1A1B] px-2.5 py-1 rounded-full font-medium">
                        {session.records.length} vacancies
                      </span>
                    )}
                    {session.selectedApplicants > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {session.selectedApplicants} selected
                      </span>
                    )}
                  </div>

                  {/* Interviewers */}
                  {session.allRoles.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <UserCheck className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs text-muted-foreground font-medium">Interviewers:</span>
                      {session.allRoles.map(role => (
                        <span key={role} className="text-xs bg-card/10 text-[#1A1A1B] px-2 py-0.5 rounded-full font-medium">
                          {ROLE_LABELS[role] || role}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 ml-4">
                  {expandedId === session.key
                    ? <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                </div>
              </div>
            </button>

            {expandedId === session.key && (
              <CardContent className="pt-4 space-y-5 border-t">
                {/* Action buttons */}
                <div className="flex items-center gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => {
                    // Export all candidates across vacancies
                    const header = "Vacancy,Application ID,Full Name,Email,Phone,Status";
                    const rows = session.records.flatMap(r =>
                      r.applicants.map(a =>
                        `"${r.vacancyTitle || "Vacancy #" + r.vacancyId}",${a.applicationId},"${a.fullName}","${a.email}","${a.phoneNumber}","${a.applicationStatus}"`
                      )
                    );
                    const csv = [header, ...rows].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `interview_${session.date}.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }} className="flex items-center gap-1.5 text-xs">
                    <Download className="h-3.5 w-3.5" /> Export CSV
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => {
                    // Delete the first interview record (or all)
                    setDeleteTarget(session.records[0]);
                    setDeleteModalOpen(true);
                  }} className="flex items-center gap-1.5 text-xs">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>

                {/* Interviewees grouped by vacancy */}
                {session.records.map(interview => (
                  <div key={interview.id} className="space-y-3">
                    {/* Only show vacancy-based applicants (not CV submissions) */}
                    {interview.vacancyId !== null && (
                      <>
                        {/* Vacancy header */}
                        <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                          <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-[#FFD700]/10">
                            <Briefcase className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <h4 className="text-sm font-semibold text-foreground">
                            {interview.vacancyTitle || `Vacancy #${interview.vacancyId}`}
                          </h4>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                            {interview.applicants.length} candidate{interview.applicants.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Job Applicant cards */}
                        <div className="space-y-2.5 ml-2">
                          {interview.applicants.map(app => (
                            <div key={app.applicationId} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                              app.applicationStatus === "SELECTED" ? "bg-green-50/50 border-green-200" : "hover:bg-muted/30"
                            }`}>
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                app.applicationStatus === "SELECTED" ? "bg-green-100" : "bg-primary/10"
                              }`}>
                                <User className={`h-5 w-5 ${app.applicationStatus === "SELECTED" ? "text-green-700" : "text-primary"}`} />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <p className="font-semibold text-foreground">{app.fullName}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {app.email}</span>
                                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {app.phoneNumber}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                                  app.applicationStatus === "SELECTED" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                                }`}>
                                  {app.applicationStatus === "SELECTED" ? "Selected" :
                                   app.applicationStatus === "INTERVIEW_SENT" ? "Interview Sent" :
                                   app.applicationStatus}
                                </span>
                                {app.applicationStatus !== "SELECTED" && (
                                  <Button size="sm" onClick={() => openSelectModal(app)} className="bg-green-600 hover:bg-green-700 text-foreground">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Select
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* CV Submissions as separate section */}
                {session.records.some(r => (r.cvApplicants?.length || 0) > 0) && (
                  <div className="space-y-3 border-t pt-4 mt-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-cyan-50">
                        <Briefcase className="h-3.5 w-3.5 text-cyan-500" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">
                        CV Submissions
                      </h4>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        {session.records.reduce((sum, r) => sum + (r.cvApplicants?.length || 0), 0)} candidate{session.records.reduce((sum, r) => sum + (r.cvApplicants?.length || 0), 0) !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* CV Applicant cards */}
                    <div className="space-y-2.5 ml-2">
                      {session.records.flatMap(interview =>
                        (interview.cvApplicants || []).map(cv => (
                          <div key={`cv-${cv.cvSubmissionId}`} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                            cv.status === "SELECTED" ? "bg-green-50/50 border-green-200" : "hover:bg-muted/30"
                          }`}>
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              cv.status === "SELECTED" ? "bg-green-100" : "bg-cyan-50"
                            }`}>
                              <User className={`h-5 w-5 ${cv.status === "SELECTED" ? "text-green-700" : "text-cyan-500"}`} />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <p className="font-semibold text-foreground">{cv.fullName}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {cv.email}</span>
                                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {cv.phoneNumber}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                                cv.status === "SELECTED" ? "bg-green-100 text-green-800" : "bg-cyan-100 text-cyan-800"
                              }`}>
                                {cv.status === "SELECTED" ? "Selected" :
                                 cv.status === "INTERVIEW_SENT" ? "Interview Sent" :
                                 cv.status}
                              </span>
                              <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-medium">CV</span>
                              {cv.status !== "SELECTED" && (
                                <Button size="sm" onClick={() => openCvSelectModal(cv)} className="bg-green-600 hover:bg-green-700 text-foreground">
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Select
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Selection Confirmation Modal */}
      <Dialog open={selectModalOpen} onOpenChange={setSelectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Confirm Selection
            </DialogTitle>
          </DialogHeader>

          {selectTarget && (
            <div className="space-y-5">
              <div className="p-4 bg-muted/50 rounded-xl border space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="font-semibold text-foreground">{selectTarget.fullName}</p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {selectTarget.email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {selectTarget.phoneNumber}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-date" className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Reporting / Office Visit Date
                </Label>
                <p className="text-xs text-muted-foreground">The candidate will be notified to report on this date.</p>
                <Input id="report-date" type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} required className="h-11" min={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="select-description" className="font-semibold flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Additional Information (Optional)
                </Label>
                <p className="text-xs text-muted-foreground">Any additional instructions or notes for the candidate.</p>
                <textarea
                  id="select-description"
                  value={selectDescription}
                  onChange={e => setSelectDescription(e.target.value)}
                  placeholder="Enter any additional information..."
                  className="w-full min-h-[80px] px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-green-800">
                <p>A selection email will be sent to <strong>{selectTarget.email}</strong> with the reporting date and instructions to bring necessary documents.</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setSelectModalOpen(false)} disabled={selectLoading}>Cancel</Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-foreground" onClick={handleConfirmSelect} disabled={selectLoading}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {selectLoading ? "Sending..." : "Confirm & Send Email"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CV Selection Confirmation Modal */}
      <Dialog open={cvSelectModalOpen} onOpenChange={setCvSelectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Confirm Selection
            </DialogTitle>
          </DialogHeader>

          {cvSelectTarget && (
            <div className="space-y-5">
              <div className="p-4 bg-muted/50 rounded-xl border space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="font-semibold text-foreground">{cvSelectTarget.fullName}</p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {cvSelectTarget.email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {cvSelectTarget.phoneNumber}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cv-report-date" className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Reporting / Office Visit Date
                </Label>
                <p className="text-xs text-muted-foreground">The candidate will be notified to report on this date.</p>
                <Input id="cv-report-date" type="date" value={cvReportDate} onChange={e => setCvReportDate(e.target.value)} required className="h-11" min={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cv-select-description" className="font-semibold flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Additional Information (Optional)
                </Label>
                <p className="text-xs text-muted-foreground">Any additional instructions or notes for the candidate.</p>
                <textarea
                  id="cv-select-description"
                  value={cvSelectDescription}
                  onChange={e => setCvSelectDescription(e.target.value)}
                  placeholder="Enter any additional information..."
                  className="w-full min-h-[80px] px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-green-800">
                <p>A selection email will be sent to <strong>{cvSelectTarget.email}</strong> with the reporting date and instructions to bring necessary documents.</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setCvSelectModalOpen(false)} disabled={cvSelectLoading}>Cancel</Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-foreground" onClick={handleConfirmCvSelect} disabled={cvSelectLoading}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {cvSelectLoading ? "Sending..." : "Confirm & Send Email"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Interview
            </DialogTitle>
          </DialogHeader>

          {deleteTarget && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-2">
                <p className="font-semibold text-foreground">{deleteTarget.vacancyTitle || `Vacancy #${deleteTarget.vacancyId}`}</p>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {deleteTarget.interviewDate}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {deleteTarget.interviewTime}</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {deleteTarget.applicants.length} candidate(s)</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this interview? The candidates will be unlinked from this interview record. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteModalOpen(false)} disabled={deleteLoading}>Cancel</Button>
                <Button variant="destructive" className="flex-1" onClick={handleDeleteInterview} disabled={deleteLoading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteLoading ? "Deleting..." : "Delete Interview"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Interviews;
