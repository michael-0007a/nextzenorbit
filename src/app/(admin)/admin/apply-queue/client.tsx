"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  User,
  ChevronDown,
  ChevronRight,
  Search,
  Shield,
  AlertCircle,
  Loader2,
  Plus,
} from "lucide-react";

// ── Types ──

type QueueJob = {
  id: string;
  title: string;
  company: string;
  job_url: string;
  status: string;
  source: string;
  created_at: string;
  applied_at: string | null;
  admin_notes: string | null;
  assigned_to: string | null;
  resume: { id: string; title: string; target_role: string | null } | null;
};

type UserGroup = {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  preferred_role: string | null;
  profile_complete: boolean;
  claimed_by: string | null;
  claimed_by_name: string | null;
  claimed_at: string | null;
  jobs: QueueJob[];
  job_counts: {
    pending: number;
    processing: number;
    applied: number;
    failed: number;
    skipped: number;
  };
};

type FilterTab = "all" | "unclaimed" | "mine" | "completed";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  processing: "bg-secondary/10 text-secondary border-secondary/20",
  applied: "bg-success/10 text-success border-success/20",
  failed: "bg-error/10 text-error border-error/20",
  skipped: "bg-white/5 text-text-secondary border-border/60",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock,
  processing: Loader2,
  applied: CheckCircle2,
  failed: XCircle,
  skipped: AlertCircle,
};

// ── Main Component ──

