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
    iconBg: "bg-primary/10 group-hover:bg-primary/20",
    iconColor: "text-primary",
    borderHover: "group-hover:border-primary/40",
    glow: "group-hover:shadow-[0_0_24px_rgba(255,0,61,0.2)]",
    arrow: "text-primary",
  },
  leaf: {
    iconBg: "bg-secondary/10 group-hover:bg-secondary/20",
    iconColor: "text-secondary",
    borderHover: "group-hover:border-secondary/40",
    glow: "group-hover:shadow-[0_0_24px_rgba(124,58,237,0.2)]",
    arrow: "text-secondary",
  },
  shadow: {
    iconBg: "bg-accent/10 group-hover:bg-accent/20",
    iconColor: "text-accent",
    borderHover: "group-hover:border-accent/40",
    glow: "",
    arrow: "text-accent",
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
              "group relative rounded-3xl glass-card p-6",
              "transition-all duration-200",
              styles.borderHover,
              styles.glow,
              "space-y-4"
            )}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
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

