/**
 * Supabase Middleware Helper
 *
 * Refreshes the auth session on every request by reading/writing cookies.
 * Used by the root middleware.ts.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieOptions } from "@/lib/hosts";

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  // Discard inbound authorization summaries. Only our middleware may create one.
  requestHeaders.delete("x-orbit-access");
  requestHeaders.set("x-next-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: sessionCookieOptions(request.nextUrl.host),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — IMPORTANT: do not remove
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabaseResponse };
}

