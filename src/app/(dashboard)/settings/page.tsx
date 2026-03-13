/**
 * Settings Page — Server Component
 *
 * Account settings: change password, delete account, theme preferences.
 * Route: /(dashboard)/settings
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/forms/settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-sm border border-granite bg-gradient-to-br from-shadow/10 via-transparent to-midnight/10 p-6">
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-shadow/5 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-1 rounded-full bg-leaf" />
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          </div>
          <p className="text-text-secondary">
            Manage your account preferences and security.
          </p>
        </div>
      </div>
      <SettingsForm
        userEmail={user.email ?? ""}
        userId={user.id}
        provider={user.app_metadata?.provider ?? "email"}
      />
    </div>
  );
}

