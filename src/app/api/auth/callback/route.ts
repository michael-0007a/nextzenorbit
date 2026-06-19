/**
 * OAuth Callback Route
 *
 * Handles the redirect from Supabase OAuth (Google).
 * Exchanges the auth code for a session, then redirects to /dashboard.
 * For new users: creates users, profiles, subscriptions rows.
 * For returning users: always syncs name/avatar from Google.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("OAuth callback error:", error?.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const user = data.user;

  // Extract name and avatar from Google OAuth metadata
  const googleName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.given_name ||
    "";
  const googleAvatar =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  // Use admin client to bypass RLS (avoids infinite recursion)
  const admin = createAdminClient();

  // Check if user row already exists (returning user)
  const { data: existingUser } = await admin
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingUser) {
    // New Google user — create rows
    const now = new Date().toISOString();
    const trialEnd = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const cookieStore = await cookies();
    const hasAgreedToTerms = cookieStore.get("accepted_terms")?.value === "true";

    // Insert user
    await admin.from("users").insert({
      id: user.id,
      email: user.email!,
      role: "user",
    });

    // Insert profile with Google name + avatar
    await admin.from("profiles").insert({
      user_id: user.id,
      full_name: googleName || user.email?.split("@")[0] || "",
      avatar_url: googleAvatar,
      has_agreed_to_terms: hasAgreedToTerms,
    });

    // Insert subscription with 7-day trial
    await admin.from("subscriptions").insert({
      user_id: user.id,
      provider: "razorpay",
      plan_id: "free",
      status: "trialing",
      trial_starts_at: now,
      trial_ends_at: trialEnd,
      currency: "INR",
    });
  } else {
    // Returning user — always sync name & avatar from Google
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      const updates: Record<string, string> = {};

      // Update name if Google provides one and current name looks like email prefix
      const currentName = profile.full_name || "";
      const looksLikeEmailPrefix = !currentName ||
        (currentName.match(/^[a-z0-9]+$/i) && currentName.length < 25);

      if (looksLikeEmailPrefix && googleName) {
        updates.full_name = googleName;
      }

      // Update avatar if missing or if Google has one
      if (!profile.avatar_url && googleAvatar) {
        updates.avatar_url = googleAvatar;
      }

      if (Object.keys(updates).length > 0) {
        await admin
          .from("profiles")
          .update(updates)
          .eq("user_id", user.id);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
