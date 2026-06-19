/**
 * Supabase Server Client
 *
 * For use in Server Components, Server Actions, and Route Handlers.
 * Uses cookies from next/headers for session management.
 * Scoped by RLS — user-context operations.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `setAll` is called from Server Components where cookies
            // cannot be set. This is safe to ignore when the middleware
            // is refreshing the session.
          }
        },
      },
    }
  );
}

export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
});

export const getCachedProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return profile;
});

