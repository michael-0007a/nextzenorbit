/**
 * ActivityFeed — Recent activity on the dashboard
 *
 * Initially shows an empty state with CTA.
 * Will be populated in Phase 2+ with real activity data.
 */

import Link from "next/link";
import { FileText, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityFeedProps {
  className?: string;
}

export function ActivityFeed({ className }: ActivityFeedProps) {
  // TODO: Replace with real activity data in Phase 2+
  const activities: unknown[] = [];

  if (activities.length === 0) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl glass-card p-10 text-center space-y-5",
          className
        )}
      >
        {/* Decorative background elements */}
        <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-primary/30" />
        <div className="absolute top-8 left-12 w-1 h-1 rounded-full bg-secondary/30" />
        <div className="absolute bottom-6 right-8 w-3 h-3 rounded-full bg-accent/25" />
        <div className="absolute bottom-10 right-16 w-1.5 h-1.5 rounded-full bg-white/20" />

        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-white/5">
          <FileText className="h-7 w-7 text-text-secondary" />
          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 border border-primary/30">
            <Sparkles className="h-2.5 w-2.5 text-primary" />
          </div>
        </div>
        <div className="relative">
          <p className="text-base font-semibold text-foreground">
            No activity yet
          </p>
          <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto">
            Start by uploading a resume or analyzing a job description. Your recent actions will appear here.
          </p>
        </div>
        <Link
          href="/resumes"
          className="relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-light rounded-full transition-transform duration-300 hover:-translate-y-0.5 shadow-[0_18px_35px_rgba(255,0,61,0.3)]"
        >
          Upload your first resume <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // Future: render real activity items
  return null;
}

