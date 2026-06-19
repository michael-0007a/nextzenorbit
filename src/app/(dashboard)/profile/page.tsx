/**
 * Profile Page — Server Component
 *
 * Fetches user profile and renders the profile edit form.
 * Route: /(dashboard)/profile
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/forms/profile-form";
import type { ProfileRow } from "@/types/database";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Use admin client to bypass RLS (avoids infinite recursion in users table policy)
  const admin = createAdminClient();

  // Ensure user exists in public.users table (required for FK constraint on profiles)
  const { data: existingUser } = await admin
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingUser) {
    await admin.from("users").insert({
      id: user.id,
      email: user.email!,
      role: "user",
    });
  }

  let { data: profileData } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // If profile doesn't exist, create one
  if (!profileData) {
    const googleName = user.user_metadata?.full_name || user.user_metadata?.name || "";
    const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

    const { data: newProfile } = await admin
      .from("profiles")
      .insert({
        user_id: user.id,
        full_name: googleName || user.email?.split("@")[0] || "",
        avatar_url: googleAvatar,
      })
      .select()
      .single();

    profileData = newProfile;
  }

  const profile = profileData as ProfileRow | null;

  // If still no profile, show a basic form with defaults
  if (!profile) {
    const defaultProfile: ProfileRow = {
      id: "",
      user_id: user.id,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "",
      phone: null,
      headline: null,
      location: null,
      linkedin_url: null,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      preferred_role: null,
      preferred_location: null,
      preferred_salary_min: null,
      preferred_salary_max: null,
      preferred_work_type: null,
      years_of_experience: null,
      preferred_portals: [],
      has_agreed_to_terms: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return (
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/80 p-6">
          <div className="absolute inset-0 bg-space opacity-45" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-1 rounded-full bg-primary" />
              <h1 className="font-display text-2xl font-semibold text-foreground">Profile</h1>
            </div>
            <p className="text-text-secondary">
              Manage your personal information. This data can pre-fill your resumes.
            </p>
          </div>
        </div>
        <ProfileForm profile={defaultProfile} userEmail={user.email ?? ""} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/80 p-6">
        <div className="absolute inset-0 bg-space opacity-45" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-1 rounded-full bg-primary" />
            <h1 className="font-display text-2xl font-semibold text-foreground">Profile</h1>
          </div>
          <p className="text-text-secondary">
            Manage your personal information. This data can pre-fill your resumes.
          </p>
        </div>
      </div>
      <ProfileForm profile={profile} userEmail={user.email ?? ""} />
    </div>
  );
}


