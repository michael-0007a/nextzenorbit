"use server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { revalidatePath } from "next/cache";

export async function assignAdminsToUser(userId: string, adminIds: string[]) {
  const auth = await requireAdmin();
  if (isAuthError(auth) || auth.role === "admin") return { error: "Supervisor access required." };
  const parsed = z.object({userId:z.string().uuid(),adminIds:z.array(z.string().uuid()).max(50)}).safeParse({userId,adminIds});
  if (!parsed.success) return {error:"Choose valid admins and a client."};
  const { error } = await createAdminClient().rpc("assign_client_admins", {p_actor_id:auth.userId,p_user_id:userId,p_admin_ids:[...new Set(adminIds)]});
  if (error) return {error:"Unable to save assignments. Check that all selected admins are active and retry."};
  revalidatePath("/admin/users");
  revalidatePath("/admin/apply-queue");
  revalidatePath("/admin/analytics");
  return {success:true};
}
