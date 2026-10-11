/**
 * Mock Interviews (basic, text only)
 *
 * GET  /api/mock-interviews — the signed-in user's recent sessions
 * POST /api/mock-interviews { role, jobDescription? } — start a session with AI-generated questions
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCachedUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { checkAiTokenUsage } from "@/lib/subscription-server";
import { AiOutputError, generateJson, trackAiUsage } from "@/lib/ai/json";
import { MOCK_QUESTIONS_SYSTEM, mockQuestionsPrompt, mockQuestionsSchema } from "@/lib/ai/prompts/mock-interview";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

export const maxDuration = 60;
const noStore = { headers: { "Cache-Control": "private, no-store" } };

const startSchema = z.object({
  role: z.string().trim().min(2, "Enter the role you are practising for.").max(120),
  jobDescription: z.string().trim().max(8000, "Job description is limited to 8,000 characters.").optional(),
});

export async function GET(): Promise<Response> {
  const { user } = await getCachedUser();
  if (!user) return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
  const { data, error } = await createAdminClient().from("mock_interviews")
    .select("id, role, overall, created_at, completed_at").eq("user_id", user.id)
    .order("created_at", { ascending: false }).limit(20);
  if (error) return apiError(ERROR_CODES.INTERNAL_ERROR, "Unable to load your interviews.", 503);
  return NextResponse.json(apiSuccess(data ?? []), noStore);
}

export async function POST(request: Request): Promise<Response> {
  const { user } = await getCachedUser();
  if (!user) return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
  const parsed = startSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(ERROR_CODES.VALIDATION_ERROR, parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  const limited = await rateLimit("mock-interview-start", user.id, 10, 3600);
  if (limited) return limited;
  const usage = await checkAiTokenUsage(user.id);
  if (!usage.allowed) return apiError(ERROR_CODES.SUBSCRIPTION_REQUIRED, usage.error || "Monthly AI limit reached.", 403);

  try {
    const { role, jobDescription } = parsed.data;
    const { data: generated, tokens } = await generateJson(mockQuestionsSchema, MOCK_QUESTIONS_SYSTEM, mockQuestionsPrompt(role, jobDescription), 1200);
    await trackAiUsage(user.id, tokens).catch((err) => console.error("AI usage tracking failed:", err));
    const { data, error } = await createAdminClient().from("mock_interviews")
      .insert({ user_id: user.id, role, job_description: jobDescription || null, questions: generated.questions })
      .select("*").single();
    if (error || !data) return apiError(ERROR_CODES.INTERNAL_ERROR, "Unable to start the interview.", 503);
    return NextResponse.json(apiSuccess(data), { status: 201, ...noStore });
  } catch (err) {
    if (err instanceof AiOutputError) return apiError(ERROR_CODES.INTERNAL_ERROR, err.message, 502);
    console.error("Mock interview start failed:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Unable to start the interview right now.", 503);
  }
}
