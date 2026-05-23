import { useEffect, useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, MessageCircle, ChevronDown, ChevronRight, Mail, Phone, User,
  Calendar, MapPin, Clock, Send, CheckCircle, FileText, Reply, ArrowUpDown,
  Circle, AlertCircle, XCircle, Save, Inbox, Search, Shield, Users, Pencil, Archive, Eye, Trash2
} from "lucide-react";
import InquiryDetailsModal from "@/components/inquiry/InquiryDetailsModal";
import EnhancedReplyModal from "@/components/inquiry/EnhancedReplyModal";

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

interface GeneralInquiry {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  subject: string;
  message: string;
  submittedDate: string;
  status?: string;
  replied?: boolean;
  repliedAt?: string;
  replyMessage?: string;
}

interface RequestHistory {
  id: number;
  inquiryId: number;
  inquiryType: string;
  action: string;
  description: string;
  createdAt: string;
  actionBy: string;
}

const STATUS_OPTIONS = ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  NEW: { label: "New", color: "text-blue-800", bg: "bg-blue-100", icon: <Circle className="h-3 w-3" /> },
  IN_PROGRESS: { label: "In Progress", color: "text-yellow-800", bg: "bg-yellow-100", icon: <Clock className="h-3 w-3" /> },
  RESOLVED: { label: "Resolved", color: "text-green-800", bg: "bg-green-100", icon: <CheckCircle className="h-3 w-3" /> },
  CLOSED: { label: "Closed", color: "text-gray-800", bg: "bg-gray-200", icon: <XCircle className="h-3 w-3" /> },
};

const getStatusInfo = (status?: string) => statusConfig[status || "NEW"] || statusConfig["NEW"];

