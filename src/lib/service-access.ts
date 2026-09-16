import { createAdminClient } from "@/lib/supabase/admin";
import { isSubscriptionActive } from "@/lib/subscription";

export async function hasServiceAccess(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: user, error } = await admin.from("users").select("role, is_suspended").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!user || user.is_suspended) return false;
  if (["admin", "super_admin", "supervisor_admin", "sso_user"].includes(user.role)) return true;
  const { data: sub, error: subError } = await admin.from("subscriptions").select("*").eq("user_id", userId).maybeSingle();
  if (subError) throw subError;
  return isSubscriptionActive(sub);
}
