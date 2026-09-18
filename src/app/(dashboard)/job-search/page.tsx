/**
 * Job Search Page — Server Component
 *
 * Search for jobs using Adzuna API, add to auto-apply queue.
 * Route: /(dashboard)/job-search
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { JobSearchClient } from "@/components/dashboard/job-search-client";
import { resumeSkills } from "@/lib/jobs/match";
import type { ProfileRow, JobQueueRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function JobSearchPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const admin = createAdminClient();

    // Fetch profile, resumes, and queue in parallel
    const [profileResult, resumesResult, queueResult, generatedResult] = await Promise.all([
        admin.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        admin
            .from("resumes")
            .select("id, title, updated_at, content")
            .eq("user_id", user.id)
            .is("deleted_at", null)
            .order("updated_at", { ascending: false }),
        admin
            .from("job_queue")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(100),
        admin.from("admin_resumes").select("id,title,created_at").eq("user_id",user.id).gt("expires_at",new Date().toISOString()),
    ]);

    const profile = profileResult.data as ProfileRow | null;
    const resumes = (resumesResult.data || []).map(({id, title, updated_at}) => ({id, title, updated_at}));
    const queuedJobs = (queueResult.data || []) as JobQueueRow[];

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <PageHeader
                title="Job Search"
                description="Find your next opportunity. Search jobs and add them to your auto-apply queue."
            />
            <JobSearchClient
                defaultRole={profile?.preferred_role || ""}
                defaultLocation={profile?.preferred_location || ""}
                defaultCountry={String(profile?.application_details?.target_country || "us")}
                workType={profile?.preferred_work_type || "any"}
                skills={resumeSkills(resumesResult.data?.[0]?.content)}
                resumes={[...resumes,...(generatedResult.data || []).map(item=>({...item,updated_at:item.created_at,kind:"generated" as const}))]}
                queuedJobs={queuedJobs}
            />
        </div>
    );
}


