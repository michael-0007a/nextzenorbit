import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/layout/page-header";
import { LinkedinOptimizer } from "@/components/linkedin/linkedin-optimizer";

export const dynamic = "force-dynamic";

export default async function LinkedinPage() {
  const { user } = await getCachedUser();
  if (!user) redirect("/login");
  const { data: resumes } = await createAdminClient().from("resumes").select("id, title")
    .eq("user_id", user.id).is("deleted_at", null).order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="LinkedIn Optimizer" description="Turn your resume into a recruiter-ready LinkedIn headline, About section and skills." />
      <LinkedinOptimizer resumes={resumes ?? []} />
    </div>
  );
}
