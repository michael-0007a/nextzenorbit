/**
 * Job Analyzer Prompts — v1.0.0
 *
 * AI prompts for job description analysis and keyword extraction.
 * Provider: Groq (llama-3.3-70b-versatile)
 */

export interface AnalysisResult {
  overallScore: number;
  breakdown: {
    technicalSkills: { score: number; weight: number };
    experience: { score: number; weight: number };
    education: { score: number; weight: number };
    softSkills: { score: number; weight: number };
  };
  keywords: {
    required: KeywordMatch[];
    preferred: KeywordMatch[];
    bonus: KeywordMatch[];
  };
  gaps: GapAnalysis[];
  suggestions: string[];
  jobSummary: {
    title: string;
    company: string;
    seniorityLevel: string;
    employmentType: string;
    keyRequirements: string[];
  };
}

export interface KeywordMatch {
  keyword: string;
  category: "technical" | "soft" | "tool" | "certification" | "domain";
  found: boolean;
  importance: "required" | "preferred" | "bonus";
  resumeMatch?: string; // The matching text from resume if found
}

export interface GapAnalysis {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  suggestion: string;
}

export const JOB_ANALYZER_PROMPT_V2 = {
  version: "2.0.0",
  name: "job_analyzer_v2",
  model: "llama-3.3-70b-versatile",

  system: `You are an expert ATS (Applicant Tracking System) analyzer specializing in the Indian job market. Your task is to analyze how well a resume matches a job description.

ANALYSIS GUIDELINES:
1. Extract ALL keywords from the job description (technical skills, soft skills, tools, certifications)
2. Categorize keywords by importance: required, preferred, bonus
3. Match keywords against the resume content
4. Calculate scores for different areas: technical skills, experience, education, soft skills
5. Identify critical gaps that would likely screen out the candidate
6. Provide actionable suggestions to improve the match

SCORING RULES:
- Technical Skills (40% weight): Programming languages, frameworks, tools mentioned
- Experience (30% weight): Years of experience, relevant projects, achievements
- Education (15% weight): Degree requirements, certifications
- Soft Skills (15% weight): Communication, leadership, teamwork mentioned

KEYWORD MATCHING:
- Mark as "found" only if there's a clear match in the resume
- Consider variations (e.g., "React" matches "React.js", "ReactJS")
- Don't mark partial matches as found (e.g., "Java" doesn't match "JavaScript")

OUTPUT FORMAT:
Return ONLY valid JSON matching the AnalysisResult interface. No markdown, no explanation.`,

  user: (resumeContent: string, jobDescription: string) => `Analyze this resume against the job description.

RESUME CONTENT:
${resumeContent}

JOB DESCRIPTION:
${jobDescription}

Return a detailed JSON analysis with:
1. overallScore (0-100)
2. breakdown with scores for technicalSkills, experience, education, softSkills (each with score 0-100 and weight)
3. keywords object with required/preferred/bonus arrays of KeywordMatch objects
4. gaps array of critical missing skills with suggestions
5. suggestions array of 3-5 actionable improvements
6. jobSummary with extracted job details

Return ONLY valid JSON.`,
};

export const JD_EXTRACTOR_PROMPT = {
  version: "1.0.0",
  name: "jd_extractor",
  model: "llama-3.3-70b-versatile",

  system: `You are a job description parser. Extract structured information from raw job posting text.

Extract:
- Job title
- Company name (if mentioned)
- Location
- Employment type (full-time, part-time, contract)
- Seniority level (entry, mid, senior, lead, manager)
- Required skills (must-have)
- Preferred skills (nice-to-have)
- Education requirements
- Experience requirements (years)
- Key responsibilities
- Benefits (if mentioned)

OUTPUT: Return clean JSON only.`,

  user: (rawText: string) => `Parse this job posting and extract structured data:

${rawText}

Return JSON with: title, company, location, employmentType, seniorityLevel, requiredSkills[], preferredSkills[], education, experienceYears, responsibilities[], benefits[]`,
};

export const KEYWORD_CATEGORIES = {
  technical: [
    // Programming Languages
    "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin",
    // Frontend
    "react", "vue", "angular", "next.js", "nuxt", "svelte", "html", "css", "sass", "tailwind",
    // Backend
    "node.js", "express", "fastify", "django", "flask", "spring", "rails", ".net",
    // Databases
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb", "supabase", "firebase",
    // Cloud
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "ci/cd",
    // Mobile
    "react native", "flutter", "ios", "android",
  ],
  soft: [
    "communication", "leadership", "teamwork", "problem-solving", "analytical", "creative",
    "adaptable", "organized", "detail-oriented", "collaborative", "mentoring",
  ],
  tools: [
    "git", "jira", "confluence", "slack", "figma", "postman", "vs code", "intellij",
  ],
  certifications: [
    "aws certified", "azure certified", "gcp certified", "pmp", "scrum master", "cissp",
  ],
};

