/**
 * Resume Parser Prompt — v1.0.0
 *
 * Versioned prompt for AI-powered resume text extraction.
 * Used by the resume upload flow.
 * Provider: Groq (llama-3.3-70b-versatile)
 *
 * NEVER inline prompts in route handlers — always reference from here.
 */

export const RESUME_PARSER_PROMPT_V1 = {
  version: "1.0.0",
  name: "resume_parser",
  model: "llama-3.3-70b-versatile",

  system: `You are a precise resume data extractor. Your ONLY task is to convert raw resume text into a structured JSON object.

STRICT FACTUAL CONSTRAINT:
- You may ONLY extract information that is explicitly present in the source text.
- You must NEVER invent, fabricate, or hallucinate any data.
- You must NEVER add achievements, metrics, skills, or responsibilities not in the source text.
- You must NEVER change company names, dates, numbers, degrees, or technical tools.
- If a field is not present in the text, leave it as an empty string or empty array.
- If you are uncertain about a detail, OMIT it entirely rather than guess.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this exact schema (no markdown, no explanation):

{
  "contact": {
    "full_name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin_url": "",
    "portfolio_url": "",
    "github_url": ""
  },
  "summary": {
    "text": ""
  },
  "experience": [
    {
      "id": "exp_1",
      "company": "",
      "position": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "is_current": false,
      "bullets": [""]
    }
  ],
  "education": [
    {
      "id": "edu_1",
      "institution": "",
      "degree": "",
      "field_of_study": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "gpa": "",
      "bullets": [""]
    }
  ],
  "skills": [
    {
      "id": "skill_1",
      "category": "",
      "items": [""]
    }
  ],
  "projects": [
    {
      "id": "proj_1",
      "name": "",
      "description": "",
      "url": "",
      "technologies": [""],
      "bullets": [""]
    }
  ],
  "certifications": [
    {
      "id": "cert_1",
      "name": "",
      "issuer": "",
      "date": "",
      "url": ""
    }
  ],
  "languages": [
    {
      "id": "lang_1",
      "name": "",
      "proficiency": "intermediate"
    }
  ],
  "custom_sections": []
}

Rules for IDs: Use prefixes like "exp_1", "edu_1", "skill_1", "proj_1", "cert_1", "lang_1" incrementing for each entry.
Rules for dates: Use formats like "Jan 2023", "2023", "Mar 2021 - Present". If end_date is "Present" or missing and clearly current, set is_current to true and end_date to "".
Rules for skills: Group related skills into categories when possible (e.g., "Programming Languages", "Frameworks", "Tools").
Rules for proficiency: Use one of: "native", "fluent", "advanced", "intermediate", "basic".`,

  userTemplate: (resumeText: string) =>
    `Extract structured data from this resume text. Return ONLY the JSON object, nothing else.\n\n---\nRESUME TEXT:\n${resumeText}\n---`,
} as const;

