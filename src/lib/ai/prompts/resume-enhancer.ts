/**
 * AI Bullet Rewriter Prompt — v1.0.0
 *
 * Optimizes resume bullet points for impact and ATS compatibility.
 * Provider: Groq (llama-3.3-70b-versatile)
 */

export const BULLET_REWRITER_PROMPT_V1 = {
  version: "1.0.0",
  name: "bullet_rewriter",
  model: "llama-3.3-70b-versatile",

  system: `You are a resume writer who improves bullet points to be clearer and more professional while sounding natural and human.

REWRITING RULES:
1. Start with a clear ACTION VERB (Built, Developed, Led, Created, Designed, Implemented, etc.)
2. Describe what was done and why it mattered
3. Keep bullets concise: 1-2 lines maximum
4. Use plain, direct language — not corporate buzzwords

CRITICAL CONSTRAINTS:
- NEVER add percentages, dollar amounts, or user counts not in the original
- NEVER use AI-sounding words like "Spearheaded", "Orchestrated", "Leveraged", "Pioneered"
- If the original lacks metrics, keep it qualitative — don't invent numbers
- Preserve the original meaning while improving clarity
- Write like a human, not a robot

OUTPUT FORMAT:
Return ONLY a JSON object with the rewritten bullets:
{
  "bullets": ["rewritten bullet 1", "rewritten bullet 2", ...]
}`,

  user: (bullets: string[], context?: { jobTitle?: string; company?: string; targetRole?: string }) => {
    let prompt = `Rewrite these resume bullet points to be more impactful and ATS-friendly:\n\n`;

    if (context?.jobTitle) {
      prompt += `Current/Past Role: ${context.jobTitle}\n`;
    }
    if (context?.company) {
      prompt += `Company: ${context.company}\n`;
    }
    if (context?.targetRole) {
      prompt += `Target Role: ${context.targetRole}\n`;
    }

    prompt += `\nOriginal Bullets:\n`;
    bullets.forEach((bullet, i) => {
      prompt += `${i + 1}. ${bullet}\n`;
    });

    prompt += `\nRewrite each bullet to be more impactful. Return JSON only.`;

    return prompt;
  },
};

/**
 * Cover Letter Generator Prompt — v1.0.0
 *
 * Generates personalized cover letters based on resume and job description.
 * Provider: Groq (llama-3.3-70b-versatile)
 */
export const COVER_LETTER_PROMPT_V1 = {
  version: "1.0.0",
  name: "cover_letter_generator",
  model: "llama-3.3-70b-versatile",

  system: `You are an expert cover letter writer who creates compelling, personalized cover letters for the Indian job market.

COVER LETTER STRUCTURE:
1. Opening Paragraph (2-3 sentences): Hook with enthusiasm for the role/company, mention how you found the position
2. Body Paragraph 1 (3-4 sentences): Your most relevant experience that matches their needs
3. Body Paragraph 2 (3-4 sentences): Additional skills/achievements that add value
4. Closing Paragraph (2-3 sentences): Call to action, gratitude, availability

WRITING GUIDELINES:
- Professional but warm tone — not robotic
- Show genuine interest in the specific company
- Connect YOUR experience to THEIR requirements
- Include 2-3 specific achievements with metrics from the resume
- Address the hiring manager by name if provided
- Keep under 350 words
- Avoid clichés like "I am writing to apply for..."

STRICT FACTUAL CONSTRAINT:
- Use ONLY information from the provided resume
- Reference ONLY requirements from the job description
- NEVER invent skills, achievements, or experiences
- NEVER claim knowledge of tools not mentioned in the resume

OUTPUT FORMAT:
Return ONLY the cover letter text, no JSON, no explanation.`,

  user: (params: {
    resumeContent: {
      contact: { full_name: string };
      summary?: { text: string };
      experience?: Array<{ position: string; company: string; bullets: string[] }>;
      skills?: Array<{ category?: string; items: string[] }>;
    };
    jobDescription: string;
    companyName: string;
    jobTitle: string;
    hiringManager?: string;
  }) => {
    const { resumeContent, jobDescription, companyName, jobTitle, hiringManager } = params;

    // Extract key info from resume
    const name = resumeContent.contact.full_name;
    const summary = resumeContent.summary?.text || "";
    const recentExp = resumeContent.experience?.[0];
    const skills = resumeContent.skills?.flatMap(s => s.items).slice(0, 10).join(", ") || "";

    return `Generate a cover letter for:

APPLICANT: ${name}
APPLYING FOR: ${jobTitle} at ${companyName}
${hiringManager ? `HIRING MANAGER: ${hiringManager}` : ""}

APPLICANT'S BACKGROUND:
${summary}
${recentExp ? `Most Recent Role: ${recentExp.position} at ${recentExp.company}` : ""}
${recentExp?.bullets?.slice(0, 3).map(b => `- ${b}`).join("\n") || ""}
Key Skills: ${skills}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

Write a compelling cover letter that connects this applicant's experience to this role.`;
  },
};

/**
 * Summary Generator Prompt — v1.0.0
 *
 * Generates or improves professional summary sections.
 */
export const SUMMARY_GENERATOR_PROMPT_V1 = {
  version: "1.0.0",
  name: "summary_generator",
  model: "llama-3.3-70b-versatile",

  system: `You are an expert resume writer. Generate a compelling professional summary (3-4 sentences) based on the candidate's experience.

SUMMARY GUIDELINES:
- Start with years of experience and professional title
- Highlight 2-3 key areas of expertise
- Include a notable achievement or impact
- End with value proposition or career goal
- Keep under 500 characters
- Use confident, professional tone

STRICT CONSTRAINT: Use ONLY information from the provided resume data.

OUTPUT FORMAT: Return ONLY the summary text, no JSON.`,

  user: (params: {
    experience?: Array<{ position: string; company: string; bullets: string[] }>;
    skills?: Array<{ category?: string; items: string[] }>;
    education?: Array<{ degree: string; institution: string }>;
    targetRole?: string;
  }) => {
    const { experience, skills, education, targetRole } = params;

    const expYears = experience?.length ? Math.min(experience.length * 2, 15) : 0;
    const latestRole = experience?.[0]?.position || "";
    const topSkills = skills?.flatMap(s => s.items).slice(0, 8).join(", ") || "";
    const highestEd = education?.[0];

    return `Generate a professional summary for:

Experience: ~${expYears} years
Current/Latest Role: ${latestRole}
Key Skills: ${topSkills}
Education: ${highestEd ? `${highestEd.degree} from ${highestEd.institution}` : "Not specified"}
${targetRole ? `Target Role: ${targetRole}` : ""}

Key Achievements:
${experience?.[0]?.bullets?.slice(0, 2).map(b => `- ${b}`).join("\n") || "None provided"}

Write a compelling 3-4 sentence professional summary.`;
  },
};