export function ApplyQueueClient({ adminId, adminRole }: { adminId: string; adminRole: string }) {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [claimingUser, setClaimingUser] = useState<string | null>(null);
  const [updatingJob, setUpdatingJob] = useState<string | null>(null);

  // Add Job modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newJob, setNewJob] = useState({
    user_id: "",
    title: "",
    company: "",
    job_url: "",
    admin_notes: "",
    resume_id: "",
  });

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/apply-queue", window.location.origin);
      if (filter === "mine") url.searchParams.set("claimed_by", "me");
      if (filter === "unclaimed") url.searchParams.set("claimed_by", "unclaimed");

      const res = await fetch(url.toString());
      const json = await res.json();

      if (json.success) {
        let users = json.data.users || [];

        // Client-side filter for "completed" — users where all jobs are applied
        if (filter === "completed") {
          users = users.filter(
            (u: UserGroup) => u.jobs.length > 0 && u.jobs.every((j) => j.status === "applied")
          );
        }

        setUserGroups(users);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const toggleExpand = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleClaimUser = async (userId: string) => {
    setClaimingUser(userId);
    try {
      const res = await fetch("/api/admin/apply-queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim_user", user_id: userId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("User claimed successfully!");
        fetchQueue();
      } else {
        toast.error(json.error?.message || "Failed to claim user.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setClaimingUser(null);
    }
  };

  const handleUnclaimUser = async (userId: string) => {
    setClaimingUser(userId);
    try {
      const res = await fetch("/api/admin/apply-queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unclaim_user", user_id: userId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("User unclaimed.");
        fetchQueue();
      } else {
        toast.error(json.error?.message || "Failed to unclaim user.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setClaimingUser(null);
    }
  };

  const handleJobStatusChange = async (jobId: string, newStatus: string) => {
    setUpdatingJob(jobId);
    try {
      const res = await fetch("/api/admin/apply-queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Job marked as ${newStatus}.`);
        fetchQueue();
      }
    } catch {
      toast.error("Failed to update job.");
    } finally {
      setUpdatingJob(null);
    }
  };

  const handleAddJob = async () => {
    if (!newJob.user_id || !newJob.title || !newJob.company || !newJob.job_url) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/apply-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Job added to queue!");
        setIsAddModalOpen(false);
        setNewJob({ user_id: "", title: "", company: "", job_url: "", admin_notes: "", resume_id: "" });
        fetchQueue();
      } else {
        toast.error(json.error?.message || "Failed to add job.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Search filter ──
  const filteredGroups = search
    ? userGroups.filter(
        (u) =>
          u.full_name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : userGroups;

  // ── Stats ──
  const totalUsers = filteredGroups.length;
  const totalJobs = filteredGroups.reduce((sum, u) => sum + u.jobs.length, 0);
  const totalPending = filteredGroups.reduce((sum, u) => sum + u.job_counts.pending, 0);

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Users", value: totalUsers, color: "text-primary" },
          { label: "Total Jobs", value: totalJobs, color: "text-secondary" },
          { label: "Pending", value: totalPending, color: "text-warning" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card rounded-xl p-4 flex items-center justify-between"
          >
            <span className="text-sm text-text-secondary">{stat.label}</span>
            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Filter Tabs + Search + Add */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-border/40">
          {(["all", "unclaimed", "mine", "completed"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 capitalize ${
                filter === tab
                  ? "bg-primary/20 text-primary shadow-sm"
                  : "text-text-secondary hover:text-foreground hover:bg-white/5"
              }`}
            >
              {tab === "mine" ? "My Users" : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Job
          </Button>
        </div>
      </div>

      {/* User Groups */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-20">
          <User className="h-12 w-12 text-text-secondary mx-auto mb-4 opacity-40" />
          <p className="text-text-secondary">No users found in the queue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group) => {
            const isExpanded = expandedUsers.has(group.user_id);
            const isMine = group.claimed_by === adminId;

            return (
              <div
                key={group.user_id}
                className={`glass-card rounded-2xl overflow-hidden transition-all duration-200 ${
                  isMine ? "border-primary/30 shadow-[0_0_16px_rgba(255,0,61,0.08)]" : ""
                }`}
              >
                {/* User Header */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleExpand(group.user_id)}
                >
                  {/* Expand Icon */}
                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-text-secondary" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-text-secondary" />
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-lg">
                    {group.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {group.full_name}
                      </h3>
                      {!group.profile_complete && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-warning/20 text-warning border border-warning/30">
                          Incomplete Profile
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary truncate">
                      {group.preferred_role || group.email}
                    </p>
                  </div>

                  {/* Job Count Badges */}
                  <div className="hidden md:flex items-center gap-2">
                    {group.job_counts.pending > 0 && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-warning/10 text-warning border border-warning/20">
                        {group.job_counts.pending} pending
                      </span>
                    )}
                    {group.job_counts.applied > 0 && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-success/10 text-success border border-success/20">
                        {group.job_counts.applied} applied
                      </span>
                    )}
                    {group.job_counts.processing > 0 && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                        {group.job_counts.processing} processing
                      </span>
                    )}
                  </div>

                  {/* Claim Status / Actions */}
                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {group.claimed_by ? (
                      isMine ? (
                        <button
                          onClick={() => handleUnclaimUser(group.user_id)}
                          disabled={claimingUser === group.user_id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                        >
                          <Shield className="h-3.5 w-3.5" />
                          {claimingUser === group.user_id ? "..." : "Claimed by You"}
                        </button>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-text-secondary border border-border/40">
                          <Shield className="h-3.5 w-3.5" />
                          {group.claimed_by_name || "Another Admin"}
                        </span>
                      )
                    ) : (
                      adminRole !== "admin" && (
                        <Button
                          variant="secondary"
                          className="text-xs h-8"
                          onClick={() => handleClaimUser(group.user_id)}
                          isLoading={claimingUser === group.user_id}
                        >
                          Claim User
                        </Button>
                      )
                    )}

                    <Link
                      href={`/admin/users/${group.user_id}`}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-foreground transition-colors"
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>

                {/* Expanded: Job List */}
                {isExpanded && (
                  <div className="border-t border-border/40 bg-white/[0.02]">
                    <div className="p-4 space-y-2">
                      {group.jobs.length === 0 ? (
                        <p className="text-sm text-text-secondary text-center py-4">
                          No jobs in queue yet.
                        </p>
                      ) : (
                        group.jobs.map((job) => {
                          const StatusIcon = STATUS_ICONS[job.status] || Clock;
                          return (
                            <div
                              key={job.id}
                              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-border/40 group hover:border-border/60 transition-colors"
                            >
                              {/* Status Icon */}
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                                  STATUS_STYLES[job.status] || STATUS_STYLES.pending
                                }`}
                              >
                                <StatusIcon className="h-4 w-4" />
                              </div>

                              {/* Job Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {job.title}
                                  </p>
                                  {job.source === "manual" && (
                                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-secondary/20 text-secondary border border-secondary/30">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-text-secondary truncate">
                                  {job.company} •{" "}
                                  {formatDistanceToNow(new Date(job.created_at))} ago
                                </p>
                              </div>

                              {/* Status Badge */}
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                                  STATUS_STYLES[job.status] || STATUS_STYLES.pending
                                }`}
                              >
                                {job.status}
                              </span>

                              {/* Actions */}
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {job.status === "pending" && (
                                  <button
                                    onClick={() => handleJobStatusChange(job.id, "applied")}
                                    disabled={updatingJob === job.id}
                                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                                  >
                                    {updatingJob === job.id ? "..." : "Mark Applied"}
                                  </button>
                                )}
                                <a
                                  href={job.job_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:text-foreground hover:bg-white/10 transition-colors"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Job Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Add Job to Queue
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  User ID <span className="text-error">*</span>
                </label>
                <Input
                  value={newJob.user_id}
                  onChange={(e) => setNewJob({ ...newJob, user_id: e.target.value })}
                  placeholder="User UUID"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Job Title <span className="text-error">*</span>
                  </label>
                  <Input
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Company <span className="text-error">*</span>
                  </label>
                  <Input
                    value={newJob.company}
                    onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                    placeholder="e.g. Google"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Job URL <span className="text-error">*</span>
                </label>
                <Input
                  value={newJob.job_url}
                  onChange={(e) => setNewJob({ ...newJob, job_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Resume ID (Optional)
                </label>
                <Input
                  value={newJob.resume_id}
                  onChange={(e) => setNewJob({ ...newJob, resume_id: e.target.value })}
                  placeholder="Resume UUID to attach"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Admin Notes
                </label>
                <Input
                  value={newJob.admin_notes}
                  onChange={(e) => setNewJob({ ...newJob, admin_notes: e.target.value })}
                  placeholder="Internal notes..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddJob} isLoading={submitting}>
                Add to Queue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
