import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSubscriptionActive } from "@/lib/subscription";
import type { SubscriptionRow, UserRole } from "@/types/database";

export type AccountAccess = {
  application: "draft" | "pending" | "approved" | "rejected";
  service: boolean;
  role: UserRole | null;
  subscription: SubscriptionRow | null;
};
const privileged = ["admin", "supervisor_admin", "super_admin", "sso_user"];

/** One joined lookup replaces separate account/application/subscription reads.
 * cache() deduplicates only within a server render; permissions never persist globally. */
export const getAccountAccess = cache(async (userId: string, email = ""): Promise<AccountAccess> => {
  const admin = createAdminClient();
  const { data, error } = await admin.from("users").select(`
    role, email, is_suspended,
    application:signup_applications!signup_applications_user_id_fkey(status, phone),
    subscription:subscriptions!subscriptions_user_id_fkey(*)
  `).eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!data) return { application: "draft", service: false, role: null, subscription: null };
  const row = data as unknown as {
    role: UserRole; email: string; is_suspended: boolean;
    application: {status: AccountAccess["application"]; phone: string | null} | {status: AccountAccess["application"]; phone: string | null}[] | null;
    subscription: SubscriptionRow | SubscriptionRow[] | null;
  };
  const subscription = Array.isArray(row.subscription) ? row.subscription[0] ?? null : row.subscription;
  if (row.is_suspended) return { application: "rejected", service: false, role: row.role, subscription };
  if (privileged.includes(row.role)) return { application: "approved", service: true, role: row.role, subscription };
  if (Array.isArray(row.subscription) && row.subscription.length > 1) throw new Error('Conflicting subscription records.');
  const application = Array.isArray(row.application) ? row.application[0] : row.application;
  const values = [(email || row.email || "").trim().toLowerCase()];
  if (application?.phone) values.push(application.phone);
  const { data: blocks, error: blockError } = await admin.from("registration_blocks").select("kind").in("value", values).limit(1);
  if (blockError) throw blockError;
  const applicationAccess = blocks?.length ? "rejected" : application?.status ?? "draft";
  return {
    application: applicationAccess,
    service: applicationAccess === "approved" && isSubscriptionActive(subscription), role: row.role, subscription,
  };
});

export function accountAccessFor(user: Pick<User, "id" | "email">) {
  return getAccountAccess(user.id, user.email ?? "");
}
