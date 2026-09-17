"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";

/** Root-level control: available even without the dashboard or admin shell. */
export function SessionLogout() {
  const { user, signOut } = useUser();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  if (!user) return null;

  async function handleLogout() {
    if (pending) return;
    setPending(true);
    try {
      await signOut();
      // A full navigation also discards cached authenticated page content.
      window.location.replace(pathname.startsWith("/admin") ? "/admin/login" : "/login");
    } catch {
      toast.error("Could not log out. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="fixed right-4 z-[60] bottom-[calc(1rem+env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={handleLogout}
        disabled={pending}
        aria-label={pending ? "Logging out" : "Log out"}
        aria-busy={pending}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-lg transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <LogOut aria-hidden="true" className="h-4 w-4" />}
        {pending ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
}
