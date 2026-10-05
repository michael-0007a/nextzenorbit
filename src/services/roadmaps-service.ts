import { createReferenceClient } from "@/lib/supabase/reference";
import type { Result } from "@/types/api";
import type { RoadmapRow, RoadmapStepRow } from "@/types/database";

export type RoadmapWithSteps = {
  roadmap: RoadmapRow;
  steps: RoadmapStepRow[];
};

export async function listRoadmaps(filters: {
  careerId?: string;
  role?: string;
}): Promise<Result<RoadmapRow[]>> {
  const supabase = await createReferenceClient();
  let query = supabase.from("roadmaps").select("*").order("title", { ascending: true });

  if (filters.careerId) {
    query = query.eq("career_id", filters.careerId);
  }

  if (filters.role) {
    query = query.eq("role", filters.role);
  }

  const { data, error } = await query;

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  return { ok: true, data: data as any || [] };
}

export async function getRoadmapWithSteps(id: string): Promise<Result<RoadmapWithSteps>> {
  const supabase = await createReferenceClient();
  const [roadmapResult,stepsResult]=await Promise.all([supabase
    .from("roadmaps")
    .select("*")
    .eq("id", id)
    .maybeSingle(),supabase.from('roadmap_steps').select('*').eq('roadmap_id',id).order('order_index',{ascending:true})]);
  const {data:roadmap,error}=roadmapResult;
  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  if (!roadmap) {
    return { ok: false, error: new Error("NOT_FOUND") };
  }

  const {data:steps,error:stepsError}=stepsResult;
  if (stepsError) {
    return { ok: false, error: new Error(stepsError.message) };
  }

  return { ok: true, data: { roadmap, steps: steps as any || [] } };
}
