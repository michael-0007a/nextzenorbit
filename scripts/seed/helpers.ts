import crypto from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables;

const DEFAULT_CHUNK_SIZE = 250;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function createSeedClient(): SupabaseClient<Database> {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function seedId(namespace: string, value: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(`${namespace}:${value}`)
    .digest("hex");

  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export function chunk<T>(items: T[], size = DEFAULT_CHUNK_SIZE): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export async function upsertRows<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  rows: Tables[T]["Insert"][],
  options?: { onConflict?: string }
): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  for (const batch of chunk(rows)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client.from(table) as any).upsert(batch, options);
    if (error) {
      throw new Error(`Upsert failed for ${String(table)}: ${error.message}`);
    }
  }
}

export async function insertRows<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  rows: Tables[T]["Insert"][]
): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  for (const batch of chunk(rows)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client.from(table) as any).insert(batch);
    if (error) {
      throw new Error(`Insert failed for ${String(table)}: ${error.message}`);
    }
  }
}

export function logSection(title: string): void {
  console.log(`\n== ${title} ==`);
}
