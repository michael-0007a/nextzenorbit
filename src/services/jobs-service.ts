import { createClient } from "@/lib/supabase/server";
import type { Result } from "@/types/api";
import type { JobRow } from "@/types/database";

export type JobListFilters = {
  query?: string;
  location?: string;
  source?: string;
  tag?: string;
  limit?: number;
  offset?: number;
};

export async function listJobs(filters: JobListFilters): Promise<Result<JobRow[]>> {
  const supabase = await createClient();
  const limit = Math.max(1, Math.min(filters.limit ?? 20, 100));
  const offset = Math.max(0, filters.offset ?? 0);

  let query = supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.query) {
    const term = `%${filters.query}%`;
    query = query.or(`title.ilike.${term},company.ilike.${term}`);
  }

  if (filters.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  if (filters.source) {
    query = query.eq("source", filters.source);
  }

  if (filters.tag) {
    query = query.contains("tags", [filters.tag]);
  }

  const { data, error } = await query;

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  return { ok: true, data: data as any || [] };
}
