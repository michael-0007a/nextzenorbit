/**
 * Dashboard Page
 *
 * The authenticated user's home screen.
 * Premium design with animated hero, metric cards, and quick actions.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getTrialDaysRemaining, isTrialActive } from "@/lib/subscription";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { FileText, Briefcase, Sparkles, Target, ArrowRight, TrendingUp, Zap, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ProfileRow, SubscriptionRow } from "@/types/database";

// Force dynamic rendering to always fetch fresh profile data
export const dynamic = "force-dynamic";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Use admin client to bypass RLS issues
  const admin = createAdminClient();

  // Fetch profile + subscription + counts in parallel
  const [profileRes, subRes, resumeCountRes, appCountRes] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("resumes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    admin
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const profile = profileRes.data as ProfileRow | null;

  // Always prefer profile name (user-edited) over Google metadata
  const fullName = profile?.full_name
    || user.user_metadata?.full_name
    || user.user_metadata?.name
    || "";
  const firstName = fullName?.split(" ")[0] || user.email?.split("@")[0] || "there";
  const subscription = subRes.data as SubscriptionRow | null;
  const resumeCount = resumeCountRes.count ?? 0;
  const applicationCount = appCountRes.count ?? 0;

  const trialing = isTrialActive(subscription);
  const daysRemaining = getTrialDaysRemaining(subscription);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-[36px] border border-border bg-surface/80 p-8 md:p-10">
        <div className="absolute inset-0 bg-space opacity-60" />
        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/25 via-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-secondary/20 via-secondary/5 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-gradient-to-r from-primary-light/15 to-transparent rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-border">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-text-secondary">Welcome back</span>
              </div>

              <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
                {getGreeting()}, <span className="bg-gradient-to-r from-primary-light via-primary to-primary-light bg-clip-text text-transparent">{firstName}</span>
              </h1>

              <p className="text-text-secondary max-w-lg text-sm md:text-base leading-relaxed">
                Your job search command center. Track applications, optimize resumes with AI, and land your dream role.
              </p>
            </div>

            {/* Quick stat */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-border">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{resumeCount + applicationCount}</p>
                <p className="text-xs text-text-secondary">Total Activities</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trial banner */}
      {trialing && <TrialBanner daysRemaining={daysRemaining} />}

      {/* Metrics Grid - Bento Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Resumes Card */}
        <Link href="/resumes" className="group relative overflow-hidden rounded-3xl glass-card p-5 hover:border-primary/50 hover:shadow-[0_25px_45px_rgba(255,0,61,0.15)] transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{resumeCount}</p>
            <p className="text-sm text-text-secondary">Resumes</p>
          </div>
          <ChevronRight className="absolute bottom-5 right-5 h-5 w-5 text-stone opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Link>

        {/* Applications Card */}
        <Link href="/applications" className="group relative overflow-hidden rounded-3xl glass-card p-5 hover:border-secondary/50 hover:shadow-[0_25px_45px_rgba(124,58,237,0.15)] transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-secondary/10 transition-colors" />
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary mb-4 group-hover:scale-110 transition-transform">
              <Briefcase className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{applicationCount}</p>
            <p className="text-sm text-text-secondary">Applications</p>
          </div>
          <ChevronRight className="absolute bottom-5 right-5 h-5 w-5 text-stone opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Link>

        {/* Match Score Card */}
        <div className="group relative overflow-hidden rounded-3xl glass-card p-5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success mb-4">
              <Target className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">—</p>
            <p className="text-sm text-text-secondary">Avg. Match</p>
          </div>
        </div>

        {/* AI Credits Card */}
        <div className="group relative overflow-hidden rounded-3xl glass-card p-5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-info/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-info/10 text-info mb-4">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">∞</p>
            <p className="text-sm text-text-secondary">AI Credits</p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Large Cards */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Create Resume */}
          <Link href="/resumes" className="group relative overflow-hidden rounded-3xl glass-card border border-primary/20 p-6 hover:border-primary/40 hover:shadow-[0_30px_60px_rgba(255,0,61,0.18)] transition-all duration-300">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light text-white mb-4 shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Create Resume</h3>
              <p className="text-sm text-text-secondary mb-4">AI-powered resume builder</p>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                Get Started <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Analyze Job */}
          <Link href="/analyzer" className="group relative overflow-hidden rounded-3xl glass-card border border-secondary/20 p-6 hover:border-secondary/40 hover:shadow-[0_30px_60px_rgba(124,58,237,0.18)] transition-all duration-300">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-colors" />
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-secondary text-white">
                <Sparkles className="h-2.5 w-2.5" /> AI
              </span>
            </div>
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-secondary-light text-white mb-4 shadow-lg shadow-secondary/25 group-hover:scale-105 transition-transform">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Analyze Job</h3>
              <p className="text-sm text-text-secondary mb-4">Match score & suggestions</p>
              <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                Analyze Now <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Track Application */}
          <Link href="/applications" className="group relative overflow-hidden rounded-3xl glass-card p-6 hover:border-success/40 hover:shadow-[0_30px_60px_rgba(34,197,94,0.18)] transition-all duration-300">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-success/5 rounded-full blur-3xl group-hover:bg-success/10 transition-colors" />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success mb-4 group-hover:scale-105 transition-transform">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Track Application</h3>
              <p className="text-sm text-text-secondary mb-4">Log & monitor progress</p>
              <div className="flex items-center gap-2 text-sm font-medium text-success">
                Add New <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Activity Section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
              <Clock className="h-4 w-4 text-secondary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
          </div>
        </div>

        {/* Empty state */}
        <div className="relative overflow-hidden rounded-3xl glass-card p-10 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-transparent to-muted/30" />
          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Clock className="h-7 w-7 text-stone" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">No activity yet</h3>
            <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
              Your recent actions will appear here. Start by creating a resume or analyzing a job posting.
            </p>
            <Link
              href="/resumes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

