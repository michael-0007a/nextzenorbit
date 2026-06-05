import { createClient } from "@/lib/supabase/server";
import type { Result } from "@/types/api";
import type { CareerRow } from "@/types/database";

export async function listCareers(search?: string): Promise<Result<CareerRow[]>> {
  const supabase = await createClient();
  let query = supabase.from("careers").select("*").order("title", { ascending: true });

  if (search) {
    const term = `%${search}%`;
    query = query.or(`title.ilike.${term},slug.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  return { ok: true, data: data as any || [] };
}

export async function getCareerBySlug(slug: string): Promise<Result<CareerRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("careers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  if (!data) {
    return { ok: false, error: new Error("NOT_FOUND") };
  }

  return { ok: true, data: data as any };
}
