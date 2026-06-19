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

/**
 * Sign in with email + password (admin/super_admin accounts).
 */
export async function signInWithEmail(email: string, password: string) {
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
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!userRow || (userRow.role !== "admin" && userRow.role !== "super_admin")) {
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
