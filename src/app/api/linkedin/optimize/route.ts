/**
 * LinkedIn Profile Optimizer
 *
 * POST /api/linkedin/optimize { resumeId, targetRole }
 * Returns a headline, About section, skills and rewritten experience bullets
 * built only from the signed-in user's own resume. Nothing is stored.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCachedUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { checkAiTokenUsage } from "@/lib/subscription-server";
import { resumeContentSchema } from "@/lib/validations/resume";
import { AiOutputError, generateJson, trackAiUsage } from "@/lib/ai/json";
import { LINKEDIN_SYSTEM, linkedinProfileSchema, linkedinUserPrompt } from "@/lib/ai/prompts/linkedin";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

export const maxDuration = 60;

const requestSchema = z.object({
  resumeId: z.string().uuid(),
  targetRole: z.string().trim().min(2, "Enter the role you are targeting.").max(120),
});

export async function POST(request: Request): Promise<Response> {
  const { user } = await getCachedUser();
  if (!user) return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(ERROR_CODES.VALIDATION_ERROR, parsed.error.issues[0]?.message ?? "Invalid request.", 400);

  const limited = await rateLimit("linkedin-optimize", user.id, 10, 3600);
  if (limited) return limited;
  const usage = await checkAiTokenUsage(user.id);
  if (!usage.allowed) return apiError(ERROR_CODES.SUBSCRIPTION_REQUIRED, usage.error || "Monthly AI limit reached.", 403);

  const { data: resume } = await createAdminClient().from("resumes").select("content")
    .eq("id", parsed.data.resumeId).eq("user_id", user.id).is("deleted_at", null).maybeSingle();
  if (!resume) return apiError(ERROR_CODES.NOT_FOUND, "Resume not found.", 404);
  const content = resumeContentSchema.safeParse(resume.content);
  if (!content.success) return apiError(ERROR_CODES.VALIDATION_ERROR, "This resume could not be read. Open and save it once, then try again.", 400);

  try {
    const { data, tokens } = await generateJson(linkedinProfileSchema, LINKEDIN_SYSTEM, linkedinUserPrompt(content.data, parsed.data.targetRole), 2500);
    await trackAiUsage(user.id, tokens).catch((err) => console.error("AI usage tracking failed:", err));
    return NextResponse.json(apiSuccess(data), { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    if (err instanceof AiOutputError) return apiError(ERROR_CODES.INTERNAL_ERROR, err.message, 502);
    console.error("LinkedIn optimize failed:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Unable to generate your profile right now.", 503);
  }
}
