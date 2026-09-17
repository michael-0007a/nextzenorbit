import { Document, Paragraph, TextRun, Packer, AlignmentType, BorderStyle, LineRuleType } from "docx";
import type { ResumeContent } from "@/lib/validations/resume";
import { getTemplate, type ResumeTemplate } from "@/lib/resume/templates";
import { layoutResume, PAPER } from "@/lib/resume/layout";

export async function generateWordDocument(content: ResumeContent, options: { template?: ResumeTemplate } = {}): Promise<Buffer> {
  const template = options.template || getTemplate("classic");
  const layout = layoutResume(content, template);
  const children = layout.pages.flatMap((lines, pageIndex) => lines.map((line, index) => new Paragraph({
    pageBreakBefore: pageIndex > 0 && index === 0,
    alignment: line.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT,
    widowControl: false,
    indent: { left: Math.round(line.indent * 20) },
    spacing: { before: Math.round(line.before * 20), after: 0, line: Math.round(line.height * 20), lineRule: LineRuleType.EXACT },
    border: line.kind === "section" && template.layout.showDividers ? {
      bottom: { color: template.colors.accent.slice(1), style: BorderStyle.SINGLE, size: 4, space: 0 },
    } : undefined,
    children: [new TextRun({ text: line.text, font: line.font.startsWith("Times") ? "Times New Roman" : "Arial",
      bold: line.font.endsWith("Bold"), size: line.size * 2, color: line.color.slice(1) })],
  })));
  const doc = new Document({
    title: `${content.contact.full_name || "Candidate"} Resume`, creator: content.contact.full_name,
    styles: { default: { document: { run: { font: "Arial", size: 22 }, paragraph: { spacing: { after: 0 } } } } },
    sections: [{ properties: { page: {
      size: { width: Math.round(PAPER.width * 20), height: Math.round(PAPER.height * 20) },
      margin: Object.fromEntries(Object.entries(template.layout.margins).map(([key, value]) => [key, Math.round(value * 20)])),
    } }, children }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}
