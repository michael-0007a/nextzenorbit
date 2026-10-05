import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient, getCachedUser } from "@/lib/supabase/server";
import { getRequestAccess } from "@/lib/request-access";
import type { Database } from "@/types/database";

/** Only use for shared catalog tables. Authorization is checked BEFORE the cache.
 * Personal notes/projects/profiles must always use their original scoped client. */
export async function createReferenceClient() {
  const { user } = await getCachedUser();
  if (!user) return createClient();
  const access = await getRequestAccess(user.id, user.email ?? "");
  if (access.application !== "approved" || !access.service) return createClient();
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      if (init?.method && init.method !== "GET") throw new Error("Reference client is read-only.");
      return fetch(input, { ...init, next: { revalidate: 300, tags: ["career-reference"] } });
    } },
  });
}
