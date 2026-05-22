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
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/80 p-6">
        <div className="absolute inset-0 bg-space opacity-45" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-1 rounded-full bg-primary" />
            <h1 className="font-display text-2xl font-semibold text-foreground">Settings</h1>
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

