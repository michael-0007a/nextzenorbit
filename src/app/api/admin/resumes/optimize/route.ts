import { withStageStream } from "@/lib/ai/progress-stream";
import type { AiStage } from "@/lib/ai/progress";
import { isUnparsedUpload } from "@/lib/resume/text-fallback";
import { extractJson } from "@/lib/ai/extract-json";
import { createTimings } from '@/lib/performance';
import { fitGeneratedResume } from "@/lib/resume/fit-generated-resume";
import { targetPagesSchema, resumeLengthInstruction } from "@/lib/resume/generation-length";
import { createAIClient } from "@/lib/ai/model";
import { structureUploadedResume, UNPARSED_RESUME_MESSAGE } from "@/lib/ai/parsers/resume-parser";
/**
 * Admin API: Resume Optimization
 *
 * POST /api/admin/resumes/optimize
 *
 * Optimizes a user's resume for a specific job description.
 * Admin-only: bypasses subscription checks and does NOT mutate the user's original resume.
 * Returns optimized content for the admin to review and save separately.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import {
  JD_OPTIMIZER_PROMPT_V1,
  type EmbellishmentLevel,
} from "@/lib/ai/prompts/resume-improver";
import { apiError, ERROR_CODES } from "@/types/api";
import { parseExportContent, hasResumeBody } from "@/lib/resume/export-content";
import type { ResumeRow } from "@/types/database";

const groq = createAIClient();

const adminOptimizeSchema = z.object({
  resumeType: z.enum(["corporate", "c2c"]).optional(),
  userId: z.string().uuid(),
  resumeId: z.string().uuid(),
  targetPages: targetPagesSchema,
  templateId: z.string().max(50).optional(),
  jobDescription: z.string().min(10, "Job description too short").max(15000),
  embellishmentLevel: z.enum(["conservative", "moderate", "aggressive"]).default("moderate"),
});

// Writer + reviewer + fix + optional length pass share an 85s AI budget.
export const maxDuration=120;
// Streams stage progress to clients that ask for it (see withStageStream).
export function POST(request: NextRequest) { return withStageStream(request, onStage => handle(request, onStage)); }

async function handle(request: NextRequest, onStage: (stage: AiStage) => void): Promise<Response> {
  const timings=createTimings(),signal=AbortSignal.timeout(85_000);
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;
    const limited = await rateLimit("admin-resume-optimize", adminAuth.userId, 10, 60);
    if (limited) return limited;

    const body = await request.json();
    const parsed = adminOptimizeSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid request details.",
        400,
        parsed.error.flatten()
      );
    }

    const { userId, resumeId, jobDescription, embellishmentLevel, targetPages } = parsed.data;

    const admin = createAdminClient();

    // Fetch resume (must belong to the target user)
    const { data: resume, error: resumeError } = await admin
      .from("resumes")
      .select("id, user_id, content, template_id")
      .eq("id", resumeId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (resumeError || !resume) {
      return apiError(ERROR_CODES.NOT_FOUND, "Resume not found.", 404);
    }

    const typedResume = resume as ResumeRow;
    typedResume.content = {...typedResume.content, resume_type: parsed.data.resumeType || typedResume.content.resume_type || "corporate"};
    const requestedPages = targetPages === undefined ? typedResume.content.layout?.target_pages : targetPages;
    if (!hasResumeBody(typedResume.content)) return apiError(ERROR_CODES.VALIDATION_ERROR, "Choose or upload a populated base resume.", 422);
    if (isUnparsedUpload(typedResume.content)) onStage("parse");
    const structured = await timings.measure('parse',()=>structureUploadedResume(typedResume.content, signal));
    if (!structured) return apiError(ERROR_CODES.INTERNAL_ERROR, UNPARSED_RESUME_MESSAGE, 503);
    typedResume.content = structured;

    // Prepare content for AI
    const resumeString = JSON.stringify(typedResume.content, null, 2);

    // Call AI with appropriate embellishment level
    const systemPrompt = JD_OPTIMIZER_PROMPT_V1.getSystemPrompt(
      embellishmentLevel as EmbellishmentLevel
    );
    const userPrompt = JD_OPTIMIZER_PROMPT_V1.user(
      resumeString,
      jobDescription,
      embellishmentLevel as EmbellishmentLevel
    );

    onStage("write");
    const completion = await timings.measure('model',()=>groq.chat.completions.create({
      model: JD_OPTIMIZER_PROMPT_V1.model,
      messages: [
        { role: "system", content: systemPrompt + (typedResume.content.resume_type === "c2c" ? "\nC2C: Tailor ONLY the professional summary as detailed newline-separated bullets using source-supported facts. Preserve all other sections exactly. Do not condense history to meet page limits." : "\n\n" + resumeLengthInstruction(requestedPages)) },
        { role: "user", content: userPrompt },
      ],
      temperature: embellishmentLevel === "aggressive" ? 0.8 : embellishmentLevel === "moderate" ? 0.6 : 0.4,
      max_tokens: 24000,
      response_format: { type: "json_object" },
    },{signal}));

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText || completion.choices[0]?.finish_reason === "length") {
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Empty AI response.", 500);
    }

    // Parse response
    let result: {
      resumeContent: ResumeRow["content"];
      matchScore: number;
      changesApplied: string[];
      keywordsIncorporated?: string[];
      keywordsMissing?: string[];
    };

    try {
      result = extractJson(responseText) as typeof result;
    } catch (parseError) {
      console.error("Failed to parse admin optimization response:", responseText.slice(0, 1000));
      console.error("Parse error:", parseError);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to parse AI response.", 500);
    }

    // Validate structure
    if (typedResume.content.resume_type === "c2c") {
      const summary = result.resumeContent?.summary || (result as unknown as {summary?: {text?: string}}).summary;
      if (!summary?.text?.trim()) return apiError(ERROR_CODES.INTERNAL_ERROR, "AI returned an empty summary. Your source is unchanged.", 502);
      result.resumeContent = { ...typedResume.content, summary: { text: summary.text } };
      result.changesApplied = ["Tailored the professional summary; all other sections preserved."];
    }
    if (!result.resumeContent || !result.resumeContent.contact) {
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Invalid response structure.", 500);
    }

    const validatedContent = parseExportContent(result.resumeContent);
    if (!validatedContent.success || !hasResumeBody(validatedContent.data)) return apiError(ERROR_CODES.INTERNAL_ERROR, "AI returned invalid resume content. Please retry.", 502);

    const fitted = await timings.measure('revision',()=>fitGeneratedResume(groq, validatedContent.data, typedResume.content, requestedPages, parsed.data.templateId || typedResume.template_id,{signal,jobDescription,onStage}));

    // Return optimized content WITHOUT mutating the original resume
    return NextResponse.json({
      success: true,
      data: {
        content: fitted.content,
        pageCount: fitted.pageCount,
        layoutWarnings: fitted.layoutWarnings,
        matchScore: result.matchScore,
        changesApplied: result.changesApplied,
        keywordsIncorporated: result.keywordsIncorporated || [],
        keywordsMissing: result.keywordsMissing || [],
        embellishmentLevel,
        tokensUsed: (completion.usage?.total_tokens || 0) + fitted.tokensUsed,
      },
    },{headers:{...timings.headers(),"Cache-Control":"private, no-store"}});
  } catch (err) {
    console.error("Admin resume optimize error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Optimization failed.", 500);
  }
}
