/**
 * ActivityFeed — what the Orbit team did for this client.
 * Data comes from getClientActivity (src/lib/activity.ts), rendered on the server.
 */

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText, ArrowRight, Sparkles, Send, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityItem, ActivityWeek } from "@/lib/activity";

export interface ActivityFeedProps {
  items: ActivityItem[];
  week: ActivityWeek;
  className?: string;
}

const KIND = {
  applied: { icon: Send, verb: "applied to", tone: "bg-success/10 text-success" },
  resume: { icon: FileText, verb: "tailored a resume for", tone: "bg-primary/10 text-primary" },
  cover_letter: { icon: PenTool, verb: "wrote a cover letter for", tone: "bg-secondary/10 text-secondary" },
} as const;

export function ActivityFeed({ items, week, className }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className={cn("relative overflow-hidden rounded-3xl glass-card p-10 text-center space-y-5", className)}>
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-white/5">
          <FileText className="h-7 w-7 text-text-secondary" />
          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 border border-primary/30">
            <Sparkles className="h-2.5 w-2.5 text-primary" />
          </div>
        </div>
        <div className="relative">
          <p className="text-base font-semibold text-foreground">No team activity yet</p>
          <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto">
            Applications, tailored resumes and cover letters your Orbit team prepares for you will appear here.
          </p>
        </div>
        <Link
          href="/resumes"
          className="relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-light rounded-full transition-transform duration-300 hover:-translate-y-0.5 shadow-[0_18px_35px_rgba(255,0,61,0.3)]"
        >
          Upload your resume <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "Applications sent", value: week.applied, ...KIND.applied },
    { label: "Resumes tailored", value: week.resumes, ...KIND.resume },
    { label: "Cover letters", value: week.cover_letters, ...KIND.cover_letter },
  ];

  return (
    <div className={cn("rounded-3xl glass-card p-6 space-y-6", className)}>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-3">Your team this week</p>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-white/5 p-4">
              <div className={cn("mb-3 flex h-8 w-8 items-center justify-center rounded-lg", stat.tone)}><stat.icon className="h-4 w-4" /></div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{stat.value}</p>
              <p className="text-xs text-text-secondary">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
      <ol className="relative space-y-4 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-border">
        {items.map((item, index) => {
          const { icon: Icon, verb, tone } = KIND[item.kind];
          return (
            <li key={`${item.kind}-${item.happened_at}-${index}`} className="flex items-start gap-3">
              <div className={cn("relative flex h-9 w-9 flex-none items-center justify-center rounded-xl ring-4 ring-surface", tone)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{item.actor_name ?? "Your team"}</span> {verb}{" "}
                  <span className="font-semibold">{item.title}</span>
                  {item.detail ? <span className="text-text-secondary"> at {item.detail}</span> : null}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatDistanceToNow(new Date(item.happened_at), { addSuffix: true })}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
