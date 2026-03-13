/**
 * Resume Parser — AI-Powered Resume Text Extraction
 *
 * Extracts text from PDF/DOCX, sends to Groq (llama-3.3-70b-versatile),
 * returns validated ResumeContent.
 *
 * On parse failure: returns empty skeleton for manual entry.
 * Server-side only.
 */

import Groq from "groq-sdk";
import mammoth from "mammoth";
import { extractText as extractPdfText } from "unpdf";
import {
  resumeContentSchema,
  createEmptyResumeContent,
  type ResumeContent,
} from "@/lib/validations/resume";
import { RESUME_PARSER_PROMPT_V1 } from "@/lib/ai/prompts/resume-parser";

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  }
  return _groq;
}

// ── Text Extraction ──

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(buffer);
    const { text } = await extractPdfText(uint8Array);

    // unpdf returns an array of strings (one per page) or sometimes a single string
    let fullText: string;
    if (Array.isArray(text)) {
      fullText = text.join("\n");
    } else if (typeof text === "string") {
      fullText = text;
    } else {
      fullText = String(text || "");
    }

    const trimmed = fullText.trim();
    if (!trimmed) {
      console.warn("PDF extraction returned empty text - file may be image-based");
    }
    return trimmed;
  } catch (error) {
    console.error("PDF extraction error:", error);
    // Return empty string instead of throwing - let the caller handle it
    return "";
  }
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    console.error("DOCX extraction error:", error);
    return "";
  }
}

export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    switch (mimeType) {
      case "application/pdf":
        return await extractTextFromPDF(buffer);
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return await extractTextFromDOCX(buffer);
      default:
        console.warn(`Unsupported file type: ${mimeType}`);
        return "";
    }
  } catch (error) {
    console.error("Text extraction failed:", error);
    return "";
  }
}

// ── AI Parsing ──

export interface ParseResult {
  content: ResumeContent;
  rawText: string;
  tokensUsed: number;
  parsedByAI: boolean;
}

export async function parseResumeWithAI(
  resumeText: string
): Promise<ParseResult> {
  // Guard: if text is too short, skip AI and return skeleton
  if (resumeText.length < 50) {
    return {
      content: createEmptyResumeContent(),
      rawText: resumeText,
      tokensUsed: 0,
      parsedByAI: false,
    };
  }

  // Truncate very long resumes to avoid token limits (max ~8K chars)
  const truncated = resumeText.slice(0, 8000);

  try {
    const completion = await getGroq().chat.completions.create({
      model: RESUME_PARSER_PROMPT_V1.model,
      messages: [
        {
          role: "system",
          content: RESUME_PARSER_PROMPT_V1.system,
        },
        {
          role: "user",
          content: RESUME_PARSER_PROMPT_V1.userTemplate(truncated),
        },
      ],
      temperature: 0.1, // Low temp for factual extraction
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const rawOutput = completion.choices[0]?.message?.content;
    const tokensUsed = completion.usage?.total_tokens ?? 0;

    if (!rawOutput) {
      console.error("AI parser returned empty response");
      return {
        content: createEmptyResumeContent(),
        rawText: resumeText,
        tokensUsed,
        parsedByAI: false,
      };
    }

    // Parse + normalize the AI output
    const parsed = JSON.parse(rawOutput);
    const normalized = normalizeAIOutput(parsed);

    // Validate with lenient schema
    const validated = resumeContentSchema.safeParse(normalized);

    if (!validated.success) {
      console.error("AI output failed validation:", validated.error.flatten());
      // Still try to use what we can - merge with empty content
      const partialContent = createEmptyResumeContent();
      if (parsed.contact) {
        partialContent.contact = { ...partialContent.contact, ...parsed.contact };
      }
      if (parsed.summary?.text) {
        partialContent.summary = { text: parsed.summary.text };
      }
      return {
        content: partialContent,
        rawText: resumeText,
        tokensUsed,
        parsedByAI: true, // Partially parsed
      };
    }

    return {
      content: validated.data,
      rawText: resumeText,
      tokensUsed,
      parsedByAI: true,
    };
  } catch (error) {
    console.error("AI parser error:", error);
    return {
      content: createEmptyResumeContent(),
      rawText: resumeText,
      tokensUsed: 0,
      parsedByAI: false,
    };
  }
}

// Normalize AI output to ensure all arrays have IDs and required fields
function normalizeAIOutput(parsed: Record<string, unknown>): Record<string, unknown> {
  const generateId = () => crypto.randomUUID();

  // Helper to normalize URLs - AI may return partial URLs
  const normalizeUrl = (url: unknown): string => {
    if (!url || typeof url !== "string") return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    // Already a valid URL
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    // Add https:// to partial URLs like "linkedin.com/in/user"
    if (trimmed.includes(".")) return `https://${trimmed}`;
    return "";
  };

  // Helper to ensure array items have IDs
  const ensureIds = (arr: unknown[] | undefined, defaults: Record<string, unknown> = {}) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((item) => {
      if (typeof item !== "object" || item === null) return { id: generateId(), ...defaults };
      const obj = item as Record<string, unknown>;
      return {
        id: obj.id || generateId(),
        ...defaults,
        ...obj,
      };
    });
  };

  // Extract contact and normalize URLs
  const rawContact = typeof parsed.contact === "object" && parsed.contact !== null
    ? parsed.contact as Record<string, unknown>
    : {};

  return {
    contact: {
      full_name: rawContact.full_name || "",
      email: rawContact.email || "",
      phone: rawContact.phone || "",
      location: rawContact.location || "",
      linkedin_url: normalizeUrl(rawContact.linkedin_url),
      portfolio_url: normalizeUrl(rawContact.portfolio_url),
      github_url: normalizeUrl(rawContact.github_url),
    },
    summary: {
      text: "",
      ...(typeof parsed.summary === "object" ? parsed.summary : {}),
    },
    experience: ensureIds(parsed.experience as unknown[], { company: "", position: "", start_date: "", bullets: [] }),
    education: ensureIds(parsed.education as unknown[], { institution: "", degree: "", bullets: [] }),
    skills: ensureIds(parsed.skills as unknown[], { category: "", items: [] }),
    projects: ensureIds(parsed.projects as unknown[], { name: "", description: "", technologies: [], bullets: [] }),
    certifications: ensureIds(parsed.certifications as unknown[], { name: "", issuer: "" }),
    languages: ensureIds(parsed.languages as unknown[], { name: "", proficiency: "intermediate" }),
    custom_sections: ensureIds(parsed.custom_sections as unknown[], { title: "", content: "" }),
  };
}







