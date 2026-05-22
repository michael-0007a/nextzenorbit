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
    border: "border-t-primary border-t-2",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    glow: "shadow-[0_0_20px_rgba(255,0,61,0.2)]",
  },
  leaf: {
    border: "border-t-secondary border-t-2",
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
    glow: "shadow-[0_0_20px_rgba(124,58,237,0.2)]",
  },
  shadow: {
    border: "border-t-accent border-t-2",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    glow: "",
  },
  midnight: {
    border: "border-t-border border-t-2",
    iconBg: "bg-white/5",
    iconColor: "text-foreground",
    glow: "",
  },
  granite: {
    border: "",
    iconBg: "bg-white/5",
    iconColor: "text-text-secondary",
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
        "rounded-3xl glass-card p-5 space-y-3 transition-all duration-200",
        "hover:border-border-hover hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)]",
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
                ? "text-primary bg-primary/10"
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
    <div className="rounded-3xl border border-border/60 p-5 space-y-3 animate-pulse">
      <div className="h-10 w-10 rounded-2xl bg-white/5" />
      <div className="space-y-2">
        <div className="h-8 w-20 rounded-xl bg-white/5" />
        <div className="h-4 w-28 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

