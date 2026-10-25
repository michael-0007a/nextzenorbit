import { createAdminClient } from "@/lib/supabase/admin";
import { getAccountAccess } from "@/lib/account-access";
import { isSubscriptionActive } from "@/lib/subscription";

/**
 * Daily AI allowances, reset at 00:00 GMT. Only successful AI actions are recorded, so failed or
 * retried attempts never use up an allowance. Admins can ask a supervisor for extra (ai_quota_requests).
 */
export type AiBucket = "rewrite" | "cover_letter" | "light";
export const AI_BUCKET_LABELS: Record<AiBucket, string> = { rewrite: "resume generations", cover_letter: "cover letters", light: "AI actions" };

const STAFF_LIMITS: Record<string, Record<AiBucket, number>> = {
  admin: { rewrite: 50, cover_letter: 100, light: 100 },
  supervisor_admin: { rewrite: 150, cover_letter: 300, light: 300 },
  super_admin: { rewrite: 500, cover_letter: 500, light: 500 },
};
// Client resume rewrites by plan (Silver = free id, Gold = pro id); cover letters and light AI are shared.
const CLIENT_REWRITES: Record<string, number> = { free: 10, pro: 15, elite: 20 };
const CLIENT_LIMITS = { cover_letter: 30, light: 50 };

export const utcDayStart = (now = new Date()) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const missingTable = (code?: string) => code === "42P01" || code === "PGRST205";

export function baseLimit(role: string | null, planId: string | null, bucket: AiBucket): number {
  const staff = role ? STAFF_LIMITS[role] : undefined;
  if (staff) return staff[bucket];
  return bucket === "rewrite" ? CLIENT_REWRITES[planId || "free"] ?? CLIENT_REWRITES.free : CLIENT_LIMITS[bucket];
}

export type AiAllowance = { bucket: AiBucket; used: number; limit: number; remaining: number; resetsAt: string; canRequestMore: boolean };

export async function aiAllowance(userId: string, bucket: AiBucket): Promise<AiAllowance | null> {
  const access = await getAccountAccess(userId);
  const planId = isSubscriptionActive(access.subscription) ? access.subscription?.plan_id ?? null : null;
  const admin = createAdminClient();
  const start = utcDayStart();
  const [{ count, error }, { data: grants, error: grantError }] = await Promise.all([
    admin.from("ai_usage_events").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("bucket", bucket).gte("created_at", start.toISOString()),
    admin.from("ai_quota_requests").select("extra").eq("user_id", userId).eq("bucket", bucket).eq("day", start.toISOString().slice(0, 10)).eq("status", "approved"),
  ]);
  // shortcut: before migration 046 is applied, allowances are not enforced; apply it to turn them on.
  if (missingTable(error?.code) || missingTable(grantError?.code)) return null;
  if (error || grantError) throw error || grantError;
  const limit = baseLimit(access.role, planId, bucket) + (grants || []).reduce((sum, g) => sum + g.extra, 0);
  const used = count ?? 0;
  return { bucket, used, limit, remaining: Math.max(0, limit - used), resetsAt: new Date(start.getTime() + 86_400_000).toISOString(), canRequestMore: access.role === "admin" };
}

/** 429 when today's allowance is used up, otherwise null. Check before the AI call.
 * shortcut: check-then-record lets a few simultaneous requests pass the limit; the per-minute burst
 * limits bound that. Upgrade to a counted reservation if exact caps under concurrency matter. */
export async function checkAiQuota(userId: string, bucket: AiBucket): Promise<Response | null> {
  let allowance: AiAllowance | null;
  try { allowance = await aiAllowance(userId, bucket); }
  catch { return Response.json({ success: false, error: { message: "Usage limits are temporarily unavailable. Please try again." } }, { status: 503 }); }
  if (!allowance || allowance.remaining > 0) return null;
  const message = `You've used all ${allowance.limit} ${AI_BUCKET_LABELS[bucket]} for today. It resets at 00:00 GMT.`
    + (allowance.canRequestMore ? " You can request more from a supervisor." : " Upgrade your plan for a higher daily limit.");
  return Response.json({ success: false, error: { code: "AI_QUOTA_EXCEEDED", message, allowance } },
    { status: 429, headers: { "Retry-After": String(Math.ceil((Date.parse(allowance.resetsAt) - Date.now()) / 1000)) } });
}

/** Record one successful AI action. Never fails the request that already succeeded. */
export async function recordAiUse(userId: string, bucket: AiBucket, tokens?: number) {
  const { error } = await createAdminClient().from("ai_usage_events").insert({ user_id: userId, bucket, tokens: tokens ?? null });
  if (error && !missingTable(error.code)) console.error("AI usage not recorded:", error.code);
}
