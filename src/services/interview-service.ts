import { createClient } from "@/lib/supabase/server";
import type { Result } from "@/types/api";
import type { InterviewQuestionRow } from "@/types/database";

export type InterviewFilters = {
  careerId?: string;
  role?: string;
  company?: string;
  difficulty?: string;
  topic?: string;
  limit?: number;
};

export async function listInterviewQuestions(
  filters: InterviewFilters
): Promise<Result<InterviewQuestionRow[]>> {
  const supabase = await createClient();
  const limit = Math.max(1, Math.min(filters.limit ?? 50, 200));

  let query = supabase
    .from("interview_questions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.careerId) {
    query = query.eq("career_id", filters.careerId);
  }

  if (filters.role) {
    query = query.eq("role", filters.role);
  }

  if (filters.company) {
    query = query.eq("company", filters.company);
  }

  if (filters.difficulty) {
    query = query.eq("difficulty", filters.difficulty);
  }

  if (filters.topic) {
    query = query.eq("topic", filters.topic);
  }

  const { data, error } = await query;

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  return { ok: true, data: data as any || [] };
}
