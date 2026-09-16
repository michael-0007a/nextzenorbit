import { createEmptyResumeContent, type ContactInfo } from "@/lib/validations/resume";

// Preserve extracted facts without inventing structured work history when AI fails.
export function resumeFromExtractedText(text: string, contact: Partial<ContactInfo> = {}) {
  const content = createEmptyResumeContent(contact);
  const cleaned = text.replace(/\u0000/g, "").trim();
  const retained = cleaned.slice(0, 15000);
  for (let offset = 0; offset < retained.length; offset += 3000) {
    content.custom_sections.push({
      id: `uploaded-text-${offset / 3000}`,
      title: offset === 0 ? "Uploaded resume text" : "Uploaded resume text (continued)",
      content: retained.slice(offset, offset + 3000),
    });
  }
  return { content, truncated: cleaned.length > retained.length };
}
