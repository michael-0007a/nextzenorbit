/**
 * Resume Tailoring API
 *
 * POST /api/resumes/[id]/tailor
 *
 * Generates AI-powered suggestions to tailor a resume for a specific job.
 * Auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Groq from "groq-sdk";
import { z } from "zod";
import { RESUME_TAILOR_PROMPT_V1, type TailoringResult } from "@/lib/ai/prompts/resume-tailor";
import { apiError, ERROR_CODES } from "@/types/api";
import type { ResumeRow } from "@/types/database";
import { checkAiTokenUsage } from "@/lib/subscription-server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const tailorRequestSchema = z.object({
  jobDescription: z.string().min(100, "Job description too short").max(10000),
  matchedSkills: z.array(z.string()).optional(),
  missingSkills: z.array(z.string()).optional(),
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
    const parsed = tailorRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid request.", 400, parsed.error.flatten());
    }

    const { jobDescription, matchedSkills, missingSkills } = parsed.data;

    // Fetch resume
    const admin = createAdminClient();
    const { data: resume, error } = await admin
      .from("resumes")
      .select("id, user_id, title, content")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !resume) {
      return apiError(ERROR_CODES.NOT_FOUND, "Resume not found.", 404);
    }

    const typedResume = resume as ResumeRow;
    const resumeContent = formatResumeForTailoring(typedResume.content);

    // Build analysis context
    const analysisContext = `
Matched Skills: ${matchedSkills?.join(", ") || "None provided"}
Missing/Gap Skills: ${missingSkills?.join(", ") || "None provided"}
`;

    // Call AI
    const completion = await groq.chat.completions.create({
      model: RESUME_TAILOR_PROMPT_V1.model,
      messages: [
        { role: "system", content: RESUME_TAILOR_PROMPT_V1.system },
        { role: "user", content: RESUME_TAILOR_PROMPT_V1.user(resumeContent, jobDescription, analysisContext) },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Empty AI response.", 500);
    }

    // Parse response
    let result: TailoringResult;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse tailoring response:", content);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to parse AI response.", 500);
    }

    // Track AI usage
    await trackAIUsage(admin, user.id, completion.usage?.total_tokens || 0);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Tailor error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Tailoring failed.", 500);
  }
}

function formatResumeForTailoring(content: ResumeRow["content"]): string {
  const sections: string[] = [];

  if (content.summary?.text) {
    sections.push(`SUMMARY: ${content.summary.text}`);
  }

  if (content.experience?.length) {
    const exp = content.experience.map(e =>
      `[${e.id}] ${e.position} at ${e.company}\n${e.bullets?.map((b) => `  - ${b}`).join("\n") || ""}`
    ).join("\n\n");
    sections.push(`EXPERIENCE:\n${exp}`);
  }

  if (content.skills?.length) {
    const skills = content.skills.map(s =>
      `[${s.id}] ${s.category || "General"}: ${s.items?.join(", ") || ""}`
    ).join("\n");
    sections.push(`SKILLS:\n${skills}`);
  }

  if (content.education?.length) {
    const edu = content.education.map(e =>
      `[${e.id}] ${e.degree} from ${e.institution}`
    ).join("\n");
    sections.push(`EDUCATION:\n${edu}`);
  }

  if (content.projects?.length) {
    const projects = content.projects.map(p =>
      `[${p.id}] ${p.name}: ${p.description || ""}`
    ).join("\n");
    sections.push(`PROJECTS:\n${projects}`);
  }

  return sections.join("\n\n");
}

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

