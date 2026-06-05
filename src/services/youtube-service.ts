import { createClient } from "@/lib/supabase/server";
import type { Result } from "@/types/api";
import type { YoutubeResourceRow } from "@/types/database";

export type YoutubeResourceFilters = {
  careerId?: string;
  role?: string;
  topic?: string;
  difficulty?: string;
  limit?: number;
};

export async function listYoutubeResources(
  filters: YoutubeResourceFilters
): Promise<Result<YoutubeResourceRow[]>> {
  const supabase = await createClient();
  const limit = Math.max(1, Math.min(filters.limit ?? 24, 100));

  let query = supabase
    .from("youtube_resources")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.careerId) {
    query = query.eq("career_id", filters.careerId);
  }

  if (filters.role) {
    query = query.eq("role", filters.role);
  }

  if (filters.topic) {
    query = query.eq("topic", filters.topic);
  }

  if (filters.difficulty) {
    query = query.eq("difficulty", filters.difficulty);
  }

  const { data, error } = await query;

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  return { ok: true, data: data as any || [] };
}
