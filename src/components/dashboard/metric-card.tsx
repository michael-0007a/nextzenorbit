/**
 * MetricCard — Dashboard hero metric
 *
 * Displays a single KPI with icon, label, value, and optional trend.
 * Supports accent colors from the 5-color palette.
 */

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  accentColor?: "mint" | "leaf" | "shadow" | "midnight" | "granite";
  className?: string;
}

const accentStyles = {
  mint: {
    border: "border-t-mint border-t-2",
    iconBg: "bg-mint/10 dark:bg-mint/15",
    iconColor: "text-mint",
    glow: "shadow-[0_0_15px_rgba(86,227,159,0.15)]",
  },
  leaf: {
    border: "border-t-leaf border-t-2",
    iconBg: "bg-leaf/10 dark:bg-leaf/15",
    iconColor: "text-leaf",
    glow: "shadow-[0_0_15px_rgba(89,201,165,0.15)]",
  },
  shadow: {
    border: "border-t-shadow border-t-2",
    iconBg: "bg-shadow/20 dark:bg-shadow/30",
    iconColor: "text-shadow dark:text-leaf",
    glow: "",
  },
  midnight: {
    border: "border-t-midnight border-t-2",
    iconBg: "bg-midnight/10 dark:bg-midnight/50",
    iconColor: "text-midnight dark:text-mint",
    glow: "",
  },
  granite: {
    border: "",
    iconBg: "bg-muted",
    iconColor: "text-granite",
    glow: "",
  },
};

export function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  accentColor = "granite",
  className,
}: MetricCardProps) {
  const styles = accentStyles[accentColor];

  return (
    <div
      className={cn(
        "rounded-sm border border-granite p-5 space-y-3 transition-all duration-200",
        "hover:border-border-hover hover:shadow-md",
        styles.border,
        styles.glow,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-sm transition-colors",
          styles.iconBg
        )}>
          <Icon className={cn("h-5 w-5", styles.iconColor)} />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              trend.positive
                ? "text-mint bg-mint/10"
                : "text-error bg-error/10"
            )}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
        <p className="text-sm text-text-secondary mt-1">{label}</p>
      </div>
    </div>
  );
}

// ── Skeleton version ──
export function MetricCardSkeleton() {
  return (
    <div className="rounded-sm border border-granite border-t-2 border-t-granite/50 p-5 space-y-3 animate-pulse">
      <div className="h-10 w-10 rounded-sm bg-muted" />
      <div className="space-y-2">
        <div className="h-8 w-20 rounded-sm bg-muted" />
        <div className="h-4 w-28 rounded-sm bg-muted" />
      </div>
    </div>
  );
}

