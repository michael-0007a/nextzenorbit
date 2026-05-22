"use client";

/**
 * Applications Table — Client Component
 *
 * Displays job applications in a table with status filters and actions.
 */

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, ExternalLink, Search, Filter } from "lucide-react";
import type { ApplicationRow, ApplicationStatus } from "@/types/database";

interface ApplicationsTableProps {
  applications: ApplicationRow[];
}

const statusConfig: Record<ApplicationStatus, { label: string; variant: "success" | "warning" | "error" | "info" | "default" | "primary" }> = {
  applied: { label: "Applied", variant: "default" },
  screening: { label: "Screening", variant: "info" },
  interview: { label: "Interview", variant: "primary" },
  offer: { label: "Offer", variant: "success" },
  rejected: { label: "Rejected", variant: "error" },
};

const allStatuses: ApplicationStatus[] = ["applied", "screening", "interview", "offer", "rejected"];

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">("all");

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(search.toLowerCase()) ||
      app.position.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (applications.length === 0) {
    return (
      <Card className="relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-secondary/10 rounded-full blur-xl" />

        <CardBody className="relative py-20 text-center">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-white/5">
            <Briefcase className="h-8 w-8 text-text-secondary" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-foreground">No applications yet</h3>
          <p className="mt-2 text-sm text-text-secondary max-w-sm mx-auto">
            Start tracking your job applications to stay organized throughout your search.
          </p>

          {/* Feature hints */}
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Track status
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-secondary/10 text-secondary border border-secondary/20">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Set reminders
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-accent/10 text-accent border border-accent/20">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              View analytics
            </span>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl border border-border bg-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search company or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-2xl border border-border bg-white/5 pl-9 pr-3 text-sm text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors sm:w-72"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 text-secondary shrink-0" />
          <button
            onClick={() => setFilterStatus("all")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              filterStatus === "all"
                ? "border-primary text-primary bg-primary/10 shadow-[0_0_10px_rgba(255,0,61,0.2)]"
                : "border-border text-text-secondary hover:text-foreground hover:border-primary/40"
            }`}
          >
            All ({applications.length})
          </button>
          {allStatuses.map((status) => {
            const count = applications.filter((a) => a.status === status).length;
            if (count === 0) return null;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  filterStatus === status
                    ? "border-primary text-primary bg-primary/10 shadow-[0_0_10px_rgba(255,0,61,0.2)]"
                    : "border-border text-text-secondary hover:text-foreground hover:border-primary/40"
                }`}
              >
                {statusConfig[status].label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Company</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Position</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Applied</th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Link</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id} className="border-b border-border/40 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{app.company}</span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{app.position}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusConfig[app.status].variant} size="sm">
                      {statusConfig[app.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(app.applied_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {app.job_url ? (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:text-primary-light transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-text-secondary">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    No applications match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}


