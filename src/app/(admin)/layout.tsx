import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
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
    <AdminShell role={result.role} email={result.email}>{children}</AdminShell>
  );
}
