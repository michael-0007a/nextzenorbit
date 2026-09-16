/**
 * Admin Auth Server Actions
 *
 * Email/password sign-in and sign-out for admin users.
 * Admins are created by super_admins via the admin panel.
 */

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Sign in with email + password (admin/super_admin accounts).
 */
export async function signInWithEmail(email: string, password: string) {
  if (typeof email !== "string" || typeof password !== "string" || email.length > 254 || password.length > 1024) return { error: "Invalid credentials." };
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
  const limited = await rateLimit("admin-login-ip", ip, 30, 900)
    || await rateLimit("admin-login-email", email.trim().toLowerCase(), 10, 900);
  if (limited) return { error: "Sign-in is temporarily unavailable. Please try again later." };
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Authentication failed." };
  }

  // Check if user has admin role
  const admin = createAdminClient();
  const { data: userRow } = await admin
    .from("users")
    .select("role, is_suspended")
    .eq("id", data.user.id)
    .single();

  if (!userRow || userRow.is_suspended || !["admin", "supervisor_admin", "super_admin"].includes(userRow.role)) {
    // Sign them out — they're not an admin
    await supabase.auth.signOut();
    return { error: "You don't have admin access. Please contact your administrator." };
  }

  redirect("/admin");
}

/**
 * Sign out admin user.
 */
export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
