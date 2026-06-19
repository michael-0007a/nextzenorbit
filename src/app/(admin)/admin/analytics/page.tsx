"use client";

import { useState, useEffect } from "react";
import { BarChart3, Users, Crown, Briefcase, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type Stats = {
  users: { regular: number; sso: number; total: number };
  subscriptions: { pro_active: number };
  queue: { pending: number; applied: number; total: number };
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
    </div>
  );
}
