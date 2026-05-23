import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  User, Calendar, MapPin, Clock, Mail, Phone, Briefcase,
  CheckCircle, CalendarClock, Users
} from "lucide-react";

interface SelectedApplicant {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  vacancyTitle?: string;
  interviewDate: string;
  interviewTime: string;
  interviewLocation: string;
  applicationStatus: string;
  type: "application" | "cv"; // Whether from job application or CV submission
}

const InterviewApplicants = () => {
  const [applicants, setApplicants] = useState<SelectedApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const authHeaders = (): HeadersInit => {
    const creds = sessionStorage.getItem("auth");
    return creds ? { Authorization: `Basic ${creds}` } : {};
  };

  useEffect(() => {
    fetchInterviewApplicants();
  }, []);

  const fetchInterviewApplicants = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/interviews", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch interviews");

      const data = await res.json();
      const interviews = Array.isArray(data.data) ? data.data : [];

      // Flatten all selected applicants from all interviews
      const selectedApplicants: SelectedApplicant[] = [];

      interviews.forEach((interview: any) => {
        // Add selected job applicants
        if (Array.isArray(interview.applicants)) {
          interview.applicants
            .filter((app: any) => app.applicationStatus === "SELECTED")
            .forEach((app: any) => {
              selectedApplicants.push({
                id: app.applicationId,
                fullName: app.fullName,
                email: app.email,
                phoneNumber: app.phoneNumber,
                vacancyTitle: interview.vacancyTitle || `Vacancy #${interview.vacancyId}`,
                interviewDate: interview.interviewDate,
                interviewTime: interview.interviewTime,
                interviewLocation: interview.interviewLocation,
                applicationStatus: app.applicationStatus,
                type: "application",
              });
            });
        }

        // Add selected CV applicants
        if (Array.isArray(interview.cvApplicants)) {
          interview.cvApplicants
            .filter((cv: any) => cv.status === "SELECTED")
            .forEach((cv: any) => {
              selectedApplicants.push({
                id: cv.cvSubmissionId,
                fullName: cv.fullName,
                email: cv.email,
                phoneNumber: cv.phoneNumber,
                vacancyTitle: "CV Submission",
                interviewDate: interview.interviewDate,
                interviewTime: interview.interviewTime,
                interviewLocation: interview.interviewLocation,
                applicationStatus: cv.status,
                type: "cv",
              });
            });
        }
      });

      setApplicants(selectedApplicants);
    } catch (err: any) {
      setError(err?.message || "Failed to load interview applicants");
      console.error("Failed to fetch interview applicants:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative rounded-2xl overflow-hidden bg-card p-5 text-foreground shadow-xl border border-border">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/15 via-primary/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-40 h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Interview Applicants</h2>
            <p className="text-sm text-muted-foreground">View all applicants selected for interviews</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-3 text-center border border-border hover:bg-muted transition-colors">
            <CheckCircle className="h-4 w-4 mx-auto mb-1.5 text-green-500" />
            <p className="text-xl font-bold text-foreground">{applicants.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Total Selected</p>
          </div>
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-3 text-center border border-border hover:bg-muted transition-colors">
            <Briefcase className="h-4 w-4 mx-auto mb-1.5 text-blue-500" />
            <p className="text-xl font-bold text-foreground">
              {applicants.filter((a) => a.type === "application").length}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Job Applications</p>
          </div>
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-3 text-center border border-border hover:bg-muted transition-colors">
            <User className="h-4 w-4 mx-auto mb-1.5 text-purple-500" />
            <p className="text-xl font-bold text-foreground">
              {applicants.filter((a) => a.type === "cv").length}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">CV Submissions</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Loading interview applicants...</p>
        </div>
      ) : applicants.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <CheckCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">No applicants selected for interviews yet.</p>
        </div>
      ) : (
        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Selected Interview Applicants ({applicants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applicants.map((applicant) => (
                <div
                  key={`${applicant.type}-${applicant.id}`}
                  className="border border-border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column - Applicant Info */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{applicant.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {applicant.type === "application" ? "Job Application" : "CV Submission"}
                          </p>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1 ml-13 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{applicant.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{applicant.phoneNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Interview Info */}
                    <div className="space-y-2">
                      {/* Position */}
                      <div className="flex items-start gap-2">
                        <Briefcase className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Position</p>
                          <p className="font-medium text-foreground truncate">{applicant.vacancyTitle}</p>
                        </div>
                      </div>

                      {/* Interview Details */}
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Interview Date & Time</p>
                          <p className="font-medium text-foreground">
                            {formatDate(applicant.interviewDate)} at {applicant.interviewTime}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Interview Location</p>
                          <p className="font-medium text-foreground truncate">{applicant.interviewLocation}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-3 flex items-center justify-end">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {applicant.applicationStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InterviewApplicants;
