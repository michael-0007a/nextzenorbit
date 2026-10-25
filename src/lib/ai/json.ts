import { extractJson } from "@/lib/ai/extract-json";
import type { z } from "zod";
import { AI_WRITER_MODEL, createAIClient } from "@/lib/ai/model";
import { createAdminClient } from "@/lib/supabase/admin";

const groq = createAIClient();

export class AiOutputError extends Error {}

/** One JSON-mode completion validated against a schema. Throws AiOutputError on malformed output. */
export async function generateJson<T extends z.ZodType>(schema: T, system: string, user: string, maxTokens = 1500) {
  const completion = await groq.chat.completions.create({
    model: AI_WRITER_MODEL,
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    temperature: 0.6,
    max_tokens: maxTokens,
  });
  return { data: parseAiJson(schema, completion.choices[0]?.message?.content), tokens: completion.usage?.total_tokens ?? 0 };
}

export function parseAiJson<T extends z.ZodType>(schema: T, raw: string | null | undefined): z.infer<T> {
  let json: unknown;
  try { json = extractJson(raw); } catch { throw new AiOutputError("The AI returned an unreadable answer. Please try again."); }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new AiOutputError("The AI answer was incomplete. Please try again.");
  return parsed.data;
}

/** Adds tokens to this month's ai_usage row (same accounting as the existing AI routes). */
export async function trackAiUsage(userId: string, tokens: number) {
  const admin = createAdminClient();
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const { data: existing } = await admin.from("ai_usage").select("id, tokens_used").eq("user_id", userId)
    .gte("billing_period_start", periodStart.toISOString()).lte("billing_period_end", periodEnd.toISOString()).maybeSingle();
  if (existing) {
    await admin.from("ai_usage").update({ tokens_used: existing.tokens_used + tokens, last_used_at: now.toISOString() }).eq("id", existing.id);
  } else {
    await admin.from("ai_usage").insert({ user_id: userId, billing_period_start: periodStart.toISOString(), billing_period_end: periodEnd.toISOString(), tokens_used: tokens, last_used_at: now.toISOString() });
  }
}
