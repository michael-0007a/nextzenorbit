/**
 * Notification Banner
 *
 * Client component that fetches unread notifications for the current user
 * and displays them as persistent dismissable banners at the top of the dashboard.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Bell, FileText, UserCircle, MessageSquare } from "lucide-react";

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
};

export function NotificationBanner() {
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

  const dismissNotification = async (id: string) => {
    // Optimistically remove from UI
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

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {notifications.map((notification) => {
        const Icon = ICON_MAP[notification.type] || Bell;
        const link = LINK_MAP[notification.type];

        return (
          <div
            key={notification.id}
            className="relative overflow-hidden rounded-xl border border-secondary/30 bg-secondary/5 p-3 animate-fade-in"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 via-transparent to-transparent" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/20 text-secondary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {notification.title}
                </p>
                {notification.message && (
                  <p className="text-xs text-text-secondary mt-0.5 truncate">
                    {notification.message}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {link && (
                  <Link
                    href={link}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
                  >
                    Go →
                  </Link>
                )}
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:text-foreground hover:bg-white/10 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
