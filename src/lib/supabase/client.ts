/**
 * Supabase Browser Client
 *
 * For use in Client Components only.
 * Scoped by RLS — only returns data the current user has access to.
 * DO NOT use for mutations that require service-role privileges.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { sessionCookieOptions } from "@/lib/hosts";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: sessionCookieOptions(typeof window === "undefined" ? null : window.location.host) }
  );
}

