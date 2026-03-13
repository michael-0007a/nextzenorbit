/**
 * Cover Letter Generation API
 *
 * POST /api/cover-letter/generate
 *
 * Generates a personalized cover letter based on resume and JD.
 * Auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Groq from "groq-sdk";
import { z } from "zod";
import { COVER_LETTER_PROMPT_V1 } from "@/lib/ai/prompts/resume-enhancer";
import { resumeContentSchema } from "@/lib/validations/resume";
import { apiError, ERROR_CODES } from "@/types/api";
import type { ResumeRow } from "@/types/database";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Request schema
const generateCoverLetterSchema = z.object({
  resumeId: z.string().uuid(),
  jobDescription: z.string().min(50, "Job description too short").max(5000),
  companyName: z.string().min(1, "Company name required").max(200),
  jobTitle: z.string().min(1, "Job title required").max(200),
  hiringManager: z.string().max(100).optional(),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    // Parse request
    const body = await request.json();
    const parsed = generateCoverLetterSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid request.", 400, parsed.error.flatten());
    }

    const { resumeId, jobDescription, companyName, jobTitle, hiringManager } = parsed.data;

    // Fetch resume
    const admin = createAdminClient();
    const { data: resume, error } = await admin
      .from("resumes")
      .select("id, user_id, content")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !resume) {
      return apiError(ERROR_CODES.NOT_FOUND, "Resume not found.", 404);
    }

    const typedResume = resume as ResumeRow;

    // Parse resume content
    const contentResult = resumeContentSchema.safeParse(typedResume.content);
    if (!contentResult.success) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid resume content.", 400);
    }

    const resumeContent = contentResult.data;

    // Generate cover letter
    const prompt = COVER_LETTER_PROMPT_V1;

    const completion = await groq.chat.completions.create({
      model: prompt.model,
      messages: [
        { role: "system", content: prompt.system },
        {
          role: "user",
          content: prompt.user({
            resumeContent: {
              contact: resumeContent.contact,
              summary: resumeContent.summary,
              experience: resumeContent.experience,
              skills: resumeContent.skills,
            },
            jobDescription,
            companyName,
            jobTitle,
            hiringManager,
          }),
        },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const coverLetter = completion.choices[0]?.message?.content?.trim() || "";

    if (!coverLetter) {
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to generate cover letter.", 500);
    }

    // Track AI usage
    await trackAIUsage(admin, user.id, completion.usage?.total_tokens || 0);

    return NextResponse.json({
      success: true,
      data: {
        coverLetter,
        tokensUsed: completion.usage?.total_tokens || 0,
      },
    });
  } catch (err) {
    console.error("Cover letter generation error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to generate cover letter.", 500);
  }
}

// Helper to track AI usage
async function trackAIUsage(admin: ReturnType<typeof createAdminClient>, userId: string, tokens: number) {
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

