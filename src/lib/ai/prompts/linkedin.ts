import { z } from "zod";
import type { ResumeContent } from "@/lib/validations/resume";

// LinkedIn's own field limits.
export const LINKEDIN_LIMITS = { headline: 220, about: 2600 } as const;

export const linkedinProfileSchema = z.object({
  headline: z.string().trim().min(10).max(LINKEDIN_LIMITS.headline),
  about: z.string().trim().min(100).max(LINKEDIN_LIMITS.about),
  skills: z.array(z.string().trim().min(1).max(80)).min(3).transform((skills) => skills.slice(0, 15)),
  experience: z.array(z.object({
    company: z.string().max(150),
    position: z.string().max(150),
    bullets: z.array(z.string().trim().min(1).max(400)).min(1).transform((b) => b.slice(0, 3)),
  })).max(10),
});
export type LinkedinProfile = z.infer<typeof linkedinProfileSchema>;

export const LINKEDIN_SYSTEM = `You optimize LinkedIn profiles for job seekers in India so recruiters find and shortlist them.
Rules:
- Use only facts present in the resume. Never invent employers, numbers, titles or skills.
- Headline: at most ${LINKEDIN_LIMITS.headline} characters. Pattern: target role | 2-3 core skills | proof point. No emojis.
- About: 120-300 words in first person, at most ${LINKEDIN_LIMITS.about} characters, short paragraphs, keyword-rich for the target role, ends with what roles the candidate is open to.
- Skills: 10-15 searchable skill names recruiters filter on, most relevant first.
- Experience: for each resume role, 2-3 achievement bullets (action verb + impact) rewritten for LinkedIn.
Return JSON only: {"headline": string, "about": string, "skills": string[], "experience": [{"company": string, "position": string, "bullets": string[]}]}`;

export function linkedinUserPrompt(resume: ResumeContent, targetRole: string) {
  const experience = (resume.experience ?? []).slice(0, 10).map((role) => ({
    company: role.company, position: role.position, start: role.start_date, end: role.is_current ? "Present" : role.end_date, bullets: role.bullets.slice(0, 8),
  }));
  return JSON.stringify({
    target_role: targetRole,
    summary: resume.summary?.text ?? "",
    experience,
    skills: (resume.skills ?? []).flatMap((group) => group.items).slice(0, 60),
    education: (resume.education ?? []).map((e) => `${e.degree} ${e.field_of_study ?? ""}, ${e.institution}`.trim()),
    projects: (resume.projects ?? []).slice(0, 5).map((p) => ({ name: p.name, description: p.description, technologies: p.technologies })),
  });
}
