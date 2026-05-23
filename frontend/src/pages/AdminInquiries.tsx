import { useEffect, useState } from "react";
import {
  Building2, FileText, Calendar, Clock, CheckCircle, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import InquiryDetailsModal from "@/components/inquiry/InquiryDetailsModal";

interface ServiceInquiry {
  id: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  companyAddress: string;
  numberOfOfficers: number;
  serviceLocation: string;
  serviceDuration: string;
  additionalNotes?: string;
  submittedDate: string;
  status?: string;
  replied?: boolean;
  repliedAt?: string;
  replyMessage?: string;
  documentNotes?: string;
  sentToAdmin?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: "New", color: "text-blue-800", bg: "bg-blue-100" },
  IN_PROGRESS: { label: "In Progress", color: "text-yellow-800", bg: "bg-yellow-100" },
  RESOLVED: { label: "Resolved", color: "text-green-800", bg: "bg-green-100" },
  CLOSED: { label: "Closed", color: "text-gray-800", bg: "bg-gray-200" },
};

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<ServiceInquiry | null>(null);
  const { toast } = useToast();

  const authHeaders = (): HeadersInit => {
    const creds = sessionStorage.getItem("auth");
    return creds ? { Authorization: `Basic ${creds}` } : {};
  };

  const fetchInquiries = () => {
    fetch("/api/inquiries/admin/service-documents", { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((d) => {
        if (d && Array.isArray(d.data)) setInquiries(d.data);
      })
      .catch((err) => console.error("Failed to load admin inquiries:", err));
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleViewDetails = (inquiry: ServiceInquiry) => {
    setSelectedInquiry(inquiry);
    setDetailsOpen(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr.replace(" ", "T"));
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden bg-card p-5 text-foreground shadow-xl border border-border">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/15 via-primary/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Inquiry Documents</h2>
            <p className="text-sm text-muted-foreground">
              Service inquiry documents shared by the Operational Manager
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-3.5 text-center border border-border hover:bg-muted transition-colors">
            <Building2 className="h-5 w-5 mx-auto mb-1.5 text-primary" />
            <p className="text-2xl font-bold text-foreground">{inquiries.length}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Documents</p>
          </div>
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-3.5 text-center border border-border hover:bg-muted transition-colors">
            <Clock className="h-5 w-5 mx-auto mb-1.5 text-primary" />
            <p className="text-2xl font-bold text-foreground">
              {inquiries.filter((i) => i.status === "IN_PROGRESS" || i.status === "NEW").length}
            </p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Active</p>
          </div>
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-3.5 text-center border border-border hover:bg-muted transition-colors">
            <CheckCircle className="h-5 w-5 mx-auto mb-1.5 text-primary" />
            <p className="text-2xl font-bold text-foreground">
              {inquiries.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED").length}
            </p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Resolved / Closed</p>
          </div>
        </div>
      </div>

      {/* Inquiry Documents */}
      {inquiries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No inquiry documents shared yet.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Documents will appear here once the Operational Manager sends them.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inquiries.map((si) => {
            const statusInfo = statusConfig[si.status || "NEW"] || statusConfig["NEW"];
            return (
              <Card
                key={si.id}
                className="shadow-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-semibold text-foreground">{si.companyName}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {si.numberOfOfficers} officers
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                          {si.serviceDuration}
                        </span>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(si.submittedDate)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => handleViewDetails(si)}
                    >
                      <Eye className="h-3.5 w-3.5" /> View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {detailsOpen && selectedInquiry && (
        <InquiryDetailsModal
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          inquiry={selectedInquiry}
          inquiryType="service"
          onReplySuccess={() => {}}
          onInquiryUpdate={fetchInquiries}
          readOnly
        />
      )}
    </div>
  );
};

export default AdminInquiries;
