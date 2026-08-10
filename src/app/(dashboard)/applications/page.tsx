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
  
  // 1. Fetch direct applications
  const { data: appData } = await admin
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false });

  // 2. Fetch job queue (admin/AI applied jobs)
  const { data: queueData } = await admin
    .from("job_queue")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["pending", "processing", "applied"])
    .order("created_at", { ascending: false });

  const applications = (appData as ApplicationRow[]) ?? [];
  const queueItems = (queueData as any[]) ?? [];

  // 3. Map queue items to ApplicationRow
  const mappedQueue: ApplicationRow[] = queueItems.map((q) => ({
    id: q.id,
    user_id: q.user_id,
    resume_id: q.resume_id || null,
    company: q.company,
    position: q.title,
    role: q.title,
    job_url: q.job_url,
    // If pending/processing, we still put them in the 'applied' column for visibility, 
    // but maybe with a note, or we consider them 'applied' in the tracker context.
    status: "applied" as const,
    applied_at: q.applied_at || q.created_at,
    salary_range: q.salary_text || null,
    location: q.location || null,
    work_type: "any",
    notes: [
      q.status === "pending" ? "⏳ In Queue to be applied" : 
      q.status === "processing" ? "🔄 Currently applying..." : 
      "✅ Applied via Admin/AI",
      q.admin_notes ? `Admin Note: ${q.admin_notes}` : null,
      q.description ? `\n${q.description}` : null
    ].filter(Boolean).join("\n\n"),
    follow_up_at: null,
    created_at: q.created_at,
    updated_at: q.updated_at || q.created_at,
  }));

  // Filter out any potential duplicates (e.g., if a webhook later creates a real application row with the same URL)
  const existingUrls = new Set(applications.map((a) => a.job_url).filter(Boolean));
  const uniqueMappedQueue = mappedQueue.filter((q) => !existingUrls.has(q.job_url));

  const allApplications = [...applications, ...uniqueMappedQueue].sort((a, b) => 
    new Date(b.applied_at || b.created_at).getTime() - new Date(a.applied_at || a.created_at).getTime()
  );

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
              {allApplications.length} total
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
              {allApplications.filter(a => a.status === 'interview').length} interviews
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
              {allApplications.filter(a => a.status === 'offer').length} offers
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
              {allApplications.filter(a => a.follow_up_at && new Date(a.follow_up_at) > new Date()).length} pending follow-ups
            </span>
          </div>
        </div>
      </div>

      <ApplicationsView initialApplications={allApplications} />
    </div>
  );
}

