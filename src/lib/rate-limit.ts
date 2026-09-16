import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Atomic Postgres counters work across serverless instances and process restarts.
export async function rateLimit(scope: string, identity: string, limit: number, seconds: number): Promise<Response | null> {
  const key = createHash("sha256").update(`${scope}:${identity}`).digest("hex");
  const { data, error } = await createAdminClient().rpc("consume_request_limit", { p_key: key, p_limit: limit, p_seconds: seconds });
  if (error) {
    console.error("Rate limit unavailable:", error.code);
    return Response.json({ success: false, error: { message: "Service temporarily unavailable. Please try again." } }, { status: 503 });
  }
  if (!data) return Response.json({ success: false, error: { message: "Too many attempts. Please try again later." } }, { status: 429, headers: { "Retry-After": String(seconds) } });
  return null;
}
