"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Search,
  Briefcase,
  User,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Zap,
  ArrowRight,
  Crown,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

// === Navigation Items ===
export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  isNew?: boolean;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/profile", icon: User },
  { label: "My Resumes", href: "/resumes", icon: FileText },
  { label: "Cover Letter", href: "/cover-letter", icon: Mail, badge: "AI", isNew: true },
  { label: "Job Analyzer", href: "/analyzer", icon: Search, badge: "AI" },
  { label: "Applications", href: "/applications", icon: Briefcase },
];

const bottomNavItems: NavItem[] = [
  { label: "Subscription", href: "/subscription", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

// === Sidebar Component ===
export interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl",
          "text-sm font-medium transition-all duration-200",
          active
            ? "text-foreground bg-primary/10 dark:bg-primary/15"
            : "text-text-secondary hover:text-foreground hover:bg-muted"
        )}
        aria-current={active ? "page" : undefined}
      >
        {/* Active glow effect */}
        {active && (
          <motion.div
            layoutId="nav-glow"
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}

        {/* Icon with background */}
        <div className={cn(
          "relative z-10 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200",
          active
            ? "bg-primary text-white shadow-md shadow-primary/25"
            : "bg-muted text-stone group-hover:bg-border group-hover:text-foreground"
        )}>
          <Icon className="h-[18px] w-[18px]" />
        </div>

        {!collapsed && (
          <span className="relative z-10 flex-1 truncate">{item.label}</span>
        )}

        {/* Badges */}
        {!collapsed && item.badge && (
          <span className={cn(
            "relative z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            item.isNew
              ? "bg-gradient-to-r from-primary to-primary-light text-white"
              : "bg-secondary/10 text-secondary"
          )}>
            {item.isNew && <Sparkles className="h-2.5 w-2.5" />}
            {item.badge}
          </span>
        )}

        {/* Hover arrow */}
        {!collapsed && !active && (
          <ArrowRight className="relative z-10 h-4 w-4 text-stone opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo Section */}
      <div className="flex h-[72px] items-center gap-3 px-5 border-b border-border">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary-light shadow-lg shadow-primary/20">
          <Zap className="h-5 w-5 text-white" />
          {/* Animated ring */}
          <div className="absolute inset-0 rounded-xl animate-ping bg-primary/20" style={{ animationDuration: '3s' }} />
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-foreground tracking-tight whitespace-nowrap">
            Nextzen Orbit
          </span>
        )}
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {/* Section Label */}
        {!collapsed && (
          <div className="px-3 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone">
              Navigation
            </span>
          </div>
        )}

        {/* Main Nav */}
        <nav className="space-y-1" aria-label="Main navigation">
          {mainNavItems.map((item) => renderNavItem(item))}
        </nav>

        {/* Divider */}
        <div className="my-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Section Label */}
        {!collapsed && (
          <div className="px-3 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone">
              Account
            </span>
          </div>
        )}

        {/* Bottom Nav */}
        <nav className="space-y-1" aria-label="Account navigation">
          {bottomNavItems.map((item) => renderNavItem(item))}
        </nav>
      </div>

      {/* Pro Card */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-dark/50 via-card to-card border border-border p-4">
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-secondary/10 rounded-full blur-xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-light">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-foreground">Go Pro</span>
              </div>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                Unlimited AI analysis, premium templates & priority support
              </p>
              <Link
                href="/subscription"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-primary-light text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
              >
                Upgrade Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="hidden lg:block px-3 py-3 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-xl p-2.5 text-stone hover:text-foreground hover:bg-muted transition-all duration-200"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-lg lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-surface-overlay backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border lg:hidden shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-5 flex h-9 w-9 items-center justify-center rounded-xl text-stone hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:border-r lg:border-border lg:bg-card",
          "transition-all duration-300 ease-out",
          collapsed ? "lg:w-[80px]" : "lg:w-72",
          className
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
