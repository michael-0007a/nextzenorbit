/**
 * Auth Server Actions
 *
 * OAuth (Google) sign-in and sign-out.
 * User/profile/subscription creation is handled in the OAuth callback route.
 */

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { headers } from "next/headers";

// ── Sign In with Google OAuth ──
export async function signInWithGoogle() {
  const supabase = await createClient();

  // Dynamically build the redirect URL to match the exact host header (handling www/non-www mismatch).
  const headersList = await headers();
  const host = headersList.get("host");
  const forwardedProto = headersList.get("x-forwarded-proto");
  
  let proto = forwardedProto || "https";
  if (host && (host.startsWith("localhost") || host.startsWith("127.0.0.1"))) {
    proto = "http";
  }

  let redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
  if (host) {
    redirectTo = `${proto}://${host}/api/auth/callback`;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

// ── Sign Out ──
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
