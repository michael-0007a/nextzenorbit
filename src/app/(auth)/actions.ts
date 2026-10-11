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
import { rateLimit } from "@/lib/rate-limit";

// ── Sign In with Google OAuth ──
export async function signInWithGoogle() {
  const supabase = await createClient();

  // Dynamically build the redirect URL to match the exact host header (handling www/non-www mismatch).
  const headersList = await headers();
  // Use only the trusted deployment proxy's client IP header.
  const ip = headersList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || headersList.get("x-real-ip") || "unknown";
  const limited = await rateLimit("oauth-start", ip, 20, 900);
  if (limited) return { error: limited.status === 429 ? "Too many sign-in attempts. Please try again later." : "Sign-in temporarily unavailable. Please try again." };
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

// ── Sign In with email + password (accounts created by staff or for testing) ──
export async function signInWithEmail(email: string, password: string) {
  if (typeof email !== "string" || typeof password !== "string" || email.length > 254 || password.length > 1024) return { error: "Invalid credentials." };
  const headersList = await headers();
  const ip = headersList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || headersList.get("x-real-ip") || "unknown";
  const limited = await rateLimit("login-ip", ip, 30, 900)
    || await rateLimit("login-email", email.trim().toLowerCase(), 10, 900);
  if (limited) return { error: "Too many sign-in attempts. Please try again later." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? { error: "Invalid email or password." } : {};
}

// ── Sign Out ──
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
