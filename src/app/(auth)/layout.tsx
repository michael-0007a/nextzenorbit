import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

/**
 * Auth layout — centered card, no sidebar.
 * Used by /login, /register, /verify pages.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-midnight dark:bg-mint">
            <Sparkles className="h-5 w-5 text-white dark:text-midnight" />
          </div>
          <span className="text-xl font-bold text-foreground">
            Nextzen Orbit
          </span>
        </div>

        {/* Auth card */}
        <div
          className={cn(
            "rounded-sm border border-granite bg-surface-elevated p-8",
            "space-y-6"
          )}
        >
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-granite">
          &copy; {new Date().getFullYear()} Nextzen Orbit. Built for the Indian
          job market.
        </p>
      </div>
    </div>
  );
}

