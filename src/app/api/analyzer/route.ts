/**
 * Job Analyzer API Route — v2.0
 *
 * POST /api/analyzer
 * Accepts a job description and resume ID,
 * uses Groq (LLaMA 3.3 70B) to analyze the match with detailed breakdown.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Groq from "groq-sdk";
import { JOB_ANALYZER_PROMPT_V2, type AnalysisResult } from "@/lib/ai/prompts/job-analyzer";
import type { ResumeRow } from "@/types/database";
import { checkAiTokenUsage } from "@/lib/subscription-server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check AI token limits
    const tokenCheck = await checkAiTokenUsage(user.id);
    if (!tokenCheck.allowed) {
      return NextResponse.json(
        { error: tokenCheck.error || "Monthly AI token limit reached. Please upgrade your plan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { job_description, resume_id } = body;

    if (!job_description || !resume_id) {
      return NextResponse.json(
        { error: "Missing job_description or resume_id" },
        { status: 400 }
      );
    }

    // Fetch the resume using admin client
    const admin = createAdminClient();
    const { data: resume, error: resumeError } = await admin
      .from("resumes")
      .select("*")
      .eq("id", resume_id)
      .eq("user_id", user.id)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const resumeData = resume as ResumeRow;
    const resumeContent = resumeData.content;

    // Format resume content for analysis
    const resumeText = formatResumeForAnalysis(resumeContent);

    // Call Groq API with enhanced prompt
    const completion = await groq.chat.completions.create({
      model: JOB_ANALYZER_PROMPT_V2.model,
      messages: [
        { role: "system", content: JOB_ANALYZER_PROMPT_V2.system },
        { role: "user", content: JOB_ANALYZER_PROMPT_V2.user(resumeText, job_description) },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty AI response" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let parsed: AnalysisResult;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      // Fallback to basic analysis
      return NextResponse.json(createFallbackAnalysis(content));
    }

    // Track AI usage
    await trackAIUsage(admin, user.id, completion.usage?.total_tokens || 0);

    // Return enhanced analysis
    return NextResponse.json({
      success: true,
      data: {
        score: parsed.overallScore || 0,
        breakdown: parsed.breakdown || getDefaultBreakdown(),
        keywords: parsed.keywords || { required: [], preferred: [], bonus: [] },
        gaps: parsed.gaps || [],
        suggestions: parsed.suggestions || [],
        jobSummary: parsed.jobSummary || null,
        // Legacy fields for backward compatibility
        matchedSkills: extractMatchedSkills(parsed),
        missingSkills: extractMissingSkills(parsed),
      },
    });
  } catch (err) {
    console.error("Analyzer error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Format resume content for analysis
function formatResumeForAnalysis(content: ResumeRow["content"]): string {
  const sections: string[] = [];

  if (content.contact) {
    sections.push(`CONTACT: ${content.contact.full_name}, ${content.contact.email}`);
  }

  if (content.summary?.text) {
    sections.push(`SUMMARY: ${content.summary.text}`);
  }

  if (content.experience?.length) {
    const exp = content.experience.map(e =>
      `${e.position} at ${e.company} (${e.start_date} - ${e.is_current ? 'Present' : e.end_date})\n${e.bullets?.join('\n') || ''}`
    ).join('\n\n');
    sections.push(`EXPERIENCE:\n${exp}`);
  }

  if (content.education?.length) {
    const edu = content.education.map(e =>
      `${e.degree} from ${e.institution} ${e.field_of_study ? `in ${e.field_of_study}` : ''}`
    ).join('\n');
    sections.push(`EDUCATION:\n${edu}`);
  }

  if (content.skills?.length) {
    const skills = content.skills.map(s =>
      `${s.category ? `${s.category}: ` : ''}${s.items?.join(', ') || ''}`
    ).join('\n');
    sections.push(`SKILLS:\n${skills}`);
  }

  if (content.projects?.length) {
    const projects = content.projects.map(p =>
      `${p.name}: ${p.description || ''} (${p.technologies?.join(', ') || ''})`
    ).join('\n');
    sections.push(`PROJECTS:\n${projects}`);
  }

  if (content.certifications?.length) {
    const certs = content.certifications.map(c =>
      `${c.name} from ${c.issuer || 'Unknown'}`
    ).join('\n');
    sections.push(`CERTIFICATIONS:\n${certs}`);
  }

  return sections.join('\n\n');
}

// Extract matched skills from analysis result
function extractMatchedSkills(result: AnalysisResult): string[] {
  const matched: string[] = [];

  const allKeywords = [
    ...(result.keywords?.required || []),
    ...(result.keywords?.preferred || []),
    ...(result.keywords?.bonus || []),
  ];

  for (const kw of allKeywords) {
    if (kw.found) {
      matched.push(kw.keyword);
    }
  }

  return matched;
}

// Extract missing skills from analysis result
function extractMissingSkills(result: AnalysisResult): string[] {
  const missing: string[] = [];

  // Only include required and preferred skills that are missing
  const importantKeywords = [
    ...(result.keywords?.required || []),
    ...(result.keywords?.preferred || []),
  ];

  for (const kw of importantKeywords) {
    if (!kw.found) {
      missing.push(kw.keyword);
    }
  }

  return missing;
}

// Default breakdown structure
function getDefaultBreakdown() {
  return {
    technicalSkills: { score: 0, weight: 40 },
    experience: { score: 0, weight: 30 },
    education: { score: 0, weight: 15 },
    softSkills: { score: 0, weight: 15 },
  };
}

// Fallback analysis when parsing fails
function createFallbackAnalysis(rawContent: string) {
  // Try to extract basic info from the raw response
  const scoreMatch = rawContent.match(/(\d{1,3})%?/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;

  return {
    success: true,
    data: {
      score: Math.min(score, 100),
      breakdown: getDefaultBreakdown(),
      keywords: { required: [], preferred: [], bonus: [] },
      gaps: [],
      suggestions: ["Unable to parse detailed analysis. Please try again."],
      jobSummary: null,
      matchedSkills: [],
      missingSkills: [],
    },
  };
}

// Track AI usage
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

