import { resumeContentFormSchema } from "@/lib/validations/resume";

export function hasResumeBody(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const content = value as Record<string, unknown>;
  if (content.summary && typeof content.summary === "object" && typeof (content.summary as { text?: unknown }).text === "string" && (content.summary as { text: string }).text.trim()) return true;
  return ["experience", "education", "skills", "projects", "certifications", "languages", "custom_sections"].some(key => Array.isArray(content[key]) && content[key].length > 0);
}

// Export saved drafts without requiring a completed name/email. Older parser
// output also contains null optional fields and entries without editor IDs.
export function parseExportContent(value: unknown) {
  const clean = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.filter(item => item != null).map(clean);
    if (input && typeof input === "object") return Object.fromEntries(Object.entries(input).filter(([, item]) => item != null).map(([key, item]) => [key, clean(item)]));
    return input;
  };
  const normalized = clean(value);
  if (normalized && typeof normalized === "object" && !Array.isArray(normalized)) {
    const content = normalized as Record<string, unknown>;
    for (const key of ["experience", "education", "skills", "projects", "certifications", "languages", "custom_sections"]) {
      if (Array.isArray(content[key])) content[key] = content[key].map((entry, index) => entry && typeof entry === "object" ? { id: `${key}-${index}`, ...entry } : entry);
    }
  }
  return resumeContentFormSchema.safeParse(normalized);
}
