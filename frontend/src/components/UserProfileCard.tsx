import { User, FileText, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface UserProfileCardProps {
  fullName?: string;
  role?: string;
  photoUrl?: string;
  pendingPayrolls?: number;
  outstandingInvoices?: number;
  email?: string;
}

export default function UserProfileCard({
  fullName = "Account Executive",
  role = "Account Executive",
  photoUrl,
  pendingPayrolls = 0,
  outstandingInvoices = 0,
  email,
}: UserProfileCardProps) {
  return (
    <Card className="border-border/60 bg-card hover:border-primary/40 hover:shadow-lg transition-all h-fit sticky top-20">
      <CardHeader className="pb-4">
        <div className="flex flex-col items-center gap-4">
          {/* Profile Photo */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 bg-muted flex items-center justify-center">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-muted-foreground" />
            )}
          </div>

          {/* User Info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">
              {fullName}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              {role}
            </p>
            {email && (
              <p className="text-xs text-muted-foreground mt-1 break-all">
                {email}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Statistics Section */}
      <CardContent className="space-y-4">
        <div className="border-t border-border/50 pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
            Quick Statistics
          </p>

          {/* Pending Payrolls */}
          <div className="flex items-center gap-3 mb-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
            <div className="flex-shrink-0 p-2 bg-primary/15 rounded-lg">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Pending Payrolls</p>
              <p className="text-lg font-semibold text-primary">{pendingPayrolls}</p>
            </div>
          </div>

          {/* Outstanding Invoices */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
            <div className="flex-shrink-0 p-2 bg-blue-500/15 rounded-lg">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Outstanding Invoices</p>
              <p className="text-lg font-semibold text-blue-500">{outstandingInvoices}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
