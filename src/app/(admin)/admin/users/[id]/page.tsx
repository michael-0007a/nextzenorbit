"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, User, FileText, Briefcase, Mail } from "lucide-react";

type UserDetails = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  profile: { full_name: string; avatar_url: string | null; preferred_role: string | null; location: string | null } | null;
  subscription: { plan_id: string; status: string; current_period_end: string | null } | null;
  resumes: Array<{ id: string; title: string; target_role: string | null; created_at: string; updated_at: string }>;
  queue: Array<{ id: string; title: string; company: string; status: string; created_at: string; applied_at: string | null; admin_notes: string | null }>;
};

export default function AdminUserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/admin/users/${resolvedParams.id}`);
        const json = await res.json();
        
        if (json.success) {
          setUser(json.data);
        } else {
          setError(json.error?.message || "Failed to load user");
        }
      } catch (err) {
        setError("Error loading user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [resolvedParams.id]);

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
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>
        <h1 className="font-display text-2xl font-bold text-foreground">
          User Details
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Col: Profile & Sub */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-2xl">
                {user.profile?.full_name?.charAt(0) || <User className="h-8 w-8" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{user.profile?.full_name || "Unknown"}</h2>
                <p className="text-sm text-text-secondary">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary">Role</span>
                <span className="font-medium capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary">Joined</span>
                <span className="font-medium">{format(new Date(user.created_at), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary">Location</span>
                <span className="font-medium">{user.profile?.location || "Not set"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-text-secondary">Preferred Role</span>
                <span className="font-medium">{user.profile?.preferred_role || "Not set"}</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Subscription</h3>
            {user.subscription ? (
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-border/60">
                  <span className="text-text-secondary">Plan</span>
                  <span className="font-medium capitalize">{user.subscription.plan_id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/60">
                  <span className="text-text-secondary">Status</span>
                  <span className={`font-medium ${user.subscription.status === 'active' ? 'text-success' : 'text-warning'}`}>
                    {user.subscription.status}
                  </span>
                </div>
                {user.subscription.current_period_end && (
                  <div className="flex justify-between py-2">
                    <span className="text-text-secondary">Renews</span>
                    <span className="font-medium">{format(new Date(user.subscription.current_period_end), "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">Free Plan (No active subscription)</p>
            )}
          </div>
        </div>

        {/* Right Col: Resumes & Apply Queue */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-foreground">Resumes ({user.resumes.length})</h3>
            </div>
            
            {user.resumes.length === 0 ? (
              <p className="text-sm text-text-secondary">No resumes created yet.</p>
            ) : (
              <div className="grid gap-3">
                {user.resumes.map(resume => (
                  <div key={resume.id} className="p-3 rounded-xl bg-white/5 border border-border/60 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-foreground">{resume.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Target: {resume.target_role || "None"} • Updated {formatDistanceToNow(new Date(resume.updated_at))} ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-secondary" />
              <h3 className="font-semibold text-foreground">Apply History ({user.queue.length})</h3>
            </div>
            
            {user.queue.length === 0 ? (
              <p className="text-sm text-text-secondary">No job applications yet.</p>
            ) : (
              <div className="grid gap-3">
                {user.queue.map(job => (
                  <div key={job.id} className="p-3 rounded-xl bg-white/5 border border-border/60">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm text-foreground">{job.title}</p>
                        <p className="text-xs text-secondary-light">{job.company}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                        job.status === 'pending' ? 'bg-warning/10 text-warning border-warning/20' :
                        job.status === 'applied' ? 'bg-success/10 text-success border-success/20' :
                        'bg-white/5 text-text-secondary border-border/60'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary flex justify-between mt-2 pt-2 border-t border-border/40">
                      <span>Requested: {format(new Date(job.created_at), "MMM d, yyyy")}</span>
                      {job.applied_at && <span>Applied: {format(new Date(job.applied_at), "MMM d, yyyy")}</span>}
                    </div>
                    {job.admin_notes && (
                      <div className="mt-2 pt-2 border-t border-border/40 text-xs text-text-secondary bg-white/5 p-2 rounded">
                        <span className="font-medium text-foreground">Admin Note:</span> {job.admin_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
