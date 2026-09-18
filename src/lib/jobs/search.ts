import { createAdminClient } from "@/lib/supabase/admin";
import { searchAdzunaJobs, type AdzunaJob, type AdzunaSearchParams } from "./adzuna";

export async function searchJobs(params: AdzunaSearchParams) {
  const result = await searchAdzunaJobs(params);
  if (!result.jobs.length) return { ...result, searchedAt: new Date().toISOString() };
  const { data, error } = await createAdminClient().rpc("store_job_results", { p_jobs: result.jobs });
  return { ...result, jobs: error ? result.jobs : data as AdzunaJob[], searchedAt: new Date().toISOString(),
    warning: error ? "Results loaded, but the job catalog could not be updated. Refresh the search before queuing." : undefined };
}
