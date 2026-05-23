import { useEffect, useState, useMemo, useRef } from "react";
import { User, Briefcase, ChevronDown, ChevronRight, FileText, Mail, Phone, Download, Calendar, CheckCircle, Send, Clock, Search, Users, ClipboardList, Plus, Pencil, Filter, Trash2, Star, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Vacancy {
  id: number;
  jobTitle: string;
  description?: string;
  requirements?: string;
  experienceLevel?: string;
  location?: string;
  minSalary?: number;
  maxSalary?: number;
  status?: string;
}

interface Application {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  vacancyId: number;
  vacancyTitle?: string;
  applicationStatus: string;
  cvFilePath?: string;
  certificateFilePath?: string;
}

interface CvSubmission {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  cvFilePath?: string;
  submittedDate?: string;
  status?: string;
}

const OperationalCareers = () => {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [cvSubmissions, setCvSubmissions] = useState<CvSubmission[]>([]);

  // vacancy status filter
  const [vacancyFilter, setVacancyFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");

  // selection for bulk operations
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // which vacancy is expanded in the pending section
  const [expandedVacancyId, setExpandedVacancyId] = useState<number | null>(null);

  // which vacancy is expanded in the shortlisted section
  const [expandedShortlistVacId, setExpandedShortlistVacId] = useState<number | null>(null);

  // which vacancy is expanded in the selected section
  const [expandedSelectedVacId, setExpandedSelectedVacId] = useState<number | null>(null);

  // selection for shortlisted interview scheduling
  const [shortlistSelectedIds, setShortlistSelectedIds] = useState<number[]>([]);

  // selection for CV submission interview scheduling
  const [selectedCvIds, setSelectedCvIds] = useState<number[]>([]);

  // CV submission sort options
  const [cvStatusFilter, setCvStatusFilter] = useState<"ALL" | "PENDING" | "SELECTED" | "INTERVIEW_SENT">("ALL");
  const [cvDateSort, setCvDateSort] = useState<"newest" | "oldest">("newest");

  // schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [expandedScheduleVacId, setExpandedScheduleVacId] = useState<number | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [selectedInterviewerRoles, setSelectedInterviewerRoles] = useState<string[]>([]);

  const INTERVIEWER_ROLES = [
    { value: "ACCOUNTANT", label: "Accountant" },
    { value: "AREA_MANAGER", label: "Area Manager" },
    { value: "CHAIRMAN", label: "Chairman" },
    { value: "DIRECTOR", label: "Director" },
    { value: "EXECUTIVE", label: "Executive" },
  ];

  const toggleInterviewerRole = (role: string) => {
    setSelectedInterviewerRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const [newVacancyTitle, setNewVacancyTitle] = useState("");
  const [newVacancyDescription, setNewVacancyDescription] = useState("");
  const [newVacancyLocation, setNewVacancyLocation] = useState("");
  const [newVacancyExperience, setNewVacancyExperience] = useState("");
  // salary fields no longer collected in UI
  const [newVacancyStatus, setNewVacancyStatus] = useState("OPEN");
  const [newVacancyRequirements, setNewVacancyRequirements] = useState("");

  // dropdown options for vacancy form
  const EXPERIENCE_OPTIONS = ["ENTRY", "INTERMEDIATE", "SENIOR", "EXPERT"];
  const STATUS_OPTIONS = ["OPEN", "CLOSED"];
  const { toast } = useToast();

  const authHeaders = (): HeadersInit => {
    const creds = sessionStorage.getItem("auth");
    return creds ? { Authorization: `Basic ${creds}` } : {};
  };

  const openFileWithAuth = async (url: string) => {
    try {
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch file");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch {
      toast({ title: "Error", description: "Unable to open file.", variant: "destructive" });
    }
  };

  const fetchVacancies = () => {
    fetch("/api/vacancies", { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); })
      .then(d => {
        if (d && Array.isArray(d.data)) setVacancies(d.data);
      })
      .catch(err => { console.error("Failed to load vacancies:", err); });
  };

  const fetchApplications = () => {
    fetch("/api/applications", { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); })
      .then(d => {
        if (d && Array.isArray(d.data)) setApplications(d.data);
      })
      .catch(err => { console.error("Failed to load applications:", err); });
  };

  const fetchCvSubmissions = () => {
    fetch("/api/cv-submissions", { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); })
      .then(d => {
        if (d && Array.isArray(d.data)) setCvSubmissions(d.data);
      })
      .catch(err => { console.error("Failed to load CV submissions:", err); });
  };

  useEffect(() => {
    fetchVacancies();
    fetchApplications();
    fetchCvSubmissions();
  }, []);

  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const vacancyFormRef = useRef<HTMLDivElement>(null);

  const handleAddVacancy = async () => {
    const payload: any = {
      jobTitle: newVacancyTitle,
      description: newVacancyDescription,
      requirements: newVacancyRequirements,
      location: newVacancyLocation,
      experienceLevel: newVacancyExperience,
      status: newVacancyStatus
    };
    const url = editingVacancy ? `/api/vacancies/${editingVacancy.id}` : "/api/vacancies";
    const method = editingVacancy ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        console.error("vacancy error", errData);
        throw new Error(errData?.message || "");
      }
      toast({ title: editingVacancy ? "Vacancy Updated" : "Vacancy Created", description: editingVacancy ? "Changes saved." : "New vacancy has been added." });
      setNewVacancyTitle("");
      setNewVacancyDescription("");
      setNewVacancyLocation("");
      setNewVacancyExperience("");
      // clear editing state if any
      setEditingVacancy(null);
      setNewVacancyStatus("OPEN");
      setNewVacancyRequirements("");
      fetchVacancies();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to create vacancy", variant: "destructive" });
    }
  };

  // helper to enter edit mode for a vacancy
  const startEditVacancy = (v: Vacancy) => {
    setEditingVacancy(v);
    setNewVacancyTitle(v.jobTitle);
    setNewVacancyDescription(v.description || "");
    setNewVacancyLocation(v.location || "");
    setNewVacancyExperience(v.experienceLevel || "");
    setNewVacancyStatus(v.status || "OPEN");
    setNewVacancyRequirements(v.requirements || "");
    // scroll the form into view so user sees it
    setTimeout(() => {
      vacancyFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  // helpers derived from applications
  const pendingApps = applications.filter(a => a.applicationStatus === "PENDING");
  const shortlistedApps = applications.filter(a => a.applicationStatus === "SHORTLISTED");
  const selectedApps = applications.filter(a => a.applicationStatus === "SELECTED");

  const toggleSelectId = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleShortlistSelectId = (id: number) => {
    setShortlistSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleCvSelectId = (id: number) => {
    const cv = cvSubmissions.find(c => c.id === id);
    if (cv?.status !== 'PENDING') return; // Only allow selecting PENDING CVs
    setSelectedCvIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Get only PENDING CV submissions (selectable for interview)
  const pendingCvSubmissions = cvSubmissions.filter(cv => cv.status === 'PENDING');

  // Filter and sort CV submissions
  const sortedCvSubmissions = [...cvSubmissions]
    .filter(cv => cvStatusFilter === 'ALL' || cv.status === cvStatusFilter)
    .sort((a, b) => {
      const dateA = new Date(a.submittedDate || 0).getTime();
      const dateB = new Date(b.submittedDate || 0).getTime();
      return cvDateSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const bulkShortlist = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/applications/${id}/shortlist`, { method: "PUT", headers: authHeaders() })
        )
      );
      toast({ title: "Shortlisted", description: "Selected candidates have been shortlisted." });
      setSelectedIds([]);
      fetchApplications();
    } catch {
      toast({ title: "Error", description: "Failed to shortlist some candidates.", variant: "destructive" });
    }
  };

  const openScheduleModal = () => {
    setInterviewDate("");
    setInterviewTime("");
    setInterviewLocation("");
    setSelectedInterviewerRoles([]);
    setExpandedScheduleVacId(null);
    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shortlistSelectedIds.length === 0 && selectedCvIds.length === 0) {
      toast({ title: "No candidates selected", description: "Please select at least one candidate.", variant: "destructive" });
      return;
    }
    if (!interviewDate) {
      toast({ title: "Date Required", description: "Please select an interview date.", variant: "destructive" });
      return;
    }
    if (!interviewTime) {
      toast({ title: "Time Required", description: "Please select an interview time.", variant: "destructive" });
      return;
    }
    if (!interviewLocation.trim()) {
      toast({ title: "Location Required", description: "Please enter an interview location.", variant: "destructive" });
      return;
    }
    setScheduleLoading(true);
    try {
      const res = await fetch("/api/interviews/schedule-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          applicationIds: shortlistSelectedIds.length > 0 ? shortlistSelectedIds : [],
          cvSubmissionIds: selectedCvIds.length > 0 ? selectedCvIds : [],
          interviewDate,
          interviewTime,
          interviewLocation,
          interviewerRoles: selectedInterviewerRoles,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to schedule");
      }
      // Send announcements to selected interviewer roles
      if (selectedInterviewerRoles.length > 0) {
        const vacancyIds = [...new Set(shortlistedApps.filter(a => shortlistSelectedIds.includes(a.id)).map(a => a.vacancyId))];
        const vacancyTitles = vacancyIds.length > 0
          ? vacancyIds.map(vid => {
              const v = vacancies.find(vac => vac.id === vid);
              return v?.jobTitle || `Vacancy #${vid}`;
            }).join(", ")
          : "General Position";
        const totalInterviewees = shortlistSelectedIds.length + selectedCvIds.length;
        await fetch("/api/announcements/interview-scheduled", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            interviewerRoles: selectedInterviewerRoles,
            vacancyTitle: vacancyTitles,
            interviewDate,
            interviewTime,
            interviewLocation,
            numberOfInterviewees: totalInterviewees,
          }),
        });
      }
      const totalScheduled = shortlistSelectedIds.length + selectedCvIds.length;
      toast({
        title: "Interviews Scheduled",
        description: `${totalScheduled} invitation(s) sent successfully.${selectedInterviewerRoles.length > 0 ? " Interviewers notified." : ""}`,
      });
      setShortlistSelectedIds([]);
      setSelectedCvIds([]);
      fetchApplications();
      fetchCvSubmissions();
      setScheduleModalOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Unable to schedule interview", variant: "destructive" });
    } finally {
      setScheduleLoading(false);
    }
  };

  // delete handler for closed vacancies
  const handleDeleteVacancy = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this vacancy? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/vacancies/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error();
      toast({ title: "Deleted", description: "Vacancy has been removed." });
      fetchVacancies();
    } catch {
      toast({ title: "Error", description: "Failed to delete vacancy", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="relative rounded-2xl overflow-hidden bg-card p-5 text-foreground shadow-xl">
        {/* Golden glow on right side */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#FFD700]/25 via-[#FFD700]/8 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-primary/15 rounded-xl border border-primary/20">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Recruitment Management</h2>
            <p className="text-sm text-foreground/50">Manage vacancies, applications, and hiring pipeline</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative grid grid-cols-5 gap-3">
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <ClipboardList className="h-4 w-4 mx-auto mb-1.5 text-primary" />
            <p className="text-xl font-bold">{vacancies.length}</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-0.5">Vacancies</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <Clock className="h-4 w-4 mx-auto mb-1.5 text-amber-400" />
            <p className="text-xl font-bold">{pendingApps.length}</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-0.5">Pending</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <Users className="h-4 w-4 mx-auto mb-1.5 text-purple-400" />
            <p className="text-xl font-bold">{shortlistedApps.length}</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-0.5">Shortlisted</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <CheckCircle className="h-4 w-4 mx-auto mb-1.5 text-emerald-400" />
            <p className="text-xl font-bold">{selectedApps.length}</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-0.5">Selected</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <Send className="h-4 w-4 mx-auto mb-1.5 text-cyan-400" />
            <p className="text-xl font-bold">{cvSubmissions.length}</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-0.5">CVs</p>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="vacancies" className="space-y-3">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border p-1 rounded-xl shadow-sm">
          <TabsTrigger value="vacancies" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg text-sm font-medium text-muted-foreground transition-all">
            <Briefcase className="h-4 w-4 mr-1.5" /> Vacancies
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg text-sm font-medium text-muted-foreground transition-all">
            <Users className="h-4 w-4 mr-1.5" /> Applications
          </TabsTrigger>
          <TabsTrigger value="cv-submissions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg text-sm font-medium text-muted-foreground transition-all">
            <Send className="h-4 w-4 mr-1.5" /> CV Submissions
          </TabsTrigger>
        </TabsList>

      <TabsContent value="vacancies" className="space-y-4 mt-0">
      {/* published vacancies and creation/edit form */}
      <Card className="shadow-sm border-0 bg-card rounded-xl">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            Published Vacancies
            <span className="text-sm font-normal text-muted-foreground">({vacancyFilter === "ALL" ? vacancies.length : vacancies.filter(v => v.status === vacancyFilter).length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Sort / Filter bar */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">Filter:</span>
            {(["ALL", "OPEN", "CLOSED"] as const).map(f => (
              <Button
                key={f}
                size="sm"
                variant={vacancyFilter === f ? "default" : "outline"}
                className={vacancyFilter === f ? "bg-primary text-primary-foreground text-xs h-7 px-4 rounded-full shadow-sm" : "text-xs h-7 px-4 rounded-full border-border text-muted-foreground hover:bg-muted"}
                onClick={() => setVacancyFilter(f)}
              >
                {f === "ALL" ? "All" : f === "OPEN" ? "Open" : "Closed"}
              </Button>
            ))}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacancies.filter(v => vacancyFilter === "ALL" || v.status === vacancyFilter).map(v => (
                <TableRow key={v.id} className="hover:bg-muted">
                  <TableCell>{v.id}</TableCell>
                  <TableCell>{v.jobTitle}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{v.location || "—"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      v.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {v.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditVacancy(v)}
                        className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5 text-primary" />
                      </button>
                      {v.status === "CLOSED" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteVacancy(v.id)}
                          className="h-8 w-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card ref={vacancyFormRef} className={`shadow-sm border-0 rounded-xl transition-all duration-500 ${editingVacancy ? "bg-primary/10 ring-2 ring-primary/40" : "bg-card"}`}>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              {editingVacancy ? <Pencil className="h-4 w-4 text-primary" /> : <Star className="h-4 w-4 text-primary" />}
            </div>
            {editingVacancy ? "Edit Vacancy" : "Post New Vacancy"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {/* vacancy form unchanged */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job Title *</Label>
              <Input id="vacancy-title" value={newVacancyTitle} onChange={e => setNewVacancyTitle(e.target.value)} className="border-border focus:border-primary focus:ring-primary/20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description *</Label>
              <Textarea id="vacancy-desc" value={newVacancyDescription} onChange={e => setNewVacancyDescription(e.target.value)} className="border-border focus:border-primary focus:ring-primary/20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-location" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location *</Label>
              <Input id="vacancy-location" value={newVacancyLocation} onChange={e => setNewVacancyLocation(e.target.value)} className="border-border focus:border-primary focus:ring-primary/20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-experience" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Experience Level *</Label>
              <select
                id="vacancy-experience"
                className="w-full rounded-md border border-border bg-card text-foreground input focus:border-primary focus:ring-primary/20"
                value={newVacancyExperience}
                onChange={e => setNewVacancyExperience(e.target.value)}
              >
                <option value="" disabled>Select level</option>
                {EXPERIENCE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status *</Label>
              <select
                id="vacancy-status"
                className="w-full rounded-md border border-border bg-card text-foreground input focus:border-primary focus:ring-primary/20"
                value={newVacancyStatus}
                onChange={e => setNewVacancyStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="vacancy-requirements" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Requirements</Label>
              <Textarea id="vacancy-requirements" value={newVacancyRequirements} onChange={e => setNewVacancyRequirements(e.target.value)} className="border-border focus:border-primary focus:ring-primary/20" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button onClick={handleAddVacancy} className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 rounded-lg shadow-sm">{editingVacancy ? "Save Changes" : "Create Vacancy"}</Button>
            {editingVacancy && (
              <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted rounded-lg" onClick={() => {
                setEditingVacancy(null);
                setNewVacancyTitle("");
                setNewVacancyDescription("");
                setNewVacancyLocation("");
                setNewVacancyExperience("");
                setNewVacancyStatus("OPEN");
                setNewVacancyRequirements("");
              }}>Cancel</Button>
            )}
          </div>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="pipeline" className="space-y-4 mt-0">
      {/* pending applications grouped by vacancy */}
      <Card className="shadow-sm border-0 bg-card rounded-xl">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            Pending Review
            <span className="ml-1 inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{pendingApps.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {selectedIds.length > 0 && (
            <Button className="mb-4" onClick={bulkShortlist}>Shortlist Selected ({selectedIds.length})</Button>
          )}

          {/* group pending apps by vacancy */}
          {(() => {
            // build a map: vacancyId -> { title, apps[] }
            const grouped = new Map<number, { title: string; apps: typeof pendingApps }>();
            for (const app of pendingApps) {
              const vid = app.vacancyId;
              if (!grouped.has(vid)) {
                grouped.set(vid, {
                  title: app.vacancyTitle || `Vacancy #${vid}`,
                  apps: [],
                });
              }
              grouped.get(vid)!.apps.push(app);
            }

            if (grouped.size === 0) {
              return <p className="text-muted-foreground text-sm">No pending applications.</p>;
            }

            return (
              <div className="space-y-2">
                {Array.from(grouped.entries()).map(([vacId, { title, apps }]) => (
                  <div key={vacId} className="border border-border rounded-xl overflow-hidden hover:border-border/80 transition-colors">
                    {/* vacancy button */}
                    <button
                      type="button"
                      onClick={() => setExpandedVacancyId(prev => prev === vacId ? null : vacId)}
                      className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderOpen className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <span className="font-semibold text-foreground">{title}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          {apps.length} applicant{apps.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${expandedVacancyId === vacId ? "rotate-90" : ""}`} />
                    </button>

                    {/* expanded applicant details */}
                    {expandedVacancyId === vacId && (
                      <div className="p-4 space-y-2 bg-card border-t border-border">
                        {apps.map(app => (
                          <div key={app.id} className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border hover:bg-muted/60 transition-colors">
                            {/* checkbox */}
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 accent-[#FFD700] rounded"
                              checked={selectedIds.includes(app.id)}
                              onChange={() => toggleSelectId(app.id)}
                            />
                            {/* applicant info */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="font-semibold text-foreground">{app.fullName}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{app.email}</span>
                                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{app.phoneNumber}</span>
                                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />ID: {app.id}</span>
                              </div>
                              {(app.cvFilePath || app.certificateFilePath) && (
                                <div className="flex gap-3 mt-1 text-xs">
                                  {app.cvFilePath && (
                                    <button type="button" onClick={() => openFileWithAuth(`/api/applications/${app.id}/cv`)}
                                      className="text-primary hover:underline flex items-center gap-1">
                                      <FileText className="h-3 w-3" /> View CV
                                    </button>
                                  )}
                                  {app.certificateFilePath && (
                                    <button type="button" onClick={() => openFileWithAuth(`/api/applications/${app.id}/certificate`)}
                                      className="text-primary hover:underline flex items-center gap-1">
                                      <FileText className="h-3 w-3" /> View Certificate
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            {/* status badge */}
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                              {app.applicationStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* shortlisted candidates grouped by vacancy */}
      <Card className="shadow-sm border-0 bg-card rounded-xl">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
              <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-500" />
              </div>
              Shortlisted Candidates
              <span className="ml-1 inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">{shortlistedApps.length}</span>
            </CardTitle>
            <Button
              size="sm"
              onClick={() => openScheduleModal()}
              disabled={shortlistSelectedIds.length === 0}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold"
            >
              <Calendar className="h-4 w-4" /> Schedule Interview {shortlistSelectedIds.length > 0 ? `(${shortlistSelectedIds.length})` : ""}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {(() => {
            const grouped = new Map<number, { title: string; apps: typeof shortlistedApps }>();
            for (const app of shortlistedApps) {
              const vid = app.vacancyId;
              if (!grouped.has(vid)) {
                grouped.set(vid, {
                  title: app.vacancyTitle || `Vacancy #${vid}`,
                  apps: [],
                });
              }
              grouped.get(vid)!.apps.push(app);
            }

            if (grouped.size === 0) {
              return <p className="text-muted-foreground text-sm">No shortlisted candidates.</p>;
            }

            const downloadCSV = (vacId: number, title: string, apps: typeof shortlistedApps) => {
              const header = "ID,Full Name,Email,Phone Number,Vacancy,Status";
              const rows = apps.map(a =>
                `${a.id},"${a.fullName}","${a.email}","${a.phoneNumber}","${a.vacancyTitle || a.vacancyId}","${a.applicationStatus}"`
              );
              const csv = [header, ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `shortlisted_${title.replace(/\s+/g, "_")}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            };

            return (
              <div className="space-y-2">
                {Array.from(grouped.entries()).map(([vacId, { title, apps }]) => {
                  return (
                    <div key={vacId} className="border border-border rounded-xl overflow-hidden hover:border-border/80 transition-colors">
                      {/* vacancy button */}
                      <button
                        type="button"
                        onClick={() => setExpandedShortlistVacId(prev => prev === vacId ? null : vacId)}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                            <FolderOpen className="h-4.5 w-4.5 text-purple-500" />
                          </div>
                          <span className="font-semibold text-foreground">{title}</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            {apps.length} shortlisted
                          </span>
                        </div>
                        <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${expandedShortlistVacId === vacId ? "rotate-90" : ""}`} />
                      </button>

                      {/* expanded shortlisted applicant details */}
                      {expandedShortlistVacId === vacId && (
                        <div className="p-4 space-y-3 bg-card border-t border-border">
                          {/* action bar */}
                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadCSV(vacId, title, apps)}
                              className="flex items-center gap-1.5 border-border text-muted-foreground hover:bg-muted rounded-lg"
                            >
                              <Download className="h-4 w-4" /> Download List
                            </Button>
                          </div>

                          {/* applicant cards */}
                          {apps.map(app => (
                            <div key={app.id} className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border hover:bg-muted/60 transition-colors">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 accent-[#FFD700] rounded"
                                checked={shortlistSelectedIds.includes(app.id)}
                                onChange={() => toggleShortlistSelectId(app.id)}
                              />
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="font-semibold text-foreground">{app.fullName}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{app.email}</span>
                                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{app.phoneNumber}</span>
                                  <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />ID: {app.id}</span>
                                </div>
                                {(app.cvFilePath || app.certificateFilePath) && (
                                  <div className="flex gap-3 mt-1 text-xs">
                                    {app.cvFilePath && (
                                      <button type="button" onClick={() => openFileWithAuth(`/api/applications/${app.id}/cv`)}
                                        className="text-primary hover:underline flex items-center gap-1">
                                        <FileText className="h-3 w-3" /> View CV
                                      </button>
                                    )}
                                    {app.certificateFilePath && (
                                      <button type="button" onClick={() => openFileWithAuth(`/api/applications/${app.id}/certificate`)}
                                        className="text-primary hover:underline flex items-center gap-1">
                                        <FileText className="h-3 w-3" /> View Certificate
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                                {app.applicationStatus}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* selected candidates grouped by vacancy */}
      <Card className="shadow-sm border-0 bg-card rounded-xl">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            Selected Candidates
            <span className="ml-1 inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">{selectedApps.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {(() => {
            const grouped = new Map<number, { title: string; apps: typeof selectedApps }>();
            for (const app of selectedApps) {
              const vid = app.vacancyId;
              if (!grouped.has(vid)) {
                grouped.set(vid, {
                  title: app.vacancyTitle || `Vacancy #${vid}`,
                  apps: [],
                });
              }
              grouped.get(vid)!.apps.push(app);
            }

            if (grouped.size === 0) {
              return <p className="text-muted-foreground text-sm">No selected candidates yet.</p>;
            }

            const downloadSelectedCSV = (vacId: number, title: string, apps: typeof selectedApps) => {
              const header = "ID,Full Name,Email,Phone Number,Vacancy,Status";
              const rows = apps.map(a =>
                `${a.id},"${a.fullName}","${a.email}","${a.phoneNumber}","${a.vacancyTitle || a.vacancyId}","${a.applicationStatus}"`
              );
              const csv = [header, ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `selected_${title.replace(/\s+/g, "_")}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            };

            return (
              <div className="space-y-2">
                {Array.from(grouped.entries()).map(([vacId, { title, apps }]) => (
                  <div key={vacId} className="border border-border rounded-xl overflow-hidden hover:border-border/80 transition-colors">
                    {/* vacancy button */}
                    <button
                      type="button"
                      onClick={() => setExpandedSelectedVacId(prev => prev === vacId ? null : vacId)}
                      className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <FolderOpen className="h-4.5 w-4.5 text-emerald-500" />
                        </div>
                        <span className="font-semibold text-foreground">{title}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          {apps.length} selected
                        </span>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${expandedSelectedVacId === vacId ? "rotate-90" : ""}`} />
                    </button>

                    {/* expanded selected applicant details */}
                    {expandedSelectedVacId === vacId && (
                      <div className="p-4 space-y-3 bg-card border-t border-border">
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadSelectedCSV(vacId, title, apps)}
                            className="flex items-center gap-1.5 border-border text-muted-foreground hover:bg-muted rounded-lg"
                          >
                            <Download className="h-4 w-4" /> Download List
                          </Button>
                        </div>
                        {apps.map(app => (
                          <div key={app.id} className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border hover:bg-muted/60 transition-colors">
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="font-semibold text-foreground">{app.fullName}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{app.email}</span>
                                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{app.phoneNumber}</span>
                                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />ID: {app.id}</span>
                              </div>
                              {(app.cvFilePath || app.certificateFilePath) && (
                                <div className="flex gap-3 mt-1 text-xs">
                                  {app.cvFilePath && (
                                    <button type="button" onClick={() => openFileWithAuth(`/api/applications/${app.id}/cv`)}
                                      className="text-primary hover:underline flex items-center gap-1">
                                      <FileText className="h-3 w-3" /> View CV
                                    </button>
                                  )}
                                  {app.certificateFilePath && (
                                    <button type="button" onClick={() => openFileWithAuth(`/api/applications/${app.id}/certificate`)}
                                      className="text-primary hover:underline flex items-center gap-1">
                                      <FileText className="h-3 w-3" /> View Certificate
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                              {app.applicationStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="cv-submissions" className="mt-0">
      {/* CV Submissions Section */}
      <Card className="shadow-sm border-0 bg-card rounded-xl">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-base font-semibold">
              <div className="h-8 w-8 rounded-xl bg-cyan-50 flex items-center justify-center">
                <Send className="h-4 w-4 text-cyan-500" />
              </div>
              CV Submissions
              <span className="ml-1 inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold">{cvSubmissions.length}</span>
            </div>
            {selectedCvIds.length > 0 && (
              <Button
                size="sm"
                onClick={openScheduleModal}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 rounded-lg"
              >
                <Calendar className="h-4 w-4" />
                Schedule Interview ({selectedCvIds.length})
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {cvSubmissions.length === 0 ? (
            <p className="text-gray-400 text-sm">No CV submissions yet.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">{sortedCvSubmissions.length} CV{sortedCvSubmissions.length !== 1 ? "s" : ""} {cvStatusFilter !== 'ALL' ? `(${cvStatusFilter})` : 'received'}</p>
                  <select
                    value={cvStatusFilter}
                    onChange={(e) => setCvStatusFilter(e.target.value as "ALL" | "PENDING" | "SELECTED" | "INTERVIEW_SENT")}
                    className="text-xs border rounded-md px-2 py-1 bg-card text-foreground border-border"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="SELECTED">Selected</option>
                    <option value="INTERVIEW_SENT">Interview Sent</option>
                  </select>
                  <select
                    value={cvDateSort}
                    onChange={(e) => setCvDateSort(e.target.value as "newest" | "oldest")}
                    className="text-xs border rounded-md px-2 py-1 bg-card text-foreground border-border"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
                {pendingCvSubmissions.length > 0 && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#FFD700] rounded"
                      checked={pendingCvSubmissions.length > 0 && pendingCvSubmissions.every(cv => selectedCvIds.includes(cv.id))}
                      onChange={() => {
                        if (pendingCvSubmissions.every(cv => selectedCvIds.includes(cv.id))) {
                          setSelectedCvIds([]);
                        } else {
                          setSelectedCvIds(pendingCvSubmissions.map(cv => cv.id));
                        }
                      }}
                    />
                    Select All Pending
                  </label>
                )}
              </div>
              {sortedCvSubmissions.map(cv => {
                const isPending = cv.status === 'PENDING';
                return (
                <div key={cv.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                  selectedCvIds.includes(cv.id) ? "bg-primary/10 border-primary/30" : "bg-muted/40 border-border hover:bg-muted/60"
                } ${!isPending ? "opacity-70" : ""}`}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#FFD700] rounded mt-1"
                    checked={selectedCvIds.includes(cv.id)}
                    onChange={() => toggleCvSelectId(cv.id)}
                    disabled={!isPending}
                    title={!isPending ? "Already selected or interview sent" : "Select for interview"}
                  />
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{cv.fullName}</p>
                      {cv.status && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                          cv.status === 'SELECTED' 
                            ? 'bg-green-100 text-green-800' 
                            : cv.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {cv.status}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{cv.email}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{cv.phoneNumber}</span>
                      {cv.submittedDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(cv.submittedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    {cv.cvFilePath && (
                      <div className="flex gap-3 mt-1 text-xs">
                        <a
                          href={`/api/cv-submissions/${cv.id}/cv`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                          onClick={(e) => {
                            e.preventDefault();
                            const creds = sessionStorage.getItem("auth");
                            fetch(`/api/cv-submissions/${cv.id}/cv`, {
                              headers: creds ? { Authorization: `Basic ${creds}` } : {},
                            })
                              .then(r => {
                                if (!r.ok) throw new Error("Failed to load");
                                return r.blob();
                              })
                              .then(blob => {
                                const url = URL.createObjectURL(blob);
                                window.open(url, "_blank");
                              })
                              .catch(() => {
                                toast({ title: "Error", description: "Failed to load CV file", variant: "destructive" });
                              });
                          }}
                        >
                          <FileText className="h-3 w-3" /> View CV
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );})}
            </div>
          )}
        </CardContent>
      </Card>
      </TabsContent>
      </Tabs>

      {/* schedule interview modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Schedule Interview
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleScheduleSubmit} className="space-y-5">
            {/* Candidate selection grouped by vacancy */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Select Candidates ({shortlistSelectedIds.length + selectedCvIds.length} selected)
              </Label>
              <p className="text-xs text-muted-foreground">
                Choose shortlisted candidates from job vacancies or CV submissions
              </p>

              {(() => {
                const grouped = new Map<number, { title: string; apps: typeof shortlistedApps }>();
                for (const app of shortlistedApps) {
                  if (!grouped.has(app.vacancyId)) {
                    grouped.set(app.vacancyId, { title: app.vacancyTitle || `Vacancy #${app.vacancyId}`, apps: [] });
                  }
                  grouped.get(app.vacancyId)!.apps.push(app);
                }
                const groups = Array.from(grouped.entries());

                const hasContent = groups.length > 0 || cvSubmissions.length > 0;

                if (!hasContent) {
                  return (
                    <div className="p-6 text-center text-sm text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      No shortlisted candidates or CV submissions available.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto border rounded-xl p-2">
                    {/* Shortlisted Applications grouped by vacancy */}
                    {groups.map(([vacId, { title, apps }]) => {
                      const allIds = apps.map(a => a.id);
                      const allChecked = allIds.length > 0 && allIds.every(id => shortlistSelectedIds.includes(id));
                      const someChecked = allIds.some(id => shortlistSelectedIds.includes(id));
                      const isExpanded = expandedScheduleVacId === vacId;

                      const toggleAllInVac = () => {
                        if (allChecked) {
                          setShortlistSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
                        } else {
                          setShortlistSelectedIds(prev => [...new Set([...prev, ...allIds])]);
                        }
                      };

                      return (
                        <div key={vacId} className="border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setExpandedScheduleVacId(prev => prev === vacId ? null : vacId)}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[#FFD700] rounded"
                              checked={allChecked}
                              ref={(el: HTMLInputElement | null) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                              onChange={(e) => { e.stopPropagation(); toggleAllInVac(); }}
                              onClick={e => e.stopPropagation()}
                            />
                            <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-medium text-sm flex-1">{title}</span>
                            <span className="text-xs text-muted-foreground bg-white px-2 py-0.5 rounded-full border">
                              {apps.length} candidate{apps.length !== 1 ? "s" : ""}
                            </span>
                            {isExpanded
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            }
                          </button>

                          {isExpanded && (
                            <div className="divide-y">
                              {apps.map(app => (
                                <label
                                  key={app.id}
                                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                    shortlistSelectedIds.includes(app.id) ? "bg-primary/5" : "hover:bg-muted/20"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-[#FFD700] rounded"
                                    checked={shortlistSelectedIds.includes(app.id)}
                                    onChange={() => toggleShortlistSelectId(app.id)}
                                  />
                                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{app.fullName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{app.email}</p>
                                  </div>
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium uppercase">
                                    Shortlisted
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* CV Submissions Section - Only show PENDING */}
                    {pendingCvSubmissions.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedScheduleVacId(prev => prev === -1 ? null : -1)}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-cyan-50/50 hover:bg-cyan-50 transition-colors text-left"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[#FFD700] rounded"
                            checked={pendingCvSubmissions.length > 0 && pendingCvSubmissions.every(cv => selectedCvIds.includes(cv.id))}
                            ref={(el: HTMLInputElement | null) => {
                              if (el) el.indeterminate = pendingCvSubmissions.some(cv => selectedCvIds.includes(cv.id)) &&
                                !pendingCvSubmissions.every(cv => selectedCvIds.includes(cv.id));
                            }}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (pendingCvSubmissions.every(cv => selectedCvIds.includes(cv.id))) {
                                setSelectedCvIds([]);
                              } else {
                                setSelectedCvIds(pendingCvSubmissions.map(cv => cv.id));
                              }
                            }}
                            onClick={e => e.stopPropagation()}
                          />
                          <Send className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                          <span className="font-medium text-sm flex-1">CV Submissions (Pending)</span>
                          <span className="text-xs text-muted-foreground bg-white px-2 py-0.5 rounded-full border">
                            {pendingCvSubmissions.length} pending
                          </span>
                          {expandedScheduleVacId === -1
                            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          }
                        </button>

                        {expandedScheduleVacId === -1 && (
                          <div className="divide-y">
                            {pendingCvSubmissions.map(cv => (
                              <label
                                key={cv.id}
                                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                  selectedCvIds.includes(cv.id) ? "bg-primary/5" : "hover:bg-muted/20"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-[#FFD700] rounded"
                                  checked={selectedCvIds.includes(cv.id)}
                                  onChange={() => toggleCvSelectId(cv.id)}
                                />
                                <FileText className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{cv.fullName}</p>
                                  <p className="text-xs text-muted-foreground truncate">{cv.email}</p>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase bg-yellow-100 text-yellow-800">
                                  PENDING
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="interview-date" className="text-sm font-medium">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="interview-date"
                      type="button"
                      variant="outline"
                      className={`w-full justify-start text-left font-normal h-10 ${!interviewDate ? "text-muted-foreground" : ""}`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {interviewDate ? format(new Date(interviewDate + "T00:00:00"), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarWidget
                      mode="single"
                      selected={interviewDate ? new Date(interviewDate + "T00:00:00") : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setInterviewDate(format(date, "yyyy-MM-dd"));
                        }
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="interview-time" className="text-sm font-medium">Time</Label>
                <Input id="interview-time" type="time" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} required min={interviewDate === new Date().toISOString().split('T')[0] ? new Date().toTimeString().slice(0,5) : undefined} />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="interview-location" className="text-sm font-medium">Location</Label>
              <Input id="interview-location" placeholder="e.g. Head Office, Board Room 2" value={interviewLocation} onChange={e => setInterviewLocation(e.target.value)} required />
            </div>

            {/* Interviewer selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Interviewers (optional)</Label>
              <p className="text-xs text-muted-foreground">Choose officers who will participate in this interview</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INTERVIEWER_ROLES.map(role => (
                  <label key={role.value} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedInterviewerRoles.includes(role.value) ? "bg-primary/10 border-primary" : "border-border hover:bg-muted/50"
                  }`}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#FFD700]"
                      checked={selectedInterviewerRoles.includes(role.value)}
                      onChange={() => toggleInterviewerRole(role.value)}
                    />
                    <span className="text-sm font-medium text-foreground">{role.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Summary */}
            {(shortlistSelectedIds.length > 0 || selectedCvIds.length > 0) && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-sm">
                <p className="font-medium text-[#1A1A1B]">
                  <CheckCircle className="h-4 w-4 inline mr-1 text-primary" />
                  {shortlistSelectedIds.length + selectedCvIds.length} candidate{(shortlistSelectedIds.length + selectedCvIds.length) !== 1 ? "s" : ""}
                  {shortlistSelectedIds.length > 0 && <> from{" "}
                    {new Set(shortlistedApps.filter(a => shortlistSelectedIds.includes(a.id)).map(a => a.vacancyId)).size} vacancy
                    {new Set(shortlistedApps.filter(a => shortlistSelectedIds.includes(a.id)).map(a => a.vacancyId)).size !== 1 ? " positions" : ""}
                  </>}
                  {selectedCvIds.length > 0 && <>{shortlistSelectedIds.length > 0 ? " and " : " from "}{selectedCvIds.length} CV submission{selectedCvIds.length !== 1 ? "s" : ""}</>}
                  {" "}will receive interview invitations
                </p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={scheduleLoading || (shortlistSelectedIds.length === 0 && selectedCvIds.length === 0)}
              className="w-full bg-card hover:bg-primary hover:text-[#1A1A1B] text-foreground font-semibold h-11"
            >
              {scheduleLoading ? "Scheduling..." : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule & Send {(shortlistSelectedIds.length + selectedCvIds.length) > 0 ? `${shortlistSelectedIds.length + selectedCvIds.length} Invitation${(shortlistSelectedIds.length + selectedCvIds.length) !== 1 ? "s" : ""}` : "Invitations"}
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperationalCareers;
