/**
 * Applications Page — Server Component
 *
 * Displays all tracked job applications with Kanban board and table views.
 * Route: /(dashboard)/applications
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ApplicationsView } from "@/components/applications/applications-view";
import type { ApplicationRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data } = await admin
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false });

  const applications = (data as ApplicationRow[]) ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/80 p-6">
        <div className="absolute inset-0 bg-space opacity-50" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-1 rounded-full bg-primary" />
            <h1 className="font-display text-2xl font-semibold text-foreground">Application Tracker</h1>
          </div>
          <p className="text-text-secondary">
            Track your job applications from applied to offer. Stay organized and never miss a follow-up.
          </p>

          {/* Stats badges */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {applications.length} total
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
              {applications.filter(a => a.status === 'interview').length} interviews
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
              {applications.filter(a => a.status === 'offer').length} offers
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
              {applications.filter(a => a.follow_up_at && new Date(a.follow_up_at) > new Date()).length} pending follow-ups
            </span>
          </div>
        </div>
      </div>

      <ApplicationsView initialApplications={applications} />
    </div>
  );
}

