import { getCachedUser } from "@/lib/supabase/server";
import { aiAllowance, type AiBucket } from "@/lib/ai/quota";

/** GET /api/ai-quota: today's AI allowances for the signed-in user (resets 00:00 GMT). */
export async function GET() {
  const { user } = await getCachedUser();
  if (!user) return Response.json({ success: false, error: { message: "Please sign in." } }, { status: 401 });
  try {
    const buckets: AiBucket[] = ["rewrite", "cover_letter", "light"];
    const allowances = await Promise.all(buckets.map(bucket => aiAllowance(user.id, bucket)));
    // null means limits are not enforced yet (migration 046 not applied).
    return Response.json({ success: true, data: Object.fromEntries(buckets.map((bucket, i) => [bucket, allowances[i]])) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ success: false, error: { message: "Usage limits are temporarily unavailable." } }, { status: 503 });
  }
}
