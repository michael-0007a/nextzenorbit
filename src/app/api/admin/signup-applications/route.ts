import { z } from "zod";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const reviewSchema = z.object({ userId: z.string().uuid(), decision: z.enum(["approved", "rejected"]), reason: z.string().trim().max(2000).default("") })
  .refine(v => v.decision !== "rejected" || v.reason.length >= 3, "Provide a rejection reason.");

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) return auth;
    if (auth.role !== "super_admin" && auth.role !== "supervisor_admin") return Response.json({ error: { message: "Supervisor or super admin access required." } }, { status: 403 });
    const limited = await rateLimit("application-review", auth.userId, 60, 60);
    if (limited) return limited;
    const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: { message: "Choose a decision and provide a reason for rejection." } }, { status: 400 });
    const { error } = await createAdminClient().rpc("review_signup_application", { p_user_id: parsed.data.userId, p_reviewer_id: auth.userId, p_decision: parsed.data.decision, p_reason: parsed.data.reason });
    if (error) return Response.json({ error: { message: "Unable to review this application. It may already have been reviewed or its identity may be blocked. Refresh the queue." } }, { status: 409 });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Application review failed:", error);
    return Response.json({ error: { message: "Unable to review application." } }, { status: 500 });
  }
}
