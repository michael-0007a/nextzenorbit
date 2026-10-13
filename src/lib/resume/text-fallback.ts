import { createEmptyResumeContent, type ContactInfo, type ResumeContent } from "@/lib/validations/resume";

// Preserve extracted facts without inventing structured work history when AI fails.
export function resumeFromExtractedText(text: string, contact: Partial<ContactInfo> = {}) {
  const content = createEmptyResumeContent(contact);
  const cleaned = text.replace(/\u0000/g, "").trim();
  let offset = 0;
  // Schema limits: 50 sections of 3000 characters. Cut after a line break so words stay whole.
  while (offset < cleaned.length && content.custom_sections.length < 50) {
    let end = Math.min(offset + 3000, cleaned.length);
    const lineEnd = cleaned.lastIndexOf("\n", end - 1);
    if (end < cleaned.length && lineEnd > offset) end = lineEnd + 1;
    content.custom_sections.push({
      id: `uploaded-text-${content.custom_sections.length}`,
      title: offset === 0 ? "Uploaded resume text" : "Uploaded resume text (continued)",
      content: cleaned.slice(offset, end),
    });
    offset = end;
  }
  return { content, truncated: offset < cleaned.length };
}

// True for a saved upload that never got structured: raw text only, nothing to tailor.
export function isUnparsedUpload(content: ResumeContent): boolean {
  return !content.experience.length && !content.education.length && !content.skills.length
    && content.custom_sections.some(section => section.id.startsWith("uploaded-text"));
}

export function uploadedText(content: ResumeContent): string {
  return content.custom_sections.filter(section => section.id.startsWith("uploaded-text")).map(section => section.content).join("");
}
