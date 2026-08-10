"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  FileText,
  Briefcase,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Download,
  FileSignature,
  Send,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type UserDetails = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  profileComplete: boolean;
  profile: {
    full_name: string;
    avatar_url: string | null;
    preferred_role: string | null;
    location: string | null;
    phone: string | null;
    headline: string | null;
    linkedin_url: string | null;
  } | null;
  subscription: {
    plan_id: string;
    status: string;
    current_period_end: string | null;
  } | null;
  resumes: Array<{
    id: string;
    title: string;
    is_base: boolean;
    template_id: string | null;
    created_at: string;
    updated_at: string;
  }>;
  baseResume: {
    id: string;
    title: string;
    template_id: string | null;
  } | null;
  queue: Array<{
    id: string;
    title: string;
    company: string;
    status: string;
    source: string;
    created_at: string;
    applied_at: string | null;
    admin_notes: string | null;
  }>;
  adminResumes: Array<{
    id: string;
    title: string;
    company: string | null;
    job_title: string | null;
    expires_at: string;
    created_at: string;
  }>;
  adminCoverLetters: Array<{
    id: string;
    title: string;
    company_name: string | null;
    job_title: string | null;
    expires_at: string;
    created_at: string;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string | null;
    is_read: boolean;
    created_at: string;
  }>;
};

