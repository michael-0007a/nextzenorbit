/**
 * Profile Completion Banner
 *
 * Shown at the top of the profile page when the user has been
 * redirected here because their profile is incomplete.
 */

"use client";

import { AlertTriangle } from "lucide-react";

export function ProfileCompletionBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-warning/30 bg-warning/5 p-4">
      <div className="absolute inset-0 bg-gradient-to-r from-warning/10 via-transparent to-transparent" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Complete Your Profile to Continue
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Please fill in all required fields below (marked with{" "}
            <span className="text-error font-semibold">*</span>) before you can
            access the rest of the dashboard. This helps your admin team
            identify you and manage your job applications.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {["Full Name", "Preferred Role", "Location", "Phone", "Headline"].map(
              (field) => (
                <span
                  key={field}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-warning/10 text-warning border border-warning/20"
                >
                  {field}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
