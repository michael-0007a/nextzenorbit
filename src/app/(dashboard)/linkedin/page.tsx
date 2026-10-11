import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Linkedin } from "lucide-react";
import { FeatureHero } from "@/components/layout/feature-hero";
import { LinkedinOptimizer } from "@/components/linkedin/linkedin-optimizer";

export const dynamic = "force-dynamic";

export default async function LinkedinPage() {
  const { user } = await getCachedUser();
  if (!user) redirect("/login");
  const { data: resumes } = await createAdminClient().from("resumes").select("id, title")
    .eq("user_id", user.id).is("deleted_at", null).order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FeatureHero icon={Linkedin} title="LinkedIn Optimizer" description="Turn your resume into a recruiter-ready LinkedIn headline, About section, skills and experience bullets." ai />
      <LinkedinOptimizer resumes={resumes ?? []} />
    </div>
  );
}
