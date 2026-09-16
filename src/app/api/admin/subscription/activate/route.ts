import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireApprovedAccount } from "@/lib/onboarding";
import { reconcileUserPayments } from "@/lib/payments/reconcile";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
export const maxDuration = 60;

// Recover actual payments; an admin action cannot grant an unpaid subscription.
export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;
  const limited = await rateLimit("admin-payment-reconcile", auth.userId, 10, 300);
  if (limited) return limited;
  try {
    const parsed = z.object({ user_id: z.string().uuid(), txnid: z.string().trim().regex(/^[a-zA-Z0-9_-]{1,100}$/).optional() }).safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: { message: "Provide a valid client and transaction reference." } }, { status: 400 });
    const blocked = await requireApprovedAccount(parsed.data.user_id);
    if (blocked) return blocked;
    const confirmed = await reconcileUserPayments(parsed.data.user_id, parsed.data.txnid);
    if (!confirmed) return Response.json({ error: { message: "No completed payment was verified. Access remains unchanged." } }, { status: 409 });
    const { data, error } = await createAdminClient().from("subscriptions").select("plan_id,status,current_period_end").eq("user_id", parsed.data.user_id).single();
    if (error) throw error;
    return Response.json({ success: true, data });
  } catch (error) {
    console.error("Admin payment reconciliation failed:", error);
    return Response.json({ error: { message: "Payment verification is temporarily unavailable. Please retry." } }, { status: 503 });
  }
}
