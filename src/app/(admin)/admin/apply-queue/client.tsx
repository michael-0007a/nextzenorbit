"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ExternalLink, CheckCircle2, Clock, XCircle, FileText, User, Filter, AlertCircle } from "lucide-react";

// Expanded type to include joined data
type QueueItem = {
  id: string;
  title: string;
  company: string;
  job_url: string;
  status: string;
  created_at: string;
  assigned_to: string | null;
  admin_notes: string | null;
  user: { email: string } | null;
  profile: { full_name: string; avatar_url: string | null; preferred_role: string | null } | null;
  resume: { id: string; title: string; target_role: string | null } | null;
  assignee: { full_name: string } | null;
};

export function ApplyQueueClient({ adminId }: { adminId: string }) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unassigned" | "mine" | "applied">("unassigned");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/admin/apply-queue", window.location.origin);
      if (filter === "unassigned") url.searchParams.set("assigned_to", "unassigned");
      if (filter === "mine") url.searchParams.set("assigned_to", "me");
      if (filter === "applied") url.searchParams.set("status", "applied");
      if (filter === "unassigned" || filter === "mine") url.searchParams.set("status", "pending");

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      } else {
        toast.error("Failed to load queue");
      }
    } catch (err) {
      toast.error("Error loading queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  const handleAction = async (id: string, action: "claim" | "unclaim", status?: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch("/api/admin/apply-queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, status }),
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success(action === "claim" ? "Claimed successfully" : "Updated successfully");
        fetchQueue(); // Refresh to ensure sync
      } else {
        toast.error(json.error?.message || "Action failed");
      }
    } catch (err) {
      toast.error("Action failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-warning bg-warning/10 border-warning/20";
      case "processing": return "text-info bg-info/10 border-info/20";
      case "applied": return "text-success bg-success/10 border-success/20";
      case "failed": return "text-error bg-error/10 border-error/20";
      default: return "text-text-secondary bg-white/5 border-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 p-1 bg-surface-elevated border border-border/60 rounded-xl w-full sm:w-fit">
        <button
          onClick={() => setFilter("unassigned")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            filter === "unassigned" ? "bg-white/10 text-foreground shadow-sm" : "text-text-secondary hover:text-foreground hover:bg-white/5"
          }`}
        >
          Unassigned
        </button>
        <button
          onClick={() => setFilter("mine")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            filter === "mine" ? "bg-white/10 text-foreground shadow-sm" : "text-text-secondary hover:text-foreground hover:bg-white/5"
          }`}
        >
          My Queue
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            filter === "all" ? "bg-white/10 text-foreground shadow-sm" : "text-text-secondary hover:text-foreground hover:bg-white/5"
          }`}
        >
          All Pending
        </button>
        <button
          onClick={() => setFilter("applied")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            filter === "applied" ? "bg-white/10 text-foreground shadow-sm" : "text-text-secondary hover:text-foreground hover:bg-white/5"
          }`}
        >
          Applied
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-3xl border-dashed">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Queue is clear!</h3>
          <p className="text-text-secondary max-w-sm mt-1">
            There are no {filter !== "all" ? filter : ""} apply requests matching this filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const isMine = item.assigned_to === adminId;
            const isUnassigned = !item.assigned_to;
            const isTaken = !isMine && !isUnassigned;

            return (
              <div key={item.id} className="flex flex-col glass-card rounded-2xl p-5 hover:border-border-hover transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-1" title={item.title}>
                      {item.title}
                    </h3>
                    <p className="text-sm text-secondary-light font-medium flex items-center gap-1.5 mt-0.5">
                      {item.company}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">
                    {item.profile?.full_name?.charAt(0) || <User className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.profile?.full_name || "Unknown User"}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {item.user?.email || "No email"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-6 flex-1">
                  {item.resume && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <FileText className="h-4 w-4 text-accent" />
                      <span className="truncate">Resume: {item.resume.title}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Clock className="h-4 w-4" />
                    <span>Requested {formatDistanceToNow(new Date(item.created_at))} ago</span>
                  </div>
                  
                  {isTaken && (
                    <div className="flex items-center gap-2 text-sm text-warning mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>Taken by {item.assignee?.full_name || "another admin"}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-auto pt-4 border-t border-border/60 flex items-center gap-2">
                  <a
                    href={item.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-text-secondary hover:text-foreground hover:bg-white/10 transition-colors shrink-0"
                    title="View Job Posting"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  {item.status === "pending" && (
                    <>
                      {isUnassigned && (
                        <Button
                          variant="primary"
                          className="flex-1"
                          onClick={() => handleAction(item.id, "claim")}
                          isLoading={updatingId === item.id}
                        >
                          Claim Request
                        </Button>
                      )}
                      
                      {isMine && (
                        <div className="flex gap-2 flex-1">
                          <Button
                            variant="primary"
                            className="flex-1 bg-success hover:bg-success/90 text-white shadow-[0_4px_14px_rgba(34,197,94,0.3)]"
                            onClick={() => handleAction(item.id, "claim", "applied")}
                            isLoading={updatingId === item.id}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark Applied
                          </Button>
                          <Button
                            variant="secondary"
                            className="px-3"
                            onClick={() => handleAction(item.id, "unclaim")}
                            disabled={updatingId === item.id}
                            title="Unclaim"
                          >
                            <XCircle className="h-4 w-4 text-text-secondary" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
