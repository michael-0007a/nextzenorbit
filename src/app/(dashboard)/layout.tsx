import { getCachedUser, getCachedProfile } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { GlobalPaywall } from "@/components/subscription/global-paywall";

// Force dynamic rendering to always fetch fresh profile data
export const dynamic = "force-dynamic";

/**
 * Required profile fields for the profile completion gate.
 * Users cannot access any dashboard page (except /profile) until these are filled.
 */
const REQUIRED_PROFILE_FIELDS = [
  "full_name",
  "preferred_role",
  "location",
  "phone",
  "headline",
] as const;

function isProfileComplete(profile: Record<string, unknown> | null): boolean {
  if (!profile) return false;
  return REQUIRED_PROFILE_FIELDS.every((field) => {
    const val = profile[field];
    return typeof val === "string" && val.trim().length > 0;
  });
}

/**
 * Dashboard Layout
 *
 * Sidebar + TopNav shell for all authenticated pages.
 * Fetches user + profile server-side for TopNav display.
 * Enforces profile completion before granting access.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getCachedUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCachedProfile(user.id);

  if (profile && profile.has_agreed_to_terms === false) {
    redirect("/onboarding/terms");
  }

  // ── Profile Completion Gate ──
  // Block all dashboard routes (except /profile itself) until profile is complete
  const headersList = await headers();
  const pathname = headersList.get("x-next-pathname") || headersList.get("x-invoke-path") || "";
  const isProfilePage = pathname.includes("/profile");

  console.log("[DashboardLayout] pathname:", pathname);
  console.log("[DashboardLayout] x-next-pathname:", headersList.get("x-next-pathname"));
  console.log("[DashboardLayout] x-invoke-path:", headersList.get("x-invoke-path"));
  console.log("[DashboardLayout] isProfilePage:", isProfilePage);
  console.log("[DashboardLayout] isProfileComplete:", isProfileComplete(profile as Record<string, unknown> | null));

  const profileComplete = isProfileComplete(profile as Record<string, unknown> | null);

  if (!profileComplete && !isProfilePage) {
    redirect("/profile?complete=required");
  }

  // Always prefer profile name (user-edited) over Google metadata
  const userName = profile?.full_name
    || user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email?.split("@")[0]
    || "User";

  const userAvatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined;

  const supabase = await createClient();
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return (
    <div className="relative flex h-screen overflow-hidden bg-background text-foreground">
      <GlobalPaywall isSsoUser={userData?.role === "sso_user"} />
      <div className="absolute inset-0 bg-space" />
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_60%)]" />
      <Sidebar isProfileComplete={profileComplete} />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <TopNav
          userName={userName}
          userAvatar={userAvatar}
          breadcrumb={<span>Dashboard</span>}
          isProfileComplete={profileComplete}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
