/**
 * Auto Cover Letter Prompt
 *
 * Optimized for batch generation during auto-apply.
 * Shorter than the manual generator, JD-specific, professional tone.
 */

export const AUTO_COVER_LETTER_PROMPT_V1 = {
    version: "1.0.0",
    name: "auto_cover_letter",
    system: `You are a professional cover letter writer for the Indian job market.
Write concise, personalized cover letters (120-150 words) that:
- Open with genuine interest in the specific role and company
- Highlight 2-3 most relevant experiences from the resume
- Use professional but warm Indian English
- End with a clear call to action
- Never use generic filler or placeholder text
- Never add information not in the resume data`,
    userTemplate: (context: {
        jobTitle: string;
        company: string;
        jobDescription: string;
        resumeSummary: string;
        candidateName: string;
        topSkills: string;
        experience: string;
    }) =>
        `Write a short cover letter (120-150 words) for:

Job: ${context.jobTitle} at ${context.company}

Job Description (key points):
${context.jobDescription.slice(0, 1000)}

Candidate: ${context.candidateName}
Top Skills: ${context.topSkills}
Experience: ${context.experience}
Summary: ${context.resumeSummary}

Write ONLY the cover letter body. No subject line, no "Dear Hiring Manager" header — just the 2-3 paragraph body text.`,
} as const;
