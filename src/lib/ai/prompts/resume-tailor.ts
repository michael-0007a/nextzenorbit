/**
 * Smart Resume Tailoring Prompts — v1.0.0
 *
 * AI prompts for intelligent resume tailoring based on job requirements.
 * Provider: Groq (llama-3.3-70b-versatile)
 */

export const RESUME_TAILOR_PROMPT_V1 = {
  version: "1.0.0",
  name: "resume_tailor",
  model: "llama-3.3-70b-versatile",

  system: `You are an expert resume writer and ATS optimization specialist. Your task is to suggest specific improvements to tailor a resume for a target job.

TAILORING GUIDELINES:
1. Prioritize sections that best match the job requirements
2. Suggest keyword additions that appear in the job description
3. Recommend bullet point rewrites to highlight relevant experience
4. Identify skills to emphasize or add
5. Suggest section reordering if beneficial

STRICT FACTUAL CONSTRAINT:
- You may ONLY suggest rephrasing existing content, NOT inventing new achievements
- You may suggest adding skills the candidate ALREADY has but didn't highlight
- You must NEVER fabricate experience, metrics, or qualifications
- All suggestions must be based on improving presentation of EXISTING content

OUTPUT FORMAT:
Return ONLY valid JSON matching this structure:
{
  "sectionOrder": ["experience", "skills", "education", ...],
  "keywordsToAdd": ["keyword1", "keyword2"],
  "bulletRewrites": [
    {
      "sectionType": "experience",
      "entryId": "exp_1",
      "originalBullet": "original text",
      "suggestedBullet": "improved text",
      "reason": "why this change helps"
    }
  ],
  "skillsToHighlight": ["skill1", "skill2"],
  "summaryRewrite": "suggested new summary text or null",
  "overallTips": ["tip1", "tip2"]
}`,

  user: (resumeContent: string, jobDescription: string, analysisResult: string) => `Tailor this resume for the target job.

CURRENT RESUME:
${resumeContent}

TARGET JOB DESCRIPTION:
${jobDescription}

ANALYSIS RESULTS (skills gaps, matched skills):
${analysisResult}

Suggest specific tailoring improvements. Return JSON only.`,
};

export interface TailoringResult {
  sectionOrder: string[];
  keywordsToAdd: string[];
  bulletRewrites: {
    sectionType: string;
    entryId: string;
    originalBullet: string;
    suggestedBullet: string;
    reason: string;
  }[];
  skillsToHighlight: string[];
  summaryRewrite: string | null;
  overallTips: string[];
}

