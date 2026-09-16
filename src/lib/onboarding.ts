import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

export type ApplicationAccess = "draft" | "pending" | "approved" | "rejected";

export async function getApplicationAccess(user: Pick<User, "id" | "email">): Promise<ApplicationAccess> {
  const admin = createAdminClient();
  const { data: account, error } = await admin.from("users").select("role, is_suspended").eq("id", user.id).maybeSingle();
  if (error) throw error;
  if (account?.is_suspended) return "rejected";
  if (account && ["admin", "supervisor_admin", "super_admin", "sso_user"].includes(account.role)) return "approved";
  const { data: application, error: applicationError } = await admin.from("signup_applications").select("status, phone").eq("user_id", user.id).maybeSingle();
  if (applicationError) throw applicationError;
  const values = [user.email?.trim().toLowerCase() || ""];
  if (application?.phone) values.push(application.phone);
  const { data: blocks, error: blockError } = await admin.from("registration_blocks").select("kind").in("value", values).limit(1);
  if (blockError) throw blockError;
  if (blocks?.length) return "rejected";
  return application?.status || "draft";
}

export async function requireApprovedAccount(userId: string): Promise<Response | null> {
  const { data, error } = await createAdminClient().auth.admin.getUserById(userId);
  if (error || !data.user || await getApplicationAccess(data.user) !== "approved") {
    return Response.json({ success: false, error: { code: "APPROVAL_REQUIRED", message: "Your application must be approved before payment or account access is available." } }, { status: 403 });
  }
  return null;
}
