/**
 * Admin Resume Generator Page
 *
 * Route: /admin/users/[id]/generate-resume
 * Allows admin to generate a resume for a user based on their base resume
 * and a job description. The generated resume is saved as an admin_resume.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { hasResumeBody, parseExportContent } from "@/lib/resume/export-content";
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
  const { data: user, error: userError } = await admin
    .from("users")
    .select(`
      id, email,
      profile:profiles!profiles_user_id_fkey(full_name)
    `)
    .eq("id", id)
    .single();

  if (userError || !user) {
    console.error("Admin resume generator user fetch error:", userError);
    redirect("/admin/users");
  }

  const { data: savedResumes, error: resumesError } = await admin.from("resumes")
    .select("id,title,content,template_id,is_base").eq("user_id", id).is("deleted_at", null)
    .order("is_base", { ascending: false }).order("updated_at", { ascending: false });
  if (resumesError) throw new Error("Unable to load client resumes.");
  const resumes = (savedResumes || []).flatMap(resume => {
    const content = parseExportContent(resume.content);
    return content.success && hasResumeBody(content.data) ? [{ ...resume, content: content.data }] : [];
  });

  const rawProfile = user.profile as unknown as
    | { full_name: string | null }
    | Array<{ full_name: string | null }>;
  const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

  return (
    <AdminResumeGeneratorClient
      userId={id}
      userName={profile?.full_name || user.email || "Unknown User"}
      userEmail={user.email || ""}
      resumes={resumes}
    />
  );
}
