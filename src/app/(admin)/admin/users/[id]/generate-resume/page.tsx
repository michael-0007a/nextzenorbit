/**
 * Admin Resume Generator Page
 *
 * Route: /admin/users/[id]/generate-resume
 * Allows admin to generate a resume for a user based on their base resume
 * and a job description. The generated resume is saved as an admin_resume.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { redirect } from "next/navigation";
import { AdminResumeGeneratorClient } from "./client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminResumeGeneratorPage({ params }: Props) {
  const adminAuth = await requireAdmin();
  if (isAuthError(adminAuth)) redirect("/admin");

  const { id } = await params;
  const admin = createAdminClient();

  // Fetch user info
  const { data: user } = await admin
    .from("users")
    .select(`
      id, email,
      profile:profiles(full_name)
    `)
    .eq("id", id)
    .single();

  if (!user) redirect("/admin/users");

  // Fetch base resume
  const { data: baseResume } = await admin
    .from("resumes")
    .select("id, title, content, template_id")
    .eq("user_id", id)
    .eq("is_base", true)
    .is("deleted_at", null)
    .maybeSingle();

  // If no base resume, try to get the most recent one
  const { data: fallbackResume } = !baseResume
    ? await admin
        .from("resumes")
        .select("id, title, content, template_id")
        .eq("user_id", id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const resumeToUse = baseResume || fallbackResume;

  return (
    <AdminResumeGeneratorClient
      userId={id}
      userName={(user as any).profile?.full_name || user.email || "Unknown User"}
      userEmail={user.email || ""}
      baseResume={resumeToUse as any}
    />
  );
}
