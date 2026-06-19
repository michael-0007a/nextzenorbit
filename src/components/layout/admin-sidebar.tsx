"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  Inbox,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

// === Navigation Items ===
export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  requireSuperAdmin?: boolean;
}

const mainNavItems: NavItem[] = [
  { label: "Apply Queue", href: "/admin/apply-queue", icon: Inbox, badge: "LIVE" },
  { label: "All Users", href: "/admin/users", icon: Users },
];

const superAdminNavItems: NavItem[] = [
  { label: "Admin Team", href: "/admin/team", icon: Shield, requireSuperAdmin: true },
  { label: "SSO Users", href: "/admin/sso-users", icon: UserPlus, requireSuperAdmin: true },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, requireSuperAdmin: true },
];

const bottomNavItems: NavItem[] = [
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

// === Sidebar Component ===
export interface AdminSidebarProps {
  className?: string;
  role: UserRole;
  email: string;
}

export function AdminSidebar({ className, role, email }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isSuperAdmin = role === "super_admin";

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const renderNavItem = (item: NavItem) => {
    if (item.requireSuperAdmin && !isSuperAdmin) return null;

    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-transparent",
          "text-sm font-medium transition-all duration-200",
          active
            ? "text-foreground bg-white/10 border-primary/40 shadow-[0_0_24px_rgba(255,0,61,0.2)]"
            : "text-text-secondary hover:text-foreground hover:bg-white/5"
        )}
        aria-current={active ? "page" : undefined}
      >
        {/* Active glow effect */}
        {active && (
          <motion.div
            layoutId="admin-nav-glow"
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}

        {/* Icon with background */}
        <div className={cn(
          "relative z-10 flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
          active
            ? "bg-gradient-to-br from-primary to-primary-light text-white shadow-[0_0_24px_rgba(255,0,61,0.35)]"
            : "bg-white/5 text-text-secondary group-hover:bg-white/10 group-hover:text-foreground"
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
            "bg-gradient-to-r from-primary to-primary-light text-white"
          )}>
            {item.badge}
          </span>
        )}

        {/* Hover arrow */}
        {!collapsed && !active && (
          <ArrowRight className="relative z-10 h-4 w-4 text-text-secondary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo Section */}
      <div className="flex h-[78px] items-center justify-center px-5 border-b border-border/60">
        <Link href="/admin" className="flex items-center gap-2 w-full justify-center">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/20 shadow-[0_0_24px_rgba(255,0,61,0.25)]">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wider uppercase text-foreground leading-none">Admin</span>
              <span className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Portal</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        
        {/* Main Nav */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Workflow
              </span>
            </div>
          )}
          <nav className="space-y-1" aria-label="Main admin navigation">
            {mainNavItems.map((item) => renderNavItem(item))}
          </nav>
        </div>

        {/* Super Admin Nav */}
        {isSuperAdmin && (
          <div>
            {!collapsed && (
              <div className="px-3 mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                  Management
                </span>
              </div>
            )}
            <nav className="space-y-1" aria-label="Super admin navigation">
              {superAdminNavItems.map((item) => renderNavItem(item))}
            </nav>
          </div>
        )}
      </div>

      {/* Account Info Footer */}
      <div className="px-3 pb-3 pt-4 border-t border-border/60 bg-surface/50">
        {!collapsed && (
          <div className="px-3 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              Account
            </span>
          </div>
        )}
        <nav className="space-y-1 mb-4" aria-label="Admin account settings">
          {bottomNavItems.map((item) => renderNavItem(item))}
        </nav>
        
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-border/50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs uppercase">
              {email.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-foreground truncate">{email}</span>
              <span className="text-[10px] text-text-secondary uppercase">{isSuperAdmin ? "Super Admin" : "Admin"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className="hidden lg:block px-3 py-3 border-t border-border/60">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-full p-2.5 text-text-secondary hover:text-foreground hover:bg-white/5 transition-all duration-200"
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
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/10 backdrop-blur-md shadow-lg lg:hidden"
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
              className="fixed inset-y-0 left-0 z-50 w-72 bg-surface/90 border-r border-border/60 backdrop-blur-2xl lg:hidden shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-5 flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:text-foreground hover:bg-white/10 transition-colors"
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
          "hidden lg:flex lg:flex-col lg:border-r lg:border-border/60 lg:bg-surface/85 lg:backdrop-blur-2xl",
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
