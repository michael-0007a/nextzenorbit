/**
 * Job Analyzer Page — Server Component
 *
 * Paste a job description to get AI-powered analysis and resume tailoring.
 * Route: /(dashboard)/analyzer
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { JobAnalyzerForm } from "@/components/analyzer/job-analyzer-form";

export default async function AnalyzerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user resumes for the dropdown using admin client
  const admin = createAdminClient();
  const { data: resumes } = await admin
    .from("resumes")
    .select("id, title")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-sm border border-granite bg-gradient-to-br from-leaf/5 via-transparent to-mint/5 p-6">
        <div className="absolute top-0 left-1/2 w-64 h-64 bg-leaf/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-mint/5 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-1 rounded-full bg-leaf" />
            <h1 className="text-2xl font-bold text-foreground">Job Analyzer</h1>
          </div>
          <p className="text-text-secondary max-w-lg">
            Paste a job description and let AI analyze the match with your resume. Get actionable insights to improve your application.
          </p>
        </div>
        {/* AI indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-mint/10 border border-mint/20">
          <div className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
          <span className="text-xs font-medium text-mint">AI Powered</span>
        </div>
      </div>
      <JobAnalyzerForm resumes={resumes ?? []} />
    </div>
  );
}

