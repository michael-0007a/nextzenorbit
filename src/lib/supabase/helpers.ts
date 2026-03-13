/**
 * Supabase Type Helpers
 *
 * Workaround for Supabase JS v2.98+ generic resolution
 * producing `never` for insert/update/delete operations
 * when using custom Database types.
 *
 * These helpers cast the client to bypass the broken generics
 * while maintaining runtime correctness.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables;

/**
 * Type-safe insert that bypasses the broken generic resolution.
 * Usage: await dbInsert(supabase, "users", { id, email, role: "user" });
 */
export async function dbInsert<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  values: Tables[T]["Insert"]
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client.from(table) as any).insert(values);
}

/**
 * Type-safe insert with select that bypasses the broken generic resolution.
 * Returns the inserted row(s).
 */
export async function dbInsertAndSelect<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  values: Tables[T]["Insert"]
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client.from(table) as any).insert(values).select().single();
}

/**
 * Type-safe update that bypasses the broken generic resolution.
 * Usage: await dbUpdate(supabase, "subscriptions", { status: "active" }).eq("user_id", id);
 */
export function dbUpdate<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  values: Tables[T]["Update"]
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client.from(table) as any).update(values);
}

