/**
 * Cover Letter Page
 *
 * Generate AI-powered cover letters based on resume and job description.
 * Route: /(dashboard)/cover-letter
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { CoverLetterGenerator } from "@/components/cover-letter/cover-letter-generator";

export const dynamic = "force-dynamic";

export default async function CoverLetterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user's resumes for selection
  const admin = createAdminClient();
  const { data: resumes } = await admin
    .from("resumes")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Cover Letter Generator"
        description="Create personalized cover letters powered by AI. Select a resume and paste the job description."
      />
      <CoverLetterGenerator resumes={resumes || []} />
    </div>
  );
}

