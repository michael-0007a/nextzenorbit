/**
 * OAuth Callback Route
 *
 * Handles the redirect from Supabase OAuth (Google).
 * Exchanges the auth code for a session, then redirects to /dashboard.
 * For new users: creates users, profiles, subscriptions rows.
 * For returning users: always syncs name/avatar from Google.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApplicationAccess } from "@/lib/onboarding";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/dashboard";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.includes("\\") ? requestedNext : "/dashboard";

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

    // Insert user
    const { error: userError } = await admin.from("users").insert({
      id: user.id,
      email: user.email!,
      role: "user",
    });
    if (userError) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=registration_unavailable`);
    }

    // Insert profile with Google name + avatar
    await admin.from("profiles").insert({
      user_id: user.id,
      full_name: googleName || user.email?.split("@")[0] || "",
      avatar_url: googleAvatar,
      has_agreed_to_terms: false,
    });

    // Subscription creation is deferred until the application is approved.
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

  const access = await getApplicationAccess(user);
  return NextResponse.redirect(`${origin}${access === "approved" ? next : "/onboarding"}`);
}
