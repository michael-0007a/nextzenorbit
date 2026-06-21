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
import Groq from "groq-sdk";
import { z } from "zod";
import {
  JD_OPTIMIZER_PROMPT_V1,
  type EmbellishmentLevel,
} from "@/lib/ai/prompts/resume-improver";
import { apiError, ERROR_CODES } from "@/types/api";
import type { ResumeRow } from "@/types/database";
import { checkAiTokenUsage } from "@/lib/subscription-server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const optimizeRequestSchema = z.object({
  jobDescription: z.string().min(50, "Job description too short").max(15000),
  embellishmentLevel: z.enum(["conservative", "moderate", "aggressive"]),
  userAcknowledged: z.boolean().optional(), // Required for aggressive mode
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
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

    const { jobDescription, embellishmentLevel, userAcknowledged } = parsed.data;

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

    const completion = await groq.chat.completions.create({
      model: JD_OPTIMIZER_PROMPT_V1.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: embellishmentLevel === "aggressive" ? 0.8 : embellishmentLevel === "moderate" ? 0.6 : 0.4,
      max_tokens: 6000,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
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
      const cleaned = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Find the outermost JSON object by tracking brace depth
      let depth = 0;
      let startIdx = -1;
      let endIdx = -1;

      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === "{") {
          if (depth === 0) startIdx = i;
          depth++;
        } else if (cleaned[i] === "}") {
          depth--;
          if (depth === 0 && startIdx !== -1) {
            endIdx = i + 1;
            break;
          }
        }
      }

      if (startIdx === -1 || endIdx === -1) {
        throw new Error("No JSON object found");
      }

      const jsonStr = cleaned.slice(startIdx, endIdx);
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse optimization response:", responseText.slice(0, 1000));
      console.error("Parse error:", parseError);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to parse AI response.", 500);
    }

    // Validate structure
    if (!result.resumeContent || !result.resumeContent.contact) {
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Invalid response structure.", 500);
    }

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
    await trackAIUsage(admin, user.id, completion.usage?.total_tokens || 0);

    return NextResponse.json({
      success: true,
      data: {
        content: result.resumeContent,
        matchScore: result.matchScore,
        changesApplied: result.changesApplied,
        keywordsIncorporated: result.keywordsIncorporated || [],
        keywordsMissing: result.keywordsMissing || [],
        versionCreated: backupVersionNumber + 1,
        embellishmentLevel,
        tokensUsed: completion.usage?.total_tokens || 0,
      },
    });
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
