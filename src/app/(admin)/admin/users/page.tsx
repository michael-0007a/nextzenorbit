export const dynamic='force-dynamic';
import { NextRequest } from "next/server";
import { GET } from "@/app/api/admin/users/route";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { redirect } from "next/navigation";
import { AdminUsersClient } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Users | Admin Portal",
};

export default async function AdminUsersPage() {
  const adminAuth = await requireAdmin();

  if (isAuthError(adminAuth)) {
    redirect("/admin/login");
  }

  type AdminUser = {
    id: string;
    email: string;
    profile: { full_name: string } | null;
  };

  const initialPromise = GET(new NextRequest("http://localhost/api/admin/users"));
  // Fetch admins if this user has permission to allocate
  let admins: AdminUser[] = [];
  if (adminAuth.role === "supervisor_admin" || adminAuth.role === "super_admin") {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("users")
      .select(`
        id,
        email,
        profile:profiles!profiles_user_id_fkey(full_name)
      `)
      .eq("role", "admin").eq("is_suspended",false);
      
    if (data) {
      admins = data as AdminUser[];
    }
  }

  const response = await initialPromise;
  const initial = await response.json();
  if (!response.ok || !initial.success) throw new Error(initial.error?.message ?? "Unable to load clients.");
  return <AdminUsersClient adminRole={adminAuth.role} admins={admins} initialUsers={initial.data} initialPagination={initial.meta?.pagination} />;
}
