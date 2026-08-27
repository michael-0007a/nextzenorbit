"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { revalidatePath } from "next/cache";

export async function assignAdminToUser(userId: string, adminId: string | null) {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return { error: "Unauthorized" };

    if (adminAuth.role === "admin") {
      return { error: "You do not have permission to allocate users." };
    }

    const admin = createAdminClient();

    const { error: profileError } = await admin
      .from("profiles")
      .update({ assigned_admin_id: adminId || null })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Assign admin error:", profileError);
      return { error: "Failed to assign admin." };
    }

    await admin
      .from("job_queue")
      .update({
        assigned_to: adminId || null,
        claimed_by: adminId || null,
      })
      .eq("user_id", userId);

    revalidatePath("/admin/users");
    revalidatePath("/admin/apply-queue");
    
    return { success: true };
  } catch (error) {
    console.error("Assign Admin Action Error:", error);
    return { error: "Something went wrong." };
  }
}
