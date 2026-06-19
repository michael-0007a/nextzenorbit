"use client";

import { SettingsForm } from "@/components/forms/settings-form";
import { useUser } from "@/hooks/use-user";
import { Shield } from "lucide-react";

export default function AdminSettingsPage() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/80 p-6">
        <div className="absolute inset-0 bg-space opacity-45" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-secondary/10 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-white/5 border border-border/60">
              <Shield className="h-4 w-4 text-secondary-light" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground">Admin Settings</h1>
          </div>
          <p className="text-text-secondary">
            Manage your admin account credentials.
          </p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border-secondary/20">
        <div className="mb-6 pb-6 border-b border-border/60">
          <h2 className="text-lg font-semibold text-foreground mb-1">Account Info</h2>
          <div className="text-sm text-text-secondary">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> <span className="uppercase">{user.app_metadata?.provider === "email" ? "Admin Auth" : "SSO"}</span></p>
          </div>
        </div>
        
        {/* Reuse the existing settings form, which includes password change logic */}
        <SettingsForm
          userEmail={user.email ?? ""}
          userId={user.id}
          provider={user.app_metadata?.provider ?? "email"}
        />
      </div>
    </div>
  );
}
