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
import Groq from "groq-sdk";
import { z } from "zod";
import {
  JD_OPTIMIZER_PROMPT_V1,
  type EmbellishmentLevel,
} from "@/lib/ai/prompts/resume-improver";
import { apiError, ERROR_CODES } from "@/types/api";
import type { ResumeRow } from "@/types/database";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const adminOptimizeSchema = z.object({
  userId: z.string().uuid(),
  resumeId: z.string().uuid(),
  jobDescription: z.string().min(10, "Job description too short").max(15000),
  embellishmentLevel: z.enum(["conservative", "moderate", "aggressive"]).default("moderate"),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

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

    const { userId, resumeId, jobDescription, embellishmentLevel } = parsed.data;

    const admin = createAdminClient();

    // Fetch resume (must belong to the target user)
    const { data: resume, error: resumeError } = await admin
      .from("resumes")
      .select("id, user_id, content, template_id")
      .eq("id", resumeId)
      .eq("user_id", userId)
      .maybeSingle();

    if (resumeError || !resume) {
      return apiError(ERROR_CODES.NOT_FOUND, "Resume not found.", 404);
    }

    const typedResume = resume as ResumeRow;

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
      console.error("Failed to parse admin optimization response:", responseText.slice(0, 1000));
      console.error("Parse error:", parseError);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to parse AI response.", 500);
    }

    // Validate structure
    if (!result.resumeContent || !result.resumeContent.contact) {
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Invalid response structure.", 500);
    }

    // Return optimized content WITHOUT mutating the original resume
    return NextResponse.json({
      success: true,
      data: {
        content: result.resumeContent,
        matchScore: result.matchScore,
        changesApplied: result.changesApplied,
        keywordsIncorporated: result.keywordsIncorporated || [],
        keywordsMissing: result.keywordsMissing || [],
        embellishmentLevel,
        tokensUsed: completion.usage?.total_tokens || 0,
      },
    });
  } catch (err) {
    console.error("Admin resume optimize error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Optimization failed.", 500);
  }
}
