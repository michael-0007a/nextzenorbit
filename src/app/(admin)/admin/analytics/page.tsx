"use client";

import { useState, useEffect } from "react";
import { BarChart3, Users, Crown, Briefcase, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type AdminPerformance = {
  id: string;
  name: string;
  email: string;
  role: string;
  clientsCount: number;
  jobsApplied: number;
  jobsPending: number;
};

type Stats = {
  users: { regular: number; sso: number; total: number };
  subscriptions: { pro_active: number };
  queue: { pending: number; applied: number; total: number };
  adminPerformance?: AdminPerformance[];
};

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        } else {
          toast.error("Failed to load analytics");
        }
      } catch (err) {
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
      </div>
    );
  }

  // Very basic placeholder revenue estimation assuming $9/mo for Pro
  const estimatedMRR = stats.subscriptions.pro_active * 9;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Analytics
        </h1>
        <p className="text-text-secondary">
          Platform overview and revenue statistics.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-secondary/10 blur-xl" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-white/5 border border-border">
              <Users className="h-5 w-5 text-secondary-light" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">Total Users</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.users.total}</p>
          <div className="mt-2 flex gap-3 text-xs text-text-secondary">
            <span>{stats.users.regular} Regular</span>
            <span>•</span>
            <span>{stats.users.sso} SSO</span>
          </div>
        </div>

        {/* Active Pro Subs */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-white/5 border border-border">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">Active Pro Subs</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.subscriptions.pro_active}</p>
          <p className="mt-2 text-xs text-success flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Live
          </p>
        </div>

        {/* Estimated MRR */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-success/10 blur-xl" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-white/5 border border-border">
              <BarChart3 className="h-5 w-5 text-success" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">Est. MRR</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">${estimatedMRR}</p>
          <p className="mt-2 text-xs text-text-secondary">Based on $9/mo Pro plan</p>
        </div>

        {/* Apply Queue Status */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/10 blur-xl" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-white/5 border border-border">
              <Briefcase className="h-5 w-5 text-accent" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">Pending Applies</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.queue.pending}</p>
          <p className="mt-2 text-xs text-text-secondary">
            {stats.queue.applied} total applied
          </p>
        </div>
      </div>

      {/* Admin Performance Section */}
      {stats.adminPerformance && stats.adminPerformance.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-lg font-bold text-foreground">Admin Performance</h2>
          </div>
          <div className="rounded-xl border border-border/60 overflow-hidden bg-surface/30">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-text-secondary border-b border-border/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Clients Handled</th>
                  <th className="px-4 py-3 font-medium">Jobs Applied</th>
                  <th className="px-4 py-3 font-medium">Jobs Pending</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stats.adminPerformance.map((admin) => (
                  <tr key={admin.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{admin.name}</p>
                        {admin.name !== admin.email && (
                          <p className="text-xs text-text-secondary">{admin.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-secondary/10 text-secondary-light font-medium text-xs">
                        {admin.clientsCount} clients
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-success/10 text-success font-medium text-xs">
                        {admin.jobsApplied} applied
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-accent/10 text-accent font-medium text-xs">
                        {admin.jobsPending} pending
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a 
                        href={`/admin/analytics/${admin.id}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 text-foreground hover:bg-white/10 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m9 18 6-6-6-6"/></svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
