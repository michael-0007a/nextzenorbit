/**
 * Supabase Admin Client (Service Role)
 *
 * DANGER: Bypasses all RLS policies.
 * ONLY use in:
 * - Webhook handlers (payment events)
 * - Admin operations
 * - Background jobs
 *
 * NEVER import this from client-side code.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

