/**
 * Resume Editor Page — Server Component
 *
 * Fetches a single resume and renders the full editor with preview.
 * Route: /(dashboard)/resumes/[id]
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { ResumeEditorWithPreview } from "@/components/forms/resume-editor-with-preview";
import type { ResumeRow, SubscriptionRow } from "@/types/database";

export const dynamic = "force-dynamic";

interface ResumeEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResumeEditorPage({
  params,
}: ResumeEditorPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch resume and subscription in parallel
  const [resumeRes, subRes] = await Promise.all([
    admin
      .from("resumes")
      .select("id, user_id, title, content, template_id, is_base, version, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("subscriptions")
      .select("plan_id, status")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (resumeRes.error) {
    console.error("Resume page - Query error:", resumeRes.error.message);
  }

  const resume = resumeRes.data as ResumeRow | null;
  if (!resume) notFound();

  const subscription = subRes.data as SubscriptionRow | null;
  const isPro = subscription?.plan_id === "pro" || subscription?.plan_id === "elite";

  return (
    <ResumeEditorWithPreview resume={resume} isPro={isPro} />
  );
}



