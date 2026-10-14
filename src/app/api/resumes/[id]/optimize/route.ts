import { withStageStream } from "@/lib/ai/progress-stream";
import type { AiStage } from "@/lib/ai/progress";
import { isUnparsedUpload } from "@/lib/resume/text-fallback";
import { extractJson } from "@/lib/ai/extract-json";
import { createTimings } from '@/lib/performance';
import { fitGeneratedResume } from "@/lib/resume/fit-generated-resume";
import { parseExportContent } from "@/lib/resume/export-content";
import { targetPagesSchema, resumeLengthInstruction } from "@/lib/resume/generation-length";
import { createAIClient } from "@/lib/ai/model";
import { structureUploadedResume, UNPARSED_RESUME_MESSAGE } from "@/lib/ai/parsers/resume-parser";
/**
 * JD-Based Resume Optimization API
 *
 * POST /api/resumes/[id]/optimize
 *
 * Optimizes resume for a specific job description with adjustable embellishment levels:
 * - conservative: Only rephrase existing content
 * - moderate: Enhance and reasonably extrapolate
 * - aggressive: Maximum impact (user acknowledgment required)
 *
 * Creates a new version before applying changes.
 * Auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import {
  JD_OPTIMIZER_PROMPT_V1,
  type EmbellishmentLevel,
} from "@/lib/ai/prompts/resume-improver";
import { apiError, ERROR_CODES } from "@/types/api";
import type { ResumeRow } from "@/types/database";
import { checkAiTokenUsage } from "@/lib/subscription-server";

const groq = createAIClient();

const optimizeRequestSchema = z.object({
  targetPages: targetPagesSchema,
  jobDescription: z.string().min(50, "Job description too short").max(15000),
  embellishmentLevel: z.enum(["conservative", "moderate", "aggressive"]),
  userAcknowledged: z.boolean().optional(), // Required for aggressive mode
});

// Writer + reviewer + fix + optional length pass share an 85s AI budget.
export const maxDuration=120;
// Streams stage progress to clients that ask for it (see withStageStream).
export function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withStageStream(request, onStage => handle(request, context, onStage));
}

async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  onStage: (stage: AiStage) => void
): Promise<Response> {
  const timings=createTimings(),signal=AbortSignal.timeout(85_000);
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    // Check AI token limits
    const tokenCheck = await checkAiTokenUsage(user.id);
    if (!tokenCheck.allowed) {
      return apiError(
        ERROR_CODES.SUBSCRIPTION_REQUIRED,
        tokenCheck.error || "Monthly AI token limit reached. Please upgrade your plan.",
        403
      );
    }

    const body = await request.json();
    const parsed = optimizeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid request.",
        400,
        parsed.error.flatten()
      );
    }

    const { jobDescription, embellishmentLevel, userAcknowledged, targetPages } = parsed.data;

    // Require acknowledgment for aggressive mode
    if (embellishmentLevel === "aggressive" && !userAcknowledged) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "User acknowledgment required for maximum optimization mode.",
        400
      );
    }

    const admin = createAdminClient();

    // Fetch current resume
    const { data: resume, error: resumeError } = await admin
      .from("resumes")
      .select("id, user_id, title, content, template_id, version")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (resumeError || !resume) {
      return apiError(ERROR_CODES.NOT_FOUND, "Resume not found.", 404);
    }

    const typedResume = resume as ResumeRow;
    const requestedPages = targetPages === undefined ? typedResume.content.layout?.target_pages : targetPages;

    // Save current state as a version (backup)
    const { data: maxVersion } = await admin
      .from("resume_versions")
      .select("version_number")
      .eq("resume_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const backupVersionNumber = (maxVersion?.version_number || 0) + 1;

    await admin.from("resume_versions").insert({
      resume_id: id,
      user_id: user.id,
      version_number: backupVersionNumber,
      content: typedResume.content,
      title: typedResume.title,
      template_id: typedResume.template_id,
      change_summary: "Backup before JD optimization",
    });

    if (isUnparsedUpload(typedResume.content)) onStage("parse");
    const structured = await timings.measure("parse",()=>structureUploadedResume(typedResume.content, signal));
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
        { role: "system", content: systemPrompt + "\n\n" + (typedResume.content.resume_type === "c2c" ? "C2C: Rewrite only the professional summary as newline-separated detailed factual bullets. Preserve all other fields exactly; do not shorten history to fit pages." : resumeLengthInstruction(requestedPages)) },
        { role: "user", content: userPrompt },
      ],
      temperature: embellishmentLevel === "conservative" ? 0.3 : 0.5,
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
      console.error("Failed to parse optimization response:", responseText.slice(0, 1000));
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
    if (!validatedContent.success) return apiError(ERROR_CODES.INTERNAL_ERROR, "AI returned invalid resume content. Please retry.", 502);
    const fitted = await timings.measure('revision',()=>fitGeneratedResume(groq, validatedContent.data, typedResume.content, requestedPages, typedResume.template_id,{signal,jobDescription,onStage,level:embellishmentLevel}));
    result.resumeContent = fitted.content;

    // Update resume with optimized content
    const { error: updateError } = await admin
      .from("resumes")
      .update({
        content: result.resumeContent,
        version: backupVersionNumber + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update resume:", updateError.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to save optimized resume.", 500);
    }

    // Save optimized version
    const levelLabels = {
      conservative: "JD-tailored (factual)",
      moderate: "JD-optimized (enhanced)",
      aggressive: "JD-maximized (user verified)",
    };

    await admin.from("resume_versions").insert({
      resume_id: id,
      user_id: user.id,
      version_number: backupVersionNumber + 1,
      content: result.resumeContent,
      title: typedResume.title,
      template_id: typedResume.template_id,
      change_summary: levelLabels[embellishmentLevel],
    });

    // Track AI usage
    await trackAIUsage(admin, user.id, (completion.usage?.total_tokens || 0) + fitted.tokensUsed);

    return NextResponse.json({
      success: true,
      data: {
        content: result.resumeContent,
        pageCount: fitted.pageCount,
        layoutWarnings: fitted.layoutWarnings,
        matchScore: result.matchScore,
        changesApplied: result.changesApplied,
        keywordsIncorporated: result.keywordsIncorporated || [],
        keywordsMissing: result.keywordsMissing || [],
        versionCreated: backupVersionNumber + 1,
        embellishmentLevel,
        tokensUsed: (completion.usage?.total_tokens || 0) + fitted.tokensUsed,
      },
    },{headers:{...timings.headers(),"Cache-Control":"private, no-store"}});
  } catch (err) {
    console.error("Resume optimize error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Optimization failed.", 500);
  }
}

async function trackAIUsage(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  tokens: number
) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data: existing } = await admin
    .from("ai_usage")
    .select("id, tokens_used")
    .eq("user_id", userId)
    .gte("billing_period_start", periodStart.toISOString())
    .lte("billing_period_end", periodEnd.toISOString())
    .maybeSingle();

  if (existing) {
    await admin
      .from("ai_usage")
      .update({
        tokens_used: existing.tokens_used + tokens,
        last_used_at: now.toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await admin.from("ai_usage").insert({
      user_id: userId,
      billing_period_start: periodStart.toISOString(),
      billing_period_end: periodEnd.toISOString(),
      tokens_used: tokens,
      last_used_at: now.toISOString(),
    });
  }
}
