import { z } from "zod";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { utcDayStart } from "@/lib/ai/quota";

const SUPERVISORS = ["supervisor_admin", "super_admin"];
const requestSchema = z.object({ bucket: z.enum(["rewrite", "cover_letter", "light"]), reason: z.string().trim().min(3).max(500) });

/** POST: an admin asks a supervisor for more of today's AI allowance. */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;
  const limited = await rateLimit("ai-quota-request", auth.userId, 10, 3600);
  if (limited) return limited;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ success: false, error: { message: "Say briefly why you need more (3-500 characters)." } }, { status: 400 });
  const { error } = await createAdminClient().from("ai_quota_requests").insert({ user_id: auth.userId, bucket: parsed.data.bucket, day: utcDayStart().toISOString().slice(0, 10), reason: parsed.data.reason });
  if (error?.code === "23505") return Response.json({ success: false, error: { message: "You already have a request waiting for a supervisor." } }, { status: 409 });
  if (error) return Response.json({ success: false, error: { message: "Request could not be sent. Please retry." } }, { status: 503 });
  return Response.json({ success: true }, { status: 201 });
}

/** GET: supervisors see pending requests (with today's usage) and today's decisions. */
export async function GET() {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;
  if (!SUPERVISORS.includes(auth.role)) return Response.json({ success: false, error: { message: "Supervisor access required." } }, { status: 403 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("ai_quota_requests")
    .select("id, user_id, bucket, day, reason, status, extra, decided_at, created_at, requester:users!ai_quota_requests_user_id_fkey(email, profile:profiles!profiles_user_id_fkey(full_name))")
    .or(`status.eq.pending,day.eq.${utcDayStart().toISOString().slice(0, 10)}`)
    .order("created_at", { ascending: false }).limit(100);
  if (error) return Response.json({ success: false, error: { message: "Requests are temporarily unavailable." } }, { status: 503 });
  return Response.json({ success: true, data }, { headers: { "Cache-Control": "private, no-store" } });
}
