import { z } from "zod";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { createAdminClient } from "@/lib/supabase/admin";

const decisionSchema = z.object({ decision: z.enum(["approved", "denied"]), extra: z.number().int().min(1).max(200).default(25) });

/** POST: a supervisor approves (with extra allowance for that day) or denies a pending request. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;
  if (auth.role !== "supervisor_admin" && auth.role !== "super_admin") return Response.json({ success: false, error: { message: "Supervisor access required." } }, { status: 403 });
  const { id } = await params;
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!z.string().uuid().safeParse(id).success || !parsed.success) return Response.json({ success: false, error: { message: "Choose approve or deny and an amount between 1 and 200." } }, { status: 400 });
  const admin = createAdminClient();
  const { data: pending } = await admin.from("ai_quota_requests").select("user_id").eq("id", id).eq("status", "pending").maybeSingle();
  if (!pending) return Response.json({ success: false, error: { message: "This request was already decided or no longer exists." } }, { status: 409 });
  // Approving your own request would bypass the review entirely.
  if (pending.user_id === auth.userId) return Response.json({ success: false, error: { message: "Another supervisor must decide your own request." } }, { status: 403 });
  const { data, error } = await admin.from("ai_quota_requests")
    .update({ status: parsed.data.decision, extra: parsed.data.decision === "approved" ? parsed.data.extra : 0, decided_by: auth.userId, decided_at: new Date().toISOString() })
    .eq("id", id).eq("status", "pending").select("id").maybeSingle();
  if (error) return Response.json({ success: false, error: { message: "Decision could not be saved. Please retry." } }, { status: 503 });
  if (!data) return Response.json({ success: false, error: { message: "This request was already decided." } }, { status: 409 });
  return Response.json({ success: true });
}
