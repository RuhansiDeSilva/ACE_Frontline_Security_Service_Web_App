import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

interface DashboardCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonText?: string;
  onClick?: () => void;
  variant?: "default" | "outline";
  disabled?: boolean;
  fullWidth?: boolean;
}

export default function DashboardCard({
  icon: Icon,
  title,
  description,
  buttonText,
  onClick,
  variant = "default",
  disabled = false,
  fullWidth = false,
}: DashboardCardProps) {
  const isOutline = variant === "outline";

  return (
    <div
      className={`group relative rounded-lg border p-5 transition-all duration-300 ${
        fullWidth ? "col-span-full" : ""
      } ${
        disabled
          ? "border-border/50 bg-muted/20 opacity-60 cursor-not-allowed"
          : isOutline
          ? "border-border/60 bg-card/50 hover:border-border hover:bg-card hover:shadow-md hover:-translate-y-1"
          : "border-border bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-all ${
            disabled
              ? "bg-muted/30 text-muted-foreground/40"
              : "bg-primary/15 text-primary group-hover:bg-primary/25 group-hover:scale-110"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-foreground mb-1 leading-tight">{title}</h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed">{description}</p>
          {buttonText && (
            <button
              onClick={disabled ? undefined : onClick}
              disabled={disabled}
              className={`mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-semibold transition-all ${
                disabled
                  ? "bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                  : isOutline
                  ? "border border-border text-foreground hover:border-primary/40 hover:bg-primary/5"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:gap-2"
              }`}
            >
              {buttonText}
              {!disabled && <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
