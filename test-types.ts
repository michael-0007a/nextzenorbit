/**
 * Type verification file.
 * Run: npx tsc --noEmit
 * If this file has no errors, Supabase types are working correctly.
 */
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./src/types/database";

// Type verification - ensure these compile without errors
export async function verifyTypes() {
  const client = null as unknown as SupabaseClient<Database>;

  // Insert
  await client.from("users").insert({ id: "x", email: "x" });

  // Select
  const { data: _profile } = await client.from("profiles").select("*").eq("user_id", "x").single();
  void _profile;

  // Update
  await client.from("subscriptions").update({ status: "active" }).eq("user_id", "x");
}
