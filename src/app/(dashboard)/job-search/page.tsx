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
    const [profileResult, resumesResult, queueResult] = await Promise.all([
        admin.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        admin
            .from("resumes")
            .select("id, title, updated_at")
            .eq("user_id", user.id)
            .is("deleted_at", null)
            .order("updated_at", { ascending: false }),
        admin
            .from("job_queue")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(100),
    ]);

    const profile = profileResult.data as ProfileRow | null;
    const resumes = (resumesResult.data || []) as { id: string; title: string; updated_at: string }[];
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
                resumes={resumes}
                queuedJobs={queuedJobs}
            />
        </div>
    );
}


