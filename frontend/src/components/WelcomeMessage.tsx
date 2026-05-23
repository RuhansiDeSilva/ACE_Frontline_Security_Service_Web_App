import { Clock, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

interface WelcomeMessageProps {
  userName?: string;
  userRole?: string;
  customMessage?: string;
  showTime?: boolean;
  actionItems?: number;
  successMetrics?: string;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const getRoleMessage: Record<string, string> = {
  "ACCOUNT_EXECUTIVE": "Manage financial operations, payroll, and invoices with confidence",
  "ACCOUNTANT": "Handle accounting operations and financial records efficiently",
  "AREA_MANAGER": "Oversee area operations and manage security personnel",
  "EXECUTIVE_OFFICER": "Review loan requests, uniforms, and leave approvals",
  "OPERATION_MANAGER": "Manage day-to-day operations and staff registration",
  "DIRECTOR": "Monitor executive performance and strategic initiatives",
  "CHAIRMAN": "View comprehensive organizational metrics and reports",
  "SECURITY_OFFICER": "Check your assignments and submit reports",
};

export default function WelcomeMessage({
  userName = "User",
  userRole = "Administrator",
  customMessage,
  showTime = true,
  actionItems = 0,
  successMetrics,
}: WelcomeMessageProps) {
  const greeting = getGreeting();
  const firstName = userName?.split(" ")[0] || userName;
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const roleDescription =
    getRoleMessage[userRole] ||
    "Welcome to your professional dashboard";

  return (
    <div className="space-y-6 pb-6">
      {/* Main Welcome Header */}
      <div className="space-y-3">
        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[37px] font-black bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {greeting}, <span className="text-foreground">{firstName}</span>
            </h1>
            <p className="text-[19px] text-muted-foreground font-medium mt-2">
              {customMessage || roleDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Action Items & Success Metrics */}
      {(actionItems > 0 || successMetrics) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Action Items */}
          {actionItems > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-amber-700">
                  {actionItems} Item{actionItems !== 1 ? "s" : ""} Pending
                </p>
                <p className="text-[13px] text-amber-600">Action required</p>
              </div>
            </div>
          )}

          {/* Success Metrics */}
          {successMetrics && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-green-700">{successMetrics}</p>
                <p className="text-[13px] text-green-600">Successfully completed</p>
              </div>
            </div>
          )}

          {/* If only one metric, show a trending metric */}
          {actionItems === 0 && !successMetrics && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-blue-700">Performance</p>
                <p className="text-[13px] text-blue-600">On track</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-border via-primary/30 to-border" />
    </div>
  );
}
