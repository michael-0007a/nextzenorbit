"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Search, LogOut, User, Settings, CreditCard, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signOut } from "@/app/(auth)/actions";

export interface TopNavProps {
  /** User display name */
  userName?: string;
  /** User avatar URL */
  userAvatar?: string;
  /** Optional breadcrumb or page title */
  breadcrumb?: React.ReactNode;
  className?: string;
}

/**
 * Top navigation bar — sticky, with search, notifications, theme toggle, user avatar dropdown.
 */
export function TopNav({
  userName = "User",
  userAvatar,
  breadcrumb,
  className,
}: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  // Close menu on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between gap-4",
        "border-b border-border bg-card/80 backdrop-blur-xl px-6",
        className
      )}
    >
      {/* Left: Breadcrumb / title area */}
      <div className="flex items-center gap-3 min-w-0">
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="text-sm text-text-secondary truncate">
            {breadcrumb}
          </nav>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button
          className={cn(
            "hidden sm:inline-flex h-10 items-center gap-2 rounded-xl",
            "border border-border bg-muted/50 px-4 text-sm text-stone",
            "hover:text-foreground hover:border-border-hover hover:bg-muted transition-all duration-200",
            "w-48 lg:w-64"
          )}
          aria-label="Search"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search...</span>
          <kbd className="ml-auto hidden items-center gap-0.5 rounded-md bg-background px-2 py-1 text-[10px] font-medium text-stone border border-border lg:inline-flex">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/50 text-stone hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          {/* Notification dot */}
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="User menu"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <Avatar src={userAvatar} name={userName} size="lg" className="h-11 w-11" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden">
              {/* User info header */}
              <div className="border-b border-border px-4 py-3 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5">
                <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                <p className="text-xs text-stone mt-0.5">Manage your account</p>
              </div>

              {/* Menu items */}
              <div className="py-2">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-foreground hover:bg-muted transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                  Profile
                </Link>
                <Link
                  href="/subscription"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-foreground hover:bg-muted transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  Subscription
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-foreground hover:bg-muted transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Settings className="h-4 w-4" />
                  </div>
                  Settings
                </Link>
              </div>

              {/* Sign out */}
              <div className="border-t border-border py-2">
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-error/10">
                      <LogOut className="h-4 w-4" />
                    </div>
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
