import { withStageStream } from "@/lib/ai/progress-stream";
import type { AiStage } from "@/lib/ai/progress";
import { isUnparsedUpload } from "@/lib/resume/text-fallback";
import { extractJson } from "@/lib/ai/extract-json";
import { createTimings } from '@/lib/performance';
import { fitGeneratedResume } from "@/lib/resume/fit-generated-resume";
import { targetPagesSchema, resumeLengthInstruction } from "@/lib/resume/generation-length";
import { parseExportContent } from "@/lib/resume/export-content";
import { createAIClient } from "@/lib/ai/model";
import { structureUploadedResume, UNPARSED_RESUME_MESSAGE } from "@/lib/ai/parsers/resume-parser";
/**
 * AI Resume Improvement API
 *
 * POST /api/resumes/[id]/improve
 *
 * Improves the entire resume for ATS optimization and professional impact.
 * Creates a new version before applying changes.
 * Auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RESUME_IMPROVER_PROMPT_V1 } from "@/lib/ai/prompts/resume-improver";
import { apiError, ERROR_CODES } from "@/types/api";
import type { ResumeRow } from "@/types/database";
import { checkAiTokenUsage } from "@/lib/subscription-server";

const groq = createAIClient();

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

    const requestBody = await request.text();
    const lengthResult = targetPagesSchema.safeParse(requestBody ? JSON.parse(requestBody).targetPages : undefined);
    if (!lengthResult.success) return apiError(ERROR_CODES.VALIDATION_ERROR, "Choose Auto or 1-10 pages.", 400);
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
    const requestedPages = lengthResult.data === undefined ? typedResume.content.layout?.target_pages : lengthResult.data;

    // Save current state as a version (backup before improvement)
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
      change_summary: "Backup before AI improvement",
    });

    if (isUnparsedUpload(typedResume.content)) onStage("parse");
    const structured = await timings.measure("parse",()=>structureUploadedResume(typedResume.content, signal));
    if (!structured) return apiError(ERROR_CODES.INTERNAL_ERROR, UNPARSED_RESUME_MESSAGE, 503);
    typedResume.content = structured;

    // Prepare resume content for AI
    const resumeString = JSON.stringify(typedResume.content, null, 2);

    // Call AI for improvement
    onStage("write");
    const completion = await timings.measure('model',()=>groq.chat.completions.create({
      model: RESUME_IMPROVER_PROMPT_V1.model,
      messages: [
        { role: "system", content: RESUME_IMPROVER_PROMPT_V1.system + "\n\n" + (typedResume.content.resume_type === "c2c" ? "C2C: Rewrite only the professional summary as newline-separated detailed factual bullets. Preserve all other fields exactly; do not shorten history to fit pages." : resumeLengthInstruction(requestedPages)) },
        { role: "user", content: RESUME_IMPROVER_PROMPT_V1.user(resumeString) },
      ],
      temperature: 0.6,
      max_tokens: 24000,
      response_format: { type: "json_object" },
    },{signal}));

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText || completion.choices[0]?.finish_reason === "length") {
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Empty AI response.", 500);
    }

    // Parse improved content
    let improvedContent: ResumeRow["content"];
    try {
      improvedContent = extractJson(responseText) as ResumeRow["content"];
    } catch {
      console.error("Failed to parse improved resume:", responseText.slice(0, 500));
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to parse AI response.", 500);
    }

    // Validate that the structure is correct (has required fields)
    if (typedResume.content.resume_type === "c2c") {
      if (!improvedContent.summary?.text?.trim()) return apiError(ERROR_CODES.INTERNAL_ERROR, "AI returned an empty summary. Your source is unchanged.", 502);
      improvedContent = { ...typedResume.content, summary: improvedContent.summary };
    }
    if (!improvedContent.contact) {
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Invalid resume structure from AI.", 500);
    }

    const validatedContent = parseExportContent(improvedContent);
    if (!validatedContent.success) return apiError(ERROR_CODES.INTERNAL_ERROR, "AI returned invalid resume content. Please retry.", 502);
    const fitted = await timings.measure('revision',()=>fitGeneratedResume(groq, validatedContent.data, typedResume.content, requestedPages, typedResume.template_id,{signal,onStage}));
    improvedContent = fitted.content;

    // Update resume with improved content
    const { error: updateError } = await admin
      .from("resumes")
      .update({
        content: improvedContent,
        version: backupVersionNumber + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update resume:", updateError.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to save improved resume.", 500);
    }

    // Save improved version
    await admin.from("resume_versions").insert({
      resume_id: id,
      user_id: user.id,
      version_number: backupVersionNumber + 1,
      content: improvedContent,
      title: typedResume.title,
      template_id: typedResume.template_id,
      change_summary: "AI-optimized for ATS",
    });

    // Track AI usage
    await trackAIUsage(admin, user.id, (completion.usage?.total_tokens || 0) + fitted.tokensUsed);

    return NextResponse.json({
      success: true,
      data: {
        content: improvedContent,
        pageCount: fitted.pageCount,
        layoutWarnings: fitted.layoutWarnings,
        versionCreated: backupVersionNumber + 1,
        tokensUsed: (completion.usage?.total_tokens || 0) + fitted.tokensUsed,
      },
    },{headers:{...timings.headers(),"Cache-Control":"private, no-store"}});
  } catch (err) {
    console.error("Resume improve error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Improvement failed.", 500);
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