export default function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingNotification, setSendingNotification] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${resolvedParams.id}`);
      const json = await res.json();

      if (json.success) {
        setUser(json.data);
      } else {
        setError(json.error?.message || "Failed to load user");
      }
    } catch {
      setError("Error loading user details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id]);

  const sendNotification = async (
    type: string,
    title: string,
    message: string
  ) => {
    if (!user) return;
    setSendingNotification(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          type,
          title,
          message,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Notification sent to user!");
        fetchUser(); // Refresh to show the new notification
      } else {
        toast.error("Failed to send notification.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSendingNotification(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-20">
        <p className="text-error mb-4">{error || "User not found"}</p>
        <Link href="/admin/users" className="text-secondary hover:underline">
          &larr; Back to users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">
            User Details
          </h1>
          <div className="flex items-center gap-2">
            {user.profileComplete ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-success/10 text-success border border-success/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Profile Complete
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-warning/10 text-warning border border-warning/20">
                <AlertTriangle className="h-3.5 w-3.5" />
                Incomplete Profile
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Col: Profile & Sub & Actions */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-2xl">
                {user.profile?.full_name?.charAt(0) || (
                  <User className="h-8 w-8" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {user.profile?.full_name || "Unknown"}
                </h2>
                <p className="text-sm text-text-secondary">{user.email}</p>
                {user.profile?.headline && (
                  <p className="text-xs text-primary mt-0.5">
                    {user.profile.headline}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary">Role</span>
                <span className="font-medium capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary">Joined</span>
                <span className="font-medium">
                  {format(new Date(user.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary">Location</span>
                <span className="font-medium">
                  {user.profile?.location || "Not set"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary">Preferred Role</span>
                <span className="font-medium">
                  {user.profile?.preferred_role || "Not set"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-text-secondary">Phone</span>
                <span className="font-medium">
                  {user.profile?.phone || "Not set"}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Subscription</h3>
            {user.subscription ? (
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-border/60">
                  <span className="text-text-secondary">Plan</span>
                  <span className="font-medium capitalize">
                    {user.subscription.plan_id}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/60">
                  <span className="text-text-secondary">Status</span>
                  <span
                    className={`font-medium ${
                      user.subscription.status === "active"
                        ? "text-success"
                        : "text-warning"
                    }`}
                  >
                    {user.subscription.status}
                  </span>
                </div>
                {user.subscription.current_period_end && (
                  <div className="flex justify-between py-2">
                    <span className="text-text-secondary">Renews</span>
                    <span className="font-medium">
                      {format(
                        new Date(user.subscription.current_period_end),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">
                Free Plan (No active subscription)
              </p>
            )}
          </div>

          {/* Admin Actions */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-secondary" />
              Admin Actions
            </h3>
            <div className="space-y-2">
              {!user.baseResume && (
                <Button
                  variant="secondary"
                  className="w-full text-xs justify-start"
                  leftIcon={<Send className="h-3.5 w-3.5" />}
                  isLoading={sendingNotification}
                  onClick={() =>
                    sendNotification(
                      "resume_request",
                      "Please upload your resume",
                      "Your admin team needs your base resume to apply for jobs on your behalf. Please upload or update your resume."
                    )
                  }
                >
                  Request Resume Upload
                </Button>
              )}
              {!user.profileComplete && (
                <Button
                  variant="ghost"
                  className="w-full text-xs justify-start"
                  leftIcon={<Send className="h-3.5 w-3.5" />}
                  isLoading={sendingNotification}
                  onClick={() =>
                    sendNotification(
                      "profile_update",
                      "Please complete your profile",
                      "Your profile is missing required information. Please update your profile to help us manage your applications better."
                    )
                  }
                >
                  Request Profile Update
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Resumes, Cover Letters & Queue */}
        <div className="md:col-span-2 space-y-6">
          {/* Base Resume Section */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-foreground">
                  Base Resume
                </h3>
              </div>
            </div>

            {user.baseResume ? (
              <div className="p-4 rounded-xl bg-white/5 border border-primary/20 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground">
                      {user.baseResume.title}
                    </p>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-primary/20 text-primary border border-primary/30">
                      Base
                    </span>
                  </div>
                </div>
                <a
                  href={`/api/resumes/${user.baseResume.id}/export?format=pdf&template=${user.baseResume.template_id || "classic"}`}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-warning/5 border border-warning/20 text-center">
                <p className="text-sm text-text-secondary mb-3">
                  No base resume uploaded yet.
                </p>
                <Button
                  variant="secondary"
                  className="text-xs"
                  leftIcon={<Send className="h-3.5 w-3.5" />}
                  isLoading={sendingNotification}
                  onClick={() =>
                    sendNotification(
                      "resume_request",
                      "Please upload your resume",
                      "Your admin team needs your base resume to apply for jobs on your behalf."
                    )
                  }
                >
                  Request Resume from User
                </Button>
              </div>
            )}
          </div>

          {/* All Resumes */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-foreground">
                  All Resumes ({user.resumes.length})
                </h3>
              </div>
            </div>

            {user.resumes.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No resumes created yet.
              </p>
            ) : (
              <div className="grid gap-3">
                {user.resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="p-4 rounded-xl bg-white/5 border border-border/60 flex justify-between items-center group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground">
                          {resume.title}
                        </p>
                        {resume.is_base && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-primary/20 text-primary border border-primary/30">
                            Base
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        Updated {formatDistanceToNow(new Date(resume.updated_at))} ago
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={`/api/resumes/${resume.id}/export?format=pdf&template=${resume.template_id || "classic"}`}
                        download
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-foreground transition-colors"
                      >
                        Download PDF
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin-Generated Resumes */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  Admin-Generated Resumes
                </h3>
              </div>
              <Link
                href={`/admin/users/${user.id}/generate-resume`}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                + Generate Resume
              </Link>
            </div>

            {user.adminResumes.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No admin-generated resumes yet.
              </p>
            ) : (
              <div className="grid gap-3">
                {user.adminResumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="p-4 rounded-xl bg-white/5 border border-border/60 flex justify-between items-center group"
                  >
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {resume.title}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        {resume.company ? `${resume.company} • ` : ""}
                        Expires in{" "}
                        {formatDistanceToNow(new Date(resume.expires_at))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-foreground transition-colors"
                        onClick={async () => {
                          const res = await fetch(
                            `/api/resumes/export-admin?id=${resume.id}&format=pdf`
                          );
                          if (res.ok) {
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${resume.title.replace(/\s+/g, "_")}.pdf`;
                            a.click();
                          }
                        }}
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin-Generated Cover Letters */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-secondary" />
                <h3 className="font-semibold text-foreground">
                  Admin-Generated Cover Letters
                </h3>
              </div>
              <Link
                href={`/admin/users/${user.id}/generate-cover-letter`}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
              >
                + Generate Cover Letter
              </Link>
            </div>

            {user.adminCoverLetters.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No admin-generated cover letters yet.
              </p>
            ) : (
              <div className="grid gap-3">
                {user.adminCoverLetters.map((cl) => (
                  <div
                    key={cl.id}
                    className="p-4 rounded-xl bg-white/5 border border-border/60 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {cl.title}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        {cl.company_name ? `${cl.company_name} • ` : ""}
                        Expires in{" "}
                        {formatDistanceToNow(new Date(cl.expires_at))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Apply History */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-secondary" />
                <h3 className="font-semibold text-foreground">
                  Apply History ({user.queue.length})
                </h3>
              </div>
            </div>

            {user.queue.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No job applications yet.
              </p>
            ) : (
              <div className="grid gap-3">
                {user.queue.map((job) => (
                  <div
                    key={job.id}
                    className="p-3 rounded-xl bg-white/5 border border-border/60"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground">
                            {job.title}
                          </p>
                          {job.source === "manual" && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-secondary/20 text-secondary border border-secondary/30">
                              Admin Added
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-secondary-light mt-0.5">
                          {job.company}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                          job.status === "pending"
                            ? "bg-warning/10 text-warning border-warning/20"
                            : job.status === "applied"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-white/5 text-text-secondary border-border/60"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary flex justify-between mt-2 pt-2 border-t border-border/40">
                      <span>
                        Requested:{" "}
                        {format(new Date(job.created_at), "MMM d, yyyy")}
                      </span>
                      {job.applied_at && (
                        <span>
                          Applied:{" "}
                          {format(new Date(job.applied_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    {job.admin_notes && (
                      <div className="mt-2 pt-2 border-t border-border/40 text-xs text-text-secondary bg-white/5 p-2 rounded">
                        <span className="font-medium text-foreground">
                          Admin Note:
                        </span>{" "}
                        {job.admin_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications History */}
          {user.notifications.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-foreground">
                  Recent Notifications
                </h3>
              </div>
              <div className="grid gap-2">
                {user.notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl bg-white/5 border border-border/40 flex items-center gap-3"
                  >
                    <div
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        n.is_read ? "bg-border" : "bg-secondary"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {formatDistanceToNow(new Date(n.created_at))} ago
                        {n.is_read ? " • Read" : " • Unread"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
