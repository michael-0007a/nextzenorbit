"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Search, LogOut, User, Settings, CreditCard, Command, X, FileText, UserCircle, MessageSquare } from "lucide-react";
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
  isProfileComplete?: boolean;
}

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const ICON_MAP: Record<string, React.ElementType> = {
  resume_request: FileText,
  profile_update: UserCircle,
  admin_message: MessageSquare,
};

const LINK_MAP: Record<string, string> = {
  resume_request: "/resumes",
  profile_update: "/profile",
  admin_message: "/profile",
};

/**
 * Top navigation bar — sticky, with search, notifications, theme toggle, user avatar dropdown.
 */
export function TopNav({
  userName = "User",
  userAvatar,
  breadcrumb,
  className,
  isProfileComplete = true,
}: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        const json = await res.json();
        if (json.success && json.data) {
          setNotifications(json.data);
        }
      } catch {
        // Silently fail — notifications are non-critical
      }
    };
    fetchNotifications();
  }, []);

  const dismissNotification = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {
      // Silently fail
    }
  };

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    if (menuOpen || notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen, notificationsOpen]);

  // Close menus on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setNotificationsOpen(false);
      }
    }
    if (menuOpen || notificationsOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [menuOpen, notificationsOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between gap-4",
        "border-b border-border/60 bg-surface/70 backdrop-blur-2xl px-6",
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
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/5 text-text-secondary hover:text-primary hover:border-primary/50 hover:bg-white/10 transition-all duration-200"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-3xl border border-border/70 bg-surface/90 backdrop-blur-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[400px]">
              <div className="border-b border-border/60 px-4 py-3 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 flex justify-between items-center shrink-0">
                <p className="text-sm font-semibold text-foreground">Notifications</p>
                {notifications.length > 0 && (
                  <span className="text-xs text-text-secondary bg-white/10 px-2 py-0.5 rounded-full">
                    {notifications.length} new
                  </span>
                )}
              </div>
              <div className="overflow-y-auto py-2">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-text-secondary text-sm">
                    No new notifications.
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const Icon = ICON_MAP[notification.type] || Bell;
                    const link = LINK_MAP[notification.type];
                    return (
                      <div
                        key={notification.id}
                        className="relative flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary mt-0.5">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          {link ? (
                            <Link href={link} onClick={() => setNotificationsOpen(false)}>
                              <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                                {notification.title}
                              </p>
                            </Link>
                          ) : (
                            <p className="text-sm font-medium text-foreground">{notification.title}</p>
                          )}
                          {notification.message && (
                            <p className="text-xs text-text-secondary mt-0.5 leading-snug">
                              {notification.message}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => dismissNotification(notification.id, e)}
                          className="absolute right-4 top-3 h-6 w-6 flex items-center justify-center rounded-md text-text-secondary hover:text-foreground hover:bg-white/10 transition-colors"
                          aria-label="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="User menu"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <Avatar src={userAvatar} name={userName} size="lg" className="h-11 w-11" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-3xl border border-border/70 bg-surface/90 backdrop-blur-2xl shadow-xl z-50 overflow-hidden">
              {/* User info header */}
              <div className="border-b border-border/60 px-4 py-3 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10">
                <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                <p className="text-xs text-text-secondary mt-0.5">Manage your account</p>
              </div>

              {/* Menu items */}
              <div className="py-2">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                    <User className="h-4 w-4" />
                  </div>
                  Profile
                </Link>
                <Link
                  href={isProfileComplete ? "/subscription" : "/profile?complete=required"}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-foreground hover:bg-white/5 transition-colors",
                    !isProfileComplete && "opacity-50 cursor-not-allowed hover:bg-transparent"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  Subscription
                </Link>
                <Link
                  href={isProfileComplete ? "/settings" : "/profile?complete=required"}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-foreground hover:bg-white/5 transition-colors",
                    !isProfileComplete && "opacity-50 cursor-not-allowed hover:bg-transparent"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                    <Settings className="h-4 w-4" />
                  </div>
                  Settings
                </Link>
              </div>

              {/* Sign out */}
              <div className="border-t border-border/60 py-2">
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
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
