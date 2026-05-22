"use client";

/**
 * Settings Form — Client Component
 *
 * Handles password change, account info display, and sign-out.
 */

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { signOut } from "@/app/(auth)/actions";
import { LogOut, Shield, Mail, Key, Trash2, AlertTriangle } from "lucide-react";
import type { Database } from "@/types/database";

interface SettingsFormProps {
  userEmail: string;
  userId: string;
  provider: string;
}

export function SettingsForm({ userEmail, userId, provider }: SettingsFormProps) {
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated successfully");
        setChangingPassword(false);
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-light to-accent" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            Account
          </CardTitle>
          <CardDescription>Your account information and login method.</CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-sm text-text-secondary">{userEmail}</p>
            </div>
            <Badge variant={provider === "google" ? "primary" : "default"} className={provider === "google" ? "bg-primary/10 text-primary border-primary/20" : ""}>
              {provider === "google" ? "Google" : "Email"}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">User ID</p>
              <p className="text-xs text-text-secondary font-mono truncate max-w-[200px]">{userId}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Password */}
      {provider === "email" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/10">
                <Key className="h-4 w-4 text-secondary" />
              </div>
              Password
            </CardTitle>
            <CardDescription>Change your account password.</CardDescription>
          </CardHeader>
          <CardBody>
            {!changingPassword ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setChangingPassword(true)}
              >
                Change Password
              </Button>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-10 rounded-2xl border border-border bg-white/5 px-3 text-sm text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-10 rounded-2xl border border-border bg-white/5 px-3 text-sm text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
                    placeholder="Repeat password"
                    required
                    minLength={8}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button type="submit" size="sm" isLoading={saving}>
                    Update Password
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setChangingPassword(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      )}

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            Session
          </CardTitle>
          <CardDescription>Manage your active session.</CardDescription>
        </CardHeader>
        <CardBody>
          <form action={handleSignOut}>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              leftIcon={<LogOut className="h-4 w-4" />}
              className="hover:border-primary/40 hover:text-primary"
            >
              Sign Out
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Danger Zone */}
      <Card className="border-error/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-error">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions. Proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardBody>
          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-error">
                This will permanently delete your account and all data. This action cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    toast.info("Account deletion requires contacting support.");
                    setShowDeleteConfirm(false);
                  }}
                >
                  Yes, Delete My Account
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}




