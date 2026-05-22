import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-space opacity-80" />
      <div className="absolute inset-0 auth-aurora" />
      <div className="pointer-events-none absolute inset-0 auth-grid" />

      <div className="pointer-events-none absolute -top-32 left-1/2 h-[380px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,0,61,0.35),transparent_65%)] blur-3xl opacity-70 animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-40 right-[-12%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(0,209,255,0.28),transparent_65%)] blur-3xl opacity-60 animate-float-fast" />

      <div className="pointer-events-none absolute left-1/2 top-28 h-[420px] w-[420px] -translate-x-1/2">
        <div className="orbit-ring inset-0" />
        <div className="orbit-ring orbit-ring--secondary inset-10" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <nav className="sticky top-0 z-40 border-b border-border/60 bg-surface/45 backdrop-blur-[28px]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/Nextzen%20Orbit%20white.png"
                alt="NEXTZEN ORBIT"
                width={170}
                height={26}
                className="h-5 w-auto"
              />
            </Link>

            <div className="hidden items-center gap-8 text-sm text-text-secondary lg:flex">
              <Link href="/#features" className="transition-colors hover:text-foreground">Features</Link>
              <Link href="/#platform" className="transition-colors hover:text-foreground">AI Platform</Link>
              <Link href="/#analytics" className="transition-colors hover:text-foreground">Analytics</Link>
              <Link href="/#integrations" className="transition-colors hover:text-foreground">Integrations</Link>
              <Link href="/#pricing" className="transition-colors hover:text-foreground">Pricing</Link>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle className="hidden sm:inline-flex" />
              <Link
                href="/login"
                className="hidden text-sm font-medium text-text-secondary transition-colors hover:text-foreground sm:inline-flex"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-light px-5 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(255,0,61,0.35)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </nav>

        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-md space-y-8">
            <div className={cn("glass-card rounded-3xl p-8", "space-y-6")}>
              {children}
            </div>
          </div>
        </main>

        <footer className="border-t border-border bg-surface/45 backdrop-blur-[28px]">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/20">
                <Image src="/only%20logo.png" alt="NEXTZEN ORBIT" width={22} height={22} />
              </div>
              <div>
                <Image
                  src="/Nextzen%20Orbit%20white.png"
                  alt="NEXTZEN ORBIT"
                  width={160}
                  height={24}
                  className="h-4 w-auto"
                />
                <p className="text-xs text-text-secondary">Build Beyond Limits.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-text-secondary">
              <Link href="/#features" className="transition-colors hover:text-foreground">Features</Link>
              <Link href="/#platform" className="transition-colors hover:text-foreground">AI Platform</Link>
              <Link href="/#analytics" className="transition-colors hover:text-foreground">Analytics</Link>
              <Link href="/#pricing" className="transition-colors hover:text-foreground">Pricing</Link>
              <Link href="/#security" className="transition-colors hover:text-foreground">Security</Link>
            </div>

            <p className="text-xs text-text-secondary">
              {new Date().getFullYear()} NEXTZEN ORBIT. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

