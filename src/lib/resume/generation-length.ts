import { z } from "zod";
import type { ResumeContent } from "@/lib/validations/resume";
import { layoutResume } from "@/lib/resume/layout";
import { getTemplate } from "@/lib/resume/templates";

export const targetPagesSchema = z.number().int().min(1).max(10).nullable().optional();

export function resumeLengthInstruction(pages?: number | null): string {
  if (!pages) return "LENGTH: Auto. Preserve all substantive source detail; the renderer chooses the page count.";
  return `USER-SELECTED LENGTH: ${pages} ${pages === 1 ? "page" : "pages"}. This overrides the default instruction to preserve every bullet verbatim. Aim for roughly ${pages * 400}-${pages * 500} words, including headings and contact details. Keep all employers, job titles, dates, degrees and contact details accurate. Prioritize relevant achievements, combine repetitive bullets, and summarize older or less relevant detail when necessary. For a longer version, explain source-supported implementation details, context and outcomes naturally. Never invent tools, metrics, responsibilities or filler to fill space. Preserve custom sections and URLs. List significant condensation in changesApplied. Keep the resume complete with no cut-off sentences.`;
}

export function applyResumeLength(content: ResumeContent, pages: number | null | undefined, templateId: string | null) {
  const result = { ...content, layout: { target_pages: pages ?? null } };
  const layout = layoutResume(result, getTemplate(templateId || "classic"));
  return { content: result, pageCount: layout.pages.length, layoutWarnings: layout.warnings };
}
