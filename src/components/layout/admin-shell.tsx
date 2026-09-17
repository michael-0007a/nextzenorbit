"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import type { UserRole } from "@/types/database";
import { cn } from "@/lib/utils";

export function AdminShell({ role, email, children }: { role: UserRole; email: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return <div className="min-h-screen bg-background text-foreground">
    <AdminSidebar role={role} email={email} onCollapsedChange={setCollapsed} className="fixed inset-y-0 left-0 z-30 h-dvh" />
    <main className={cn("min-w-0 transition-[margin] duration-300", collapsed ? "lg:ml-20" : "lg:ml-64")}>
      <div className="mx-auto w-full max-w-[1680px] px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-8">{children}</div>
    </main>
  </div>;
}
