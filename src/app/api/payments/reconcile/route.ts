import { createClient } from "@/lib/supabase/server";
import { reconcileUserPayments } from "@/lib/payments/reconcile";
import { z } from "zod";
import { requireApprovedAccount } from "@/lib/onboarding";
import { rateLimit } from "@/lib/rate-limit";
import { hasServiceAccess } from "@/lib/service-access";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return Response.json({ error: { message: "Please sign in." } }, { status: 401 });
  const blocked = await requireApprovedAccount(user.id);
  if (blocked) return blocked;
  const limited = await rateLimit("payment-reconcile", user.id, 6, 300);
  if (limited) return limited;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = z.object({ txnid: z.string().trim().regex(/^[a-zA-Z0-9_-]{1,100}$/).optional() }).safeParse(body);
    if (!parsed.success) return Response.json({ error: { message: "Enter a valid transaction reference." } }, { status: 400 });
    await reconcileUserPayments(user.id, parsed.data.txnid);
    return Response.json({ active: await hasServiceAccess(user.id) });
  } catch (error) {
    console.error("Payment reconciliation failed:", error);
    return Response.json({ error: { message: "Payment confirmation is temporarily unavailable. Please check again; do not pay twice." } }, { status: 503 });
  }
}
