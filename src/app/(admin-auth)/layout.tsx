import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Admin Auth layout — centered card for admin login.
 * Used by /admin/login page.
 */
export default function AdminAuthLayout({
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
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/Nextzen%20Orbit%20white.png"
                alt="NEXTZEN ORBIT"
                width={170}
                height={26}
                className="h-5 w-auto"
              />
              <span className="rounded-full bg-secondary/20 border border-secondary/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-light">
                Admin
              </span>
            </Link>
          </div>
        </nav>

        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-md space-y-8">
            <div className={cn("glass-card rounded-3xl p-6 sm:p-8", "space-y-6")}>
              {children}
            </div>
          </div>
        </main>

        <footer className="border-t border-border bg-surface/45 backdrop-blur-[28px]">
          <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-6">
            <p className="text-xs text-text-secondary">
              {new Date().getFullYear()} NEXTZEN ORBIT — Admin Portal
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
