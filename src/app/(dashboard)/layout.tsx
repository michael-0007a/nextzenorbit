import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Use admin client to bypass RLS issues
  const admin = createAdminClient();

  // Fetch profile for display name and avatar
  const { data: profileData } = await admin
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = profileData as { full_name: string | null; avatar_url: string | null } | null;

  // Always prefer profile name (user-edited) over Google metadata
  const userName = profile?.full_name
    || user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email?.split("@")[0]
    || "User";

  const userAvatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav
          userName={userName}
          userAvatar={userAvatar}
          breadcrumb={<span>Dashboard</span>}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

