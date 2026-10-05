import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { createHash } from "node:crypto";
const metric = z.object({ name: z.enum(["CLS", "FCP", "FID", "INP", "LCP", "TTFB"]), value: z.number().finite().min(0).max(3_600_000), pathname: z.string().max(180).regex(/^\/[a-zA-Z0-9/:_-]*$/) });
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 1000) return new Response(null, { status: 413 });
  const body = await request.text();
  if (body.length > 1000) return new Response(null, { status: 413 });
  let value: unknown;
  try { value = JSON.parse(body || "null"); } catch { return new Response(null, { status: 400 }); }
  const parsed = metric.safeParse(value);
  if (!parsed.success) return new Response(null, { status: 400 });
  const ip = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const limited = await rateLimit("performance", createHash("sha256").update(ip).digest("hex"), 60, 60);
  if (limited) return limited;
  console.info("[web-vitals]", parsed.data);
  return new Response(null, { status: 204 });
}
