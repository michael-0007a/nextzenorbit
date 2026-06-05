import type { SupabaseClient } from "@supabase/supabase-js";
import type { Result } from "@/types/api";
import type { Database } from "@/types/database";

export async function ensureUserRecord(
  admin: SupabaseClient<Database>,
  userId: string,
  email: string
): Promise<Result<true>> {
  const { data: existing, error } = await admin
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  if (existing) {
    return { ok: true, data: true };
  }

  const { error: insertError } = await admin.from("users").insert({
    id: userId,
    email,
    role: "user",
  });

  if (insertError) {
    return { ok: false, error: new Error(insertError.message) };
  }

  return { ok: true, data: true };
}
