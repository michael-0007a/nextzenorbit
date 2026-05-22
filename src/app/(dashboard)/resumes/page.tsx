/**
 * Resumes List Page — Server Component
 *
 * Displays all user resumes in a grid.
 * Empty state with CTA. Upload + Create new flows.
 * Route: /(dashboard)/resumes
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ResumeGrid } from "@/components/resume/resume-grid";

export const dynamic = "force-dynamic";

export default async function ResumesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: resumes, error } = await admin
    .from("resumes")
    .select("id, title, is_base, version, template_id, created_at, updated_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Resumes fetch error:", error.message);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/80 p-6">
        <div className="absolute inset-0 bg-space opacity-50" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-1 rounded-full bg-primary" />
              <h1 className="font-display text-2xl font-semibold text-foreground">My Resumes</h1>
            </div>
            <p className="text-text-secondary">
              Create and manage your tailored resumes. Use AI to optimize for each job.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {resumes?.length || 0} resume{(resumes?.length || 0) !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
      <ResumeGrid resumes={resumes ?? []} />
    </div>
  );
}

