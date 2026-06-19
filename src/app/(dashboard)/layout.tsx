import { getCachedUser, getCachedProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";

// Force dynamic rendering to always fetch fresh profile data
export const dynamic = "force-dynamic";

/**
 * Dashboard Layout
 *
 * Sidebar + TopNav shell for all authenticated pages.
 * Fetches user + profile server-side for TopNav display.
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

  // Always prefer profile name (user-edited) over Google metadata
  const userName = profile?.full_name
    || user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email?.split("@")[0]
    || "User";

  const userAvatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined;

  return (
    <div className="relative flex h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-space" />
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_60%)]" />
      <Sidebar />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <TopNav
          userName={userName}
          userAvatar={userAvatar}
          breadcrumb={<span>Dashboard</span>}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

