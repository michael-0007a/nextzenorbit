/**
 * AI Resume Enhancement API
 *
 * POST /api/resumes/[id]/enhance
 *
 * Enhances resume content using AI:
 * - Rewrite bullet points
 * - Generate/improve summary
 *
 * Auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Groq from "groq-sdk";
import { z } from "zod";
import { BULLET_REWRITER_PROMPT_V1, SUMMARY_GENERATOR_PROMPT_V1 } from "@/lib/ai/prompts/resume-enhancer";
import { apiError, ERROR_CODES } from "@/types/api";
import { checkAiTokenUsage } from "@/lib/subscription-server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Request schema
const enhanceRequestSchema = z.object({
  action: z.enum(["rewrite_bullets", "generate_summary"]),
  // For bullet rewriting
  bullets: z.array(z.string()).max(10).optional(),
  context: z.object({
    jobTitle: z.string().optional(),
    company: z.string().optional(),
    targetRole: z.string().optional(),
  }).optional(),
  // For summary generation
  experience: z.array(z.object({
    position: z.string(),
    company: z.string(),
    bullets: z.array(z.string()),
  })).optional(),
  skills: z.array(z.object({
    category: z.string().optional(),
    items: z.array(z.string()),
  })).optional(),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
  })).optional(),
  targetRole: z.string().optional(),
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

    // Verify resume belongs to user
    const admin = createAdminClient();
    const { data: resume } = await admin
      .from("resumes")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!resume) {
      return apiError(ERROR_CODES.NOT_FOUND, "Resume not found.", 404);
    }

    // Parse request
    const body = await request.json();
    const parsed = enhanceRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid request.", 400, parsed.error.flatten());
    }

    const { action } = parsed.data;

    if (action === "rewrite_bullets") {
      const { bullets, context } = parsed.data;

      if (!bullets || bullets.length === 0) {
        return apiError(ERROR_CODES.VALIDATION_ERROR, "No bullets provided.", 400);
      }

      const prompt = BULLET_REWRITER_PROMPT_V1;

      const completion = await groq.chat.completions.create({
        model: prompt.model,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user(bullets, context) },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const responseText = completion.choices[0]?.message?.content || "";

      // Parse JSON response
      try {
        // Extract JSON from response (handle potential markdown wrapping)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }

        const result = JSON.parse(jsonMatch[0]);

        // Track AI usage
        await trackAIUsage(admin, user.id, completion.usage?.total_tokens || 0);

        return NextResponse.json({
          success: true,
          data: {
            bullets: result.bullets || [],
            tokensUsed: completion.usage?.total_tokens || 0,
          },
        });
      } catch {
        console.error("Failed to parse AI response:", responseText);
        return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to parse AI response.", 500);
      }
    }

    if (action === "generate_summary") {
      const { experience, skills, education, targetRole } = parsed.data;

      const prompt = SUMMARY_GENERATOR_PROMPT_V1;

      const completion = await groq.chat.completions.create({
        model: prompt.model,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user({ experience, skills, education, targetRole }) },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const summary = completion.choices[0]?.message?.content?.trim() || "";

      // Track AI usage
      await trackAIUsage(admin, user.id, completion.usage?.total_tokens || 0);

      return NextResponse.json({
        success: true,
        data: {
          summary,
          tokensUsed: completion.usage?.total_tokens || 0,
        },
      });
    }

    return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid action.", 400);
  } catch (err) {
    console.error("AI enhance error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "AI enhancement failed.", 500);
  }
}

// Helper to track AI usage
async function trackAIUsage(admin: ReturnType<typeof createAdminClient>, userId: string, tokens: number) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get or create usage record
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

