import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Mail, Phone, User, MapPin, Calendar, Building2, Save, Archive, Loader2,
  Clock, FileText, CheckCircle, Users
} from "lucide-react";
import RequestHistoryTimeline from "./RequestHistoryTimeline";

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
  officerRoles?: string;
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

interface InquiryDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inquiry: ServiceInquiry | GeneralInquiry;
  inquiryType: "service" | "general";
  onReplySuccess: () => void;
  onInquiryUpdate: () => void;
  readOnly?: boolean;
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  NEW: { label: "New", bg: "bg-blue-100", color: "text-blue-800" },
  IN_PROGRESS: { label: "In Progress", bg: "bg-yellow-100", color: "text-yellow-800" },
  RESOLVED: { label: "Resolved", bg: "bg-green-100", color: "text-green-800" },
  CLOSED: { label: "Closed", bg: "bg-gray-200", color: "text-gray-800" },
};

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr.replace(" ", "T"));
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateStr;
  }
};

const InquiryDetailsModal = ({
  open,
  onOpenChange,
  inquiry,
  inquiryType,
  onReplySuccess,
  onInquiryUpdate,
  readOnly = false
}: InquiryDetailsModalProps) => {
  const [documentNotes, setDocumentNotes] = useState(inquiry.documentNotes || "");
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [isSendingAdmin, setIsSendingAdmin] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandOfficerRoles, setExpandOfficerRoles] = useState(false);
  const { toast } = useToast();

  const authHeaders = (): HeadersInit => {
    const creds = sessionStorage.getItem("auth");
    return creds ? { Authorization: `Basic ${creds}` } : {};
  };

  useEffect(() => {
    if (open) {
      setDocumentNotes(inquiry.documentNotes || "");
      if (!readOnly) {
        fetchHistory();
      } else {
        setHistory([]);
      }
    }
  }, [open, inquiry, readOnly]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `/api/inquiries/${inquiryType}/${inquiry.id}/history`,
        { headers: authHeaders() }
      );

      if (!response.ok) throw new Error("Failed to fetch history");

      const data = await response.json();
      setHistory(data.data || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSaveDocumentNotes = async () => {
    if (readOnly) return;
    if (inquiryType !== "service") {
      toast({
        title: "Info",
        description: "Document notes are only available for service inquiries"
      });
      return;
    }

    setIsSavingDoc(true);
    try {
      const response = await fetch(
        `/api/inquiries/service/${inquiry.id}/document`,
        {
          method: "PUT",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ notes: documentNotes })
        }
      );

      if (!response.ok) throw new Error("Failed to save document notes");

      toast({
        title: "Success",
        description: "Document notes saved successfully"
      });

      onInquiryUpdate();
      await fetchHistory();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save notes",
        variant: "destructive"
      });
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleSendToAdmin = async () => {
    if (readOnly) return;
    if (inquiryType !== "service") {
      toast({
        title: "Info",
        description: "Send to administration is only available for service inquiries"
      });
      return;
    }

    setIsSendingAdmin(true);
    try {
      const response = await fetch(
        `/api/inquiries/service/${inquiry.id}/send-to-admin`,
        {
          method: "PUT",
          headers: authHeaders()
        }
      );

      if (!response.ok) throw new Error("Failed to send to administration");

      toast({
        title: "Success",
        description: "Inquiry sent to administration (Director, Executive, Chairman)"
      });

      onInquiryUpdate();
      await fetchHistory();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send to administration",
        variant: "destructive"
      });
    } finally {
      setIsSendingAdmin(false);
    }
  };

  const serviceInquiry = inquiry as ServiceInquiry;
  const generalInquiry = inquiry as GeneralInquiry;
  const status = inquiry.status || "NEW";
  const statusInfo = statusConfig[status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>
                {inquiryType === "service" ? serviceInquiry.companyName : generalInquiry.fullName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Inquiry ID: {inquiry.id} • {inquiryType === "service" ? "Service Inquiry" : "General Inquiry"}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo?.bg} ${statusInfo?.color}`}>
              {statusInfo?.label}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Key Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Submitted By</p>
                  <p className="text-sm mt-1">
                    {inquiryType === "service" ? serviceInquiry.contactPerson : generalInquiry.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Submitted On</p>
                  <p className="text-sm mt-1">{formatDate(inquiry.submittedDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Email</p>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {inquiry.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Phone</p>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {inquiry.phoneNumber}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Inquiry Specific Info */}
          {inquiryType === "service" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Service Inquiry Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Company Name</p>
                      <p className="text-sm mt-1">{serviceInquiry.companyName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Service Location</p>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {serviceInquiry.serviceLocation}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">No. of Officers</p>
                      <button
                        type="button"
                        onClick={() => setExpandOfficerRoles(!expandOfficerRoles)}
                        className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                      >
                        <span className="text-sm font-bold text-blue-900">
                          Total Officers: <span className="text-lg text-blue-700">{serviceInquiry.numberOfOfficers}</span>
                        </span>
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                          {expandOfficerRoles ? "Hide Details" : "Show Details"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Officer Roles */}
                  {expandOfficerRoles && serviceInquiry.officerRoles && (
                    <div className="border-t pt-4">
                      {(() => {
                        try {
                          const roles = JSON.parse(serviceInquiry.officerRoles);
                          const OFFICER_CATEGORIES: Record<string, string[]> = {
                            "Entry-Level Officers": ["Junior Security Officer (JSO)", "Security Guard", "Unarmed Security Officer"],
                            "Mid-Level Officers": ["Senior Security Officer (SSO)", "Armed Security Officer", "Mobile Patrol Officer", "CCTV Operator"],
                            "Specialized Officers": ["Event Security Officer", "Corporate Security Officer", "Industrial Security Officer", "Loss Prevention Officer", "Personal Security Officer"],
                            "Supervisory & Management": ["Security Supervisor", "Site Security Manager", "Security Manager"],
                          };

                          return (
                            <div className="space-y-3">
                              <p className="text-xs font-semibold text-blue-900 uppercase mb-2">Position-Wise Count</p>
                              {Object.entries(OFFICER_CATEGORIES).map(([category, categoryRoles]) => {
                                const categoryCount = categoryRoles.reduce((sum: number, role: string) => sum + (Number(roles[role]) || 0), 0);
                                if (categoryCount === 0) return null;

                                return (
                                  <div key={category} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                    <p className="font-semibold text-sm text-blue-900 mb-2 flex items-center justify-between">
                                      <span className="flex items-center gap-2">
                                        <span className="text-blue-600">🔹</span>
                                        {category}
                                      </span>
                                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded font-bold">
                                        {categoryCount}
                                      </span>
                                    </p>
                                    <div className="space-y-1.5">
                                      {categoryRoles.map((role: string) => {
                                        const count = roles[role];
                                        if (!count) return null;
                                        return (
                                          <div key={role} className="flex items-center justify-between text-xs">
                                            <span className="text-gray-700">{role}</span>
                                            <span className="font-bold text-blue-700 bg-white px-2 py-1 rounded">
                                              {count}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        } catch {
                          return <p className="text-sm text-muted-foreground">Unable to parse officer roles</p>;
                        }
                      })()}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Service Duration</p>
                      <p className="text-sm mt-1">{serviceInquiry.serviceDuration}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Company Address</p>
                    <p className="text-sm mt-1">{serviceInquiry.companyAddress}</p>
                  </div>

                  {serviceInquiry.additionalNotes && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Additional Notes</p>
                      <p className="text-sm mt-1">{serviceInquiry.additionalNotes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* General Inquiry Message */}
          {inquiryType === "general" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">inquiry Message</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Subject</p>
                    <p className="text-sm mt-1">{generalInquiry.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Message</p>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{generalInquiry.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reply Information */}
          {inquiry.replied && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-green-900">
                  <CheckCircle className="h-4 w-4" />
                  Reply Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-green-800 uppercase">Replied On</p>
                    <p className="mt-1 text-green-900">{formatDate(inquiry.repliedAt || "")}</p>
                  </div>
                  {inquiry.replyMessage && (
                    <div>
                      <p className="text-xs font-semibold text-green-800 uppercase">Reply Message</p>
                      <p className="mt-1 text-green-900 whitespace-pre-wrap">{inquiry.replyMessage}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Notes */}
          {inquiryType === "service" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {readOnly ? (
                  serviceInquiry.documentNotes ? (
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {serviceInquiry.documentNotes}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No document notes provided.</p>
                  )
                ) : (
                  <Textarea
                    value={documentNotes}
                    onChange={(e) => setDocumentNotes(e.target.value)}
                    placeholder="Add notes about this service inquiry..."
                    className="min-h-[120px]"
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Request History */}
          {!readOnly && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Request History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <RequestHistoryTimeline history={history} />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!readOnly && (
            <div className="flex gap-2">
              {inquiryType === "service" && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSaveDocumentNotes}
                    disabled={isSavingDoc}
                    className="gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingDoc ? "Saving..." : "Save Document"}
                  </Button>
                  {!serviceInquiry.sentToAdmin && (
                    <Button
                      onClick={handleSendToAdmin}
                      disabled={isSendingAdmin}
                      className="gap-1.5"
                    >
                      <Archive className="h-4 w-4" />
                      {isSendingAdmin ? "Sending..." : "Send to Administration"}
                    </Button>
                  )}
                  {serviceInquiry.sentToAdmin && (
                    <Button variant="outline" disabled className="gap-1.5">
                      <Archive className="h-4 w-4" />
                      Sent to Admin
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InquiryDetailsModal;
