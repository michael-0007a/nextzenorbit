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
      .eq("role", "admin");
      
    if (data) {
      admins = data as AdminUser[];
    }
  }

  return <AdminUsersClient adminRole={adminAuth.role} admins={admins} />;
}
