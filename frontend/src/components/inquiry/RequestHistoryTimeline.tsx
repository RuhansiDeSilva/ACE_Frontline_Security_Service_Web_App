import { Clock, FileText, Send, CheckCircle, User, Archive } from "lucide-react";

interface RequestItem {
  id: number;
  action: string;
  description: string;
  createdAt: string;
  actionBy: string;
}

interface RequestHistoryTimelineProps {
  history: RequestItem[];
}

const actionConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  CREATED: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Created"
  },
  REPLIED: {
    icon: <Send className="h-4 w-4" />,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Reply Sent"
  },
  STATUS_CHANGED: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    label: "Status Changed"
  },
  DOCUMENT_UPDATED: {
    icon: <FileText className="h-4 w-4" />,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    label: "Document Updated"
  },
  SENT_TO_ADMIN: {
    icon: <Archive className="h-4 w-4" />,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Sent to Admin"
  },
  OFFICER_ASSIGNED: {
    icon: <User className="h-4 w-4" />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    label: "Officer Assigned"
  },
  CLOSED: {
    icon: <Archive className="h-4 w-4" />,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    label: "Closed"
  }
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

const RequestHistoryTimeline = ({ history }: RequestHistoryTimelineProps) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">No history records available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item, index) => {
        const config = actionConfig[item.action] || actionConfig.CREATED;

        return (
          <div key={item.id} className="relative">
            {/* Timeline line */}
            {index !== history.length - 1 && (
              <div className="absolute left-5 top-10 w-0.5 h-12 bg-gray-200" />
            )}

            {/* Timeline item */}
            <div className="flex gap-4">
              {/* Icon circle */}
              <div className={`mt-1 flex-shrink-0 h-10 w-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                <div className={config.color}>
                  {config.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{config.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  <span>{formatDate(item.createdAt)}</span>
                  {item.actionBy && item.actionBy !== "SYSTEM" && (
                    <>
                      <span>•</span>
                      <span>{item.actionBy}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RequestHistoryTimeline;
