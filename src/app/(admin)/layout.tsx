import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireAdmin();

  if (isAuthError(result)) {
    // If forbidden, they are authenticated but not admin -> dashboard
    if (result.status === 403) {
      redirect("/dashboard");
    }
    // If unauthorized, they are not signed in -> admin login
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="absolute inset-0 bg-space pointer-events-none z-0" />
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_60%)] pointer-events-none z-0" />

      <AdminSidebar role={result.role} email={result.email} className="fixed z-30 h-screen" />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 w-full min-w-0 transition-all duration-300 ease-out lg:ml-72 flex flex-col">
        <div className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 max-w-[1600px] mx-auto w-full">
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
}
