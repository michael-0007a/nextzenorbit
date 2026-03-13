/**
 * QuickActions — Primary action cards on the dashboard
 *
 * Three large link cards for the most common tasks.
 * Uses all 5 accent colors for visual variety.
 */

import Link from "next/link";
import { FileText, Search, Briefcase, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/resumes",
    icon: FileText,
    label: "New Resume",
    description: "Create an AI-optimized resume.",
    color: "mint" as const,
  },
  {
    href: "/analyzer",
    icon: Search,
    label: "Analyze Job",
    description: "Paste a JD and get a match score.",
    color: "leaf" as const,
  },
  {
    href: "/applications",
    icon: Briefcase,
    label: "Track Application",
    description: "Log a new job application.",
    color: "shadow" as const,
  },
];

const colorStyles = {
  mint: {
    iconBg: "bg-mint/10 group-hover:bg-mint/20",
    iconColor: "text-mint",
    borderHover: "group-hover:border-mint",
    glow: "group-hover:shadow-[0_0_20px_rgba(86,227,159,0.15)]",
    arrow: "text-mint",
  },
  leaf: {
    iconBg: "bg-leaf/10 group-hover:bg-leaf/20",
    iconColor: "text-leaf",
    borderHover: "group-hover:border-leaf",
    glow: "group-hover:shadow-[0_0_20px_rgba(89,201,165,0.15)]",
    arrow: "text-leaf",
  },
  shadow: {
    iconBg: "bg-shadow/20 group-hover:bg-shadow/30 dark:bg-shadow/30 dark:group-hover:bg-shadow/50",
    iconColor: "text-shadow dark:text-leaf",
    borderHover: "group-hover:border-shadow dark:group-hover:border-leaf",
    glow: "",
    arrow: "text-shadow dark:text-leaf",
  },
};

export interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-3", className)}>
      {actions.map((action) => {
        const Icon = action.icon;
        const styles = colorStyles[action.color];
        return (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "group relative rounded-sm border border-granite p-6",
              "transition-all duration-200",
              styles.borderHover,
              styles.glow,
              "space-y-4"
            )}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-transparent to-muted/30 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-sm transition-colors",
                styles.iconBg
              )}>
                <Icon className={cn("h-6 w-6 transition-colors", styles.iconColor)} />
              </div>
            </div>
            <div className="relative">
              <p className="text-base font-semibold text-foreground flex items-center gap-2">
                {action.label}
                <ArrowRight className={cn(
                  "h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all",
                  styles.arrow
                )} />
              </p>
              <p className="text-sm text-text-secondary mt-1">{action.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

