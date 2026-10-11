/**
 * POST /api/mock-interviews/[id]/answer { index, answer }
 * Scores one answer with AI and stores the feedback. The last answer completes the session.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCachedUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { checkAiTokenUsage } from "@/lib/subscription-server";
import { AiOutputError, generateJson, trackAiUsage } from "@/lib/ai/json";
import { MOCK_FEEDBACK_SYSTEM, mockFeedbackPrompt, mockFeedbackSchema, overallScore } from "@/lib/ai/prompts/mock-interview";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";
import type { MockInterviewAnswer, MockInterviewRow } from "@/types/database";

export const maxDuration = 60;

const answerSchema = z.object({
  index: z.number().int().min(0).max(9),
  answer: z.string().trim().min(1, "Write your answer first.").max(4000, "Answers are limited to 4,000 characters."),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { user } = await getCachedUser();
  if (!user) return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError(ERROR_CODES.NOT_FOUND, "Interview not found.", 404);
  const parsed = answerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(ERROR_CODES.VALIDATION_ERROR, parsed.error.issues[0]?.message ?? "Invalid answer.", 400);

  const admin = createAdminClient();
  const { data: session } = await admin.from("mock_interviews").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!session) return apiError(ERROR_CODES.NOT_FOUND, "Interview not found.", 404);
  const interview = session as MockInterviewRow;
  if (interview.completed_at) return apiError(ERROR_CODES.VALIDATION_ERROR, "This interview is already finished.", 409);
  const question = interview.questions[parsed.data.index];
  if (!question) return apiError(ERROR_CODES.VALIDATION_ERROR, "Unknown question.", 400);

  const limited = await rateLimit("mock-interview-answer", user.id, 60, 3600);
  if (limited) return limited;
  const usage = await checkAiTokenUsage(user.id);
  if (!usage.allowed) return apiError(ERROR_CODES.SUBSCRIPTION_REQUIRED, usage.error || "Monthly AI limit reached.", 403);

  try {
    const { data: feedback, tokens } = await generateJson(mockFeedbackSchema, MOCK_FEEDBACK_SYSTEM, mockFeedbackPrompt(interview.role, question, parsed.data.answer), 1500);
    await trackAiUsage(user.id, tokens).catch((err) => console.error("AI usage tracking failed:", err));

    // shortcut: read-modify-write of the answers array; fine for one user answering in order, use jsonb_set in an RPC if answers become concurrent.
    const answers: (MockInterviewAnswer | null)[] = interview.questions.map((_, i) => interview.answers?.[i] ?? null);
    answers[parsed.data.index] = { answer: parsed.data.answer, ...feedback };
    const scores = answers.filter((a): a is MockInterviewAnswer => !!a).map((a) => a.score);
    const done = scores.length === interview.questions.length;
    const { data, error } = await admin.from("mock_interviews")
      .update({ answers, ...(done ? { overall: overallScore(scores), completed_at: new Date().toISOString() } : {}) })
      .eq("id", id).eq("user_id", user.id).select("*").single();
    if (error || !data) return apiError(ERROR_CODES.INTERNAL_ERROR, "Unable to save your answer.", 503);
    return NextResponse.json(apiSuccess(data), { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    if (err instanceof AiOutputError) return apiError(ERROR_CODES.INTERNAL_ERROR, err.message, 502);
    console.error("Mock interview scoring failed:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Unable to score your answer right now.", 503);
  }
}