const OperationalInquiries = () => {
  const [serviceInquiries, setServiceInquiries] = useState<ServiceInquiry[]>([]);
  const [generalInquiries, setGeneralInquiries] = useState<GeneralInquiry[]>([]);
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const [expandedGeneralId, setExpandedGeneralId] = useState<number | null>(null);

  // Sort
  const [serviceSortAsc, setServiceSortAsc] = useState(true);
  const [generalSortAsc, setGeneralSortAsc] = useState(true);

  // View Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<ServiceInquiry | GeneralInquiry | null>(null);
  const [selectedInquiryType, setSelectedInquiryType] = useState<"service" | "general" | null>(null);

  // Reply modal state
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ type: "service" | "general"; id: number; email: string; name: string; subject: string } | null>(null);

  // Close confirmation
  const [closeConfirmId, setCloseConfirmId] = useState<number | null>(null);
  const [closeConfirmType, setCloseConfirmType] = useState<"service" | "general" | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Filter state
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [generalFilter, setGeneralFilter] = useState<string>("ALL");

  const { toast } = useToast();

  const authHeaders = (): HeadersInit => {
    const creds = sessionStorage.getItem("auth");
    return creds ? { Authorization: `Basic ${creds}` } : {};
  };

  const fetchService = () => {
    fetch("/api/inquiries/service", { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); })
      .then(d => { if (d && Array.isArray(d.data)) setServiceInquiries(d.data); })
      .catch(err => { console.error("Failed to load service inquiries:", err); });
  };

  const fetchGeneral = () => {
    fetch("/api/inquiries/general", { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); })
      .then(d => { if (d && Array.isArray(d.data)) setGeneralInquiries(d.data); })
      .catch(err => { console.error("Failed to load general inquiries:", err); });
  };

  useEffect(() => {
    fetchService();
    fetchGeneral();
  }, []);

  // Sort by status priority
  const statusOrder: Record<string, number> = { NEW: 0, IN_PROGRESS: 1, RESOLVED: 2, CLOSED: 3 };

  const filteredService = serviceFilter === "ALL"
    ? serviceInquiries
    : serviceInquiries.filter(s => (s.status || "NEW") === serviceFilter);
  const sortedService = [...filteredService].sort((a, b) => {
    const diff = (statusOrder[a.status || "NEW"] ?? 4) - (statusOrder[b.status || "NEW"] ?? 4);
    return serviceSortAsc ? diff : -diff;
  });

  const filteredGeneral = generalFilter === "ALL"
    ? generalInquiries
    : generalInquiries.filter(g => (g.status || "NEW") === generalFilter);
  const sortedGeneral = [...filteredGeneral].sort((a, b) => {
    const diff = (statusOrder[a.status || "NEW"] ?? 4) - (statusOrder[b.status || "NEW"] ?? 4);
    return generalSortAsc ? diff : -diff;
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr.replace(" ", "T"));
      return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  // Stats
  const serviceNew = serviceInquiries.filter(s => !s.status || s.status === "NEW").length;
  const serviceInProgress = serviceInquiries.filter(s => s.status === "IN_PROGRESS").length;
  const serviceClosed = serviceInquiries.filter(s => s.status === "CLOSED").length;
  const generalNew = generalInquiries.filter(g => !g.status || g.status === "NEW").length;
  const generalInProgress = generalInquiries.filter(g => g.status === "IN_PROGRESS").length;
  const generalClosed = generalInquiries.filter(g => g.status === "CLOSED").length;
  const generalPendingReply = generalInquiries.filter(g => !g.replied).length;

  const FILTER_OPTIONS = [
    { value: "ALL", label: "All" },
    { value: "NEW", label: "New" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
  ];

  // Handlers
  const handleViewDetails = (inquiry: ServiceInquiry | GeneralInquiry, type: "service" | "general") => {
    setSelectedInquiry(inquiry);
    setSelectedInquiryType(type);
    setDetailsModalOpen(true);
  };

  const handleReply = (inquiry: ServiceInquiry | GeneralInquiry, type: "service" | "general") => {
    setReplyTarget({
      type,
      id: inquiry.id,
      email: type === "service" ? (inquiry as ServiceInquiry).email : (inquiry as GeneralInquiry).email,
      name: type === "service" ? (inquiry as ServiceInquiry).contactPerson : (inquiry as GeneralInquiry).fullName,
      subject: type === "service" ? `Re: ${(inquiry as ServiceInquiry).companyName}` : `Re: ${(inquiry as GeneralInquiry).subject}`,
    });
    setReplyModalOpen(true);
  };

  const handleCloseInquiry = (id: number, type: "service" | "general") => {
    setCloseConfirmId(id);
    setCloseConfirmType(type);
  };

  const confirmClose = async () => {
    if (!closeConfirmId || !closeConfirmType) return;

    setIsClosing(true);
    try {
      let response;

      if (closeConfirmType === "general") {
        // Delete general inquiry
        response = await fetch(
          `/api/inquiries/general/${closeConfirmId}`,
          {
            method: "DELETE",
            headers: authHeaders()
          }
        );
      } else {
        // Mark service inquiry as closed
        response = await fetch(
          `/api/inquiries/service/${closeConfirmId}/status`,
          {
            method: "PUT",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CLOSED" })
          }
        );
      }

      if (!response.ok) throw new Error("Failed to process inquiry");

      const action = closeConfirmType === "general" ? "deleted" : "marked as closed";
      toast({
        title: "Success",
        description: `Inquiry ${action} successfully`
      });

      if (closeConfirmType === "service") {
        setServiceInquiries(prev => prev.map(s => s.id === closeConfirmId ? { ...s, status: "CLOSED" } : s));
      } else {
        setGeneralInquiries(prev => prev.filter(g => g.id !== closeConfirmId));
      }

      setCloseConfirmId(null);
      setCloseConfirmType(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process inquiry",
        variant: "destructive"
      });
    } finally {
      setIsClosing(false);
    }
  };

  const handleReplySuccess = () => {
    // Refresh inquiries after successful reply
    fetchService();
    fetchGeneral();
    setReplyModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative rounded-2xl overflow-hidden bg-card text-foreground p-5 shadow-xl border border-border">
        {/* Accent gradient */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/15 via-primary/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-40 h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
            <Inbox className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Inquiry Management</h2>
            <p className="text-sm text-muted-foreground">Review and respond to service and general inquiries</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative grid grid-cols-4 gap-3">
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-3 text-center border border-border hover:bg-muted transition-colors">
            <Building2 className="h-4 w-4 mx-auto mb-1.5 text-primary" />
            <p className="text-xl font-bold text-foreground">{serviceInquiries.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Service</p>
          </div>
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-3 text-center border border-border hover:bg-muted transition-colors">
            <MessageCircle className="h-4 w-4 mx-auto mb-1.5 text-green-500 dark:text-green-400" />
            <p className="text-xl font-bold text-foreground">{generalInquiries.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">General</p>
          </div>
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-3 text-center border border-border hover:bg-muted transition-colors">
            <Circle className="h-4 w-4 mx-auto mb-1.5 text-amber-500 dark:text-amber-400" />
            <p className="text-xl font-bold text-foreground">{serviceNew + generalNew}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">New</p>
          </div>
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-3 text-center border border-border hover:bg-muted transition-colors">
            <AlertCircle className="h-4 w-4 mx-auto mb-1.5 text-red-500 dark:text-red-400" />
            <p className="text-xl font-bold text-foreground">{generalPendingReply}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Pending Reply</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="service" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
          <TabsTrigger value="service" className="gap-2 text-sm font-bold">
            <Building2 className="h-4 w-4" /> Service Inquiries
            {serviceInquiries.length > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{serviceInquiries.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2 text-sm font-bold">
            <MessageCircle className="h-4 w-4" /> General Inquiries
            {generalInquiries.length > 0 && (
              <span className="ml-1 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">{generalInquiries.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* SERVICE INQUIRIES TAB */}
        <TabsContent value="service">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  Service Inquiries
                  <span className="text-sm font-normal text-muted-foreground">({serviceInquiries.length} total)</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setServiceSortAsc(!serviceSortAsc)} className="gap-1.5 text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5" /> Sort by Status
                </Button>
              </CardTitle>
              {/* Filter pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {FILTER_OPTIONS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setServiceFilter(f.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                      serviceFilter === f.value
                        ? "bg-primary text-white"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {f.label}
                    {f.value !== "ALL" && (
                      <span className="ml-1">
                        ({serviceInquiries.filter(s => (s.status || "NEW") === f.value).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {serviceInquiries.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No service inquiries received yet.</p>
              ) : (
                <div className="space-y-3">
                  {sortedService.map(si => (
                    <div key={si.id} className={`border rounded-xl overflow-hidden ${si.replied ? "border-green-200" : ""}`}>
                      <button
                        type="button"
                        onClick={() => setExpandedServiceId(prev => prev === si.id ? null : si.id)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-muted/40 hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="font-semibold text-foreground">{si.companyName}</span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusInfo(si.status).bg} ${getStatusInfo(si.status).color}`}>
                            {getStatusInfo(si.status).label}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(si.submittedDate)}
                          </span>
                        </div>
                        {expandedServiceId === si.id
                          ? <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          : <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                      </button>

                      {expandedServiceId === si.id && (
                        <div className="px-5 py-4 bg-muted/40 border-t space-y-4">
                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewDetails(si, "service")} className="gap-1.5 text-xs">
                              <Eye className="h-3.5 w-3.5" /> View Details
                            </Button>
                            {si.status !== "CLOSED" && (
                              <>
                                <Button size="sm" onClick={() => handleReply(si, "service")} className="gap-1.5 text-xs">
                                  <Reply className="h-3.5 w-3.5" /> {si.replied ? "Reply Again" : "Reply"}
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleCloseInquiry(si.id, "service")} className="gap-1.5 text-xs">
                                  <Trash2 className="h-3.5 w-3.5" /> Close
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GENERAL INQUIRIES TAB */}
        <TabsContent value="general">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </div>
                  General Inquiries
                  <span className="text-sm font-normal text-muted-foreground">({generalInquiries.length} total)</span>
                </div>
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-3">
                {FILTER_OPTIONS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setGeneralFilter(f.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                      generalFilter === f.value
                        ? "bg-primary text-white"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {f.label}
                    {f.value !== "ALL" && (
                      <span className="ml-1">
                        ({generalInquiries.filter(g => (g.status || "NEW") === f.value).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {generalInquiries.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No general inquiries received yet.</p>
              ) : (
                <div className="space-y-3">
                  {sortedGeneral.map(gi => (
                    <div key={gi.id} className={`border rounded-xl overflow-hidden ${gi.replied ? "border-green-200" : ""}`}>
                      <div
                        className="w-full flex items-center justify-between px-5 py-4 bg-muted/40 hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <MessageCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="font-semibold text-foreground">{gi.fullName}</span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusInfo(gi.status).bg} ${getStatusInfo(gi.status).color}`}>
                            {getStatusInfo(gi.status).label}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(gi.submittedDate)}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons always visible */}
                      <div className="px-5 py-4 bg-muted/40 border-t space-y-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewDetails(gi, "general")} className="gap-1.5 text-xs">
                            <Eye className="h-3.5 w-3.5" /> View Details
                          </Button>
                          {gi.status !== "CLOSED" && (
                            <>
                              <Button size="sm" onClick={() => handleReply(gi, "general")} className="gap-1.5 text-xs">
                                <Reply className="h-3.5 w-3.5" /> {gi.replied ? "Reply Again" : "Reply"}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleCloseInquiry(gi.id, "general")} className="gap-1.5 text-xs">
                                <Trash2 className="h-3.5 w-3.5" /> Close
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Details Modal */}
      {detailsModalOpen && selectedInquiry && selectedInquiryType && (
        <InquiryDetailsModal
          inquiry={selectedInquiry}
          inquiryType={selectedInquiryType}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          onReplySuccess={handleReplySuccess}
          onInquiryUpdate={() => {
            fetchService();
            fetchGeneral();
          }}
        />
      )}

      {/* Enhanced Reply Modal */}
      {replyModalOpen && replyTarget && (
        <EnhancedReplyModal
          open={replyModalOpen}
          onOpenChange={setReplyModalOpen}
          target={replyTarget}
          onReplySuccess={handleReplySuccess}
        />
      )}

      {/* Close Confirmation Dialog */}
      <Dialog open={closeConfirmId !== null} onOpenChange={(open) => {
        if (!open) {
          setCloseConfirmId(null);
          setCloseConfirmType(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Inquiry</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to mark this inquiry as closed? This action will update the status to CLOSED.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCloseConfirmId(null);
              setCloseConfirmType(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClose} disabled={isClosing}>
              {isClosing ? "Closing..." : "Close Inquiry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperationalInquiries;
