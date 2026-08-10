/**
 * Admin API: Generate Cover Letter
 *
 * POST /api/admin/cover-letters/generate
 *
 * Generates a tailored cover letter using a user's base resume and a job description.
 * Used exclusively by admins, bypassing subscription and token limits.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import Groq from "groq-sdk";
import { z } from "zod";
import { COVER_LETTER_PROMPT_V1 } from "@/lib/ai/prompts/resume-enhancer";
import { resumeContentSchema } from "@/lib/validations/resume";
import { apiError, ERROR_CODES } from "@/types/api";
import type { ResumeRow } from "@/types/database";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const adminGenerateSchema = z.object({
  userId: z.string().uuid(),
  resumeId: z.string().uuid(),
  jobDescription: z.string().min(10, "Job description too short").max(10000),
  companyName: z.string().min(1, "Company name required").max(200),
  jobTitle: z.string().min(1, "Job title required").max(200),
  hiringManager: z.string().max(100).optional(),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const body = await request.json();
    const parsed = adminGenerateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid request details.",
        400,
        parsed.error.flatten()
      );
    }

    const { userId, resumeId, jobDescription, companyName, jobTitle, hiringManager } = parsed.data;

    const admin = createAdminClient();

    // Fetch resume (must belong to the user)
    const { data: resume, error } = await admin
      .from("resumes")
      .select("id, user_id, content")
      .eq("id", resumeId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !resume) {
      return apiError(ERROR_CODES.NOT_FOUND, "Resume not found.", 404);
    }

    const typedResume = resume as ResumeRow;

    // Parse resume content
    const contentResult = resumeContentSchema.safeParse(typedResume.content);
    if (!contentResult.success) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid resume content structure.", 400);
    }

    const resumeContent = contentResult.data;

    // Call Groq to generate cover letter
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

    return NextResponse.json({
      success: true,
      data: {
        coverLetter,
        tokensUsed: completion.usage?.total_tokens || 0,
      },
    });
  } catch (err) {
    console.error("Admin Cover Letter generation error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to generate cover letter.", 500);
  }
}
