import { Document, Paragraph, TextRun, Packer, AlignmentType, BorderStyle, LineRuleType, Table, TableRow, TableCell, WidthType, TabStopType } from "docx";
import type { ResumeContent } from "@/lib/validations/resume";
import { getTemplate, type ResumeTemplate } from "@/lib/resume/templates";
import { layoutResume, mainWidth, PAPER, type LayoutLine } from "@/lib/resume/layout";

const twips = (points: number) => Math.round(points * 20);
const run = (text: string, font: string, size: number, color: string) => new TextRun({ text, font: font.startsWith("Times") ? "Times New Roman" : "Arial",
  bold: font.endsWith("Bold"), italics: /Italic|Oblique/.test(font), size: size * 2, color: color.slice(1) });

function paragraph(line: LayoutLine, template: ResumeTemplate, width: number, pageBreakBefore = false) {
  return new Paragraph({
    pageBreakBefore,
    alignment: line.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT,
    widowControl: false,
    indent: { left: twips(line.indent) },
    spacing: { before: twips(line.before), after: 0, line: twips(line.height), lineRule: LineRuleType.EXACT },
    // Right-aligned dates/location sit on a right tab stop at the column edge.
    tabStops: line.right ? [{ type: TabStopType.RIGHT, position: twips(width) }] : undefined,
    border: line.kind === "section" && template.layout.showDividers ? {
      bottom: { color: template.colors.accent.slice(1), style: BorderStyle.SINGLE, size: 4, space: 0 },
    } : undefined,
    children: [...(line.lead ? [run(`${line.lead} `, template.fonts.heading, line.size, line.color)] : []), run(line.text, line.font, line.size, line.color), ...(line.right ? [run(`\t${line.right}`, line.rightFont!, line.size, template.colors.muted)] : [])],
  });
}

export async function generateWordDocument(content: ResumeContent, options: { template?: ResumeTemplate } = {}): Promise<Buffer> {
  const template = options.template || getTemplate("classic");
  const layout = layoutResume(content, template);
  const sidebar = template.layout.sidebar;
  const fullWidth = PAPER.width - template.layout.margins.left - template.layout.margins.right;
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const children = layout.pages.flatMap((lines, pageIndex) => {
    if (!sidebar) return lines.map((line, index) => paragraph(line, template, fullWidth, pageIndex > 0 && index === 0));
    // Two columns: the header spans the sheet, then one borderless two-cell table per page.
    const main = lines.filter(line => line.column !== "side");
    const header = main.filter(line => line.kind === "name" || line.kind === "contact");
    const side = lines.filter(line => line.column === "side" && line.kind !== "spacer");
    const body = main.filter(line => !header.includes(line));
    const cell = (cellLines: LayoutLine[], width: number, margin = 0) => new TableCell({
      width: { size: twips(width + margin), type: WidthType.DXA }, borders: { top: none, bottom: none, left: none, right: none },
      margins: { top: 0, bottom: 0, left: 0, right: twips(margin) },
      children: cellLines.length ? cellLines.map(line => paragraph(line, template, width)) : [new Paragraph("")],
    });
    return [
      ...header.map(line => paragraph(line, template, fullWidth)),
      new Paragraph({ pageBreakBefore: pageIndex > 0, spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT }, children: [] }),
      new Table({ width: { size: twips(fullWidth), type: WidthType.DXA }, columnWidths: [twips(sidebar.width + sidebar.gap), twips(mainWidth(template))],
        borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
        rows: [new TableRow({ cantSplit: true, children: [cell(side, sidebar.width, sidebar.gap), cell(body, mainWidth(template))] })] }),
    ];
  });
  const doc = new Document({
    title: `${content.contact.full_name || "Candidate"} Resume`, creator: content.contact.full_name,
    styles: { default: { document: { run: { font: "Arial", size: 22 }, paragraph: { spacing: { after: 0 } } } } },
    sections: [{ properties: { page: {
      size: { width: twips(PAPER.width), height: twips(PAPER.height) },
      margin: Object.fromEntries(Object.entries(template.layout.margins).map(([key, value]) => [key, twips(value)])),
    } }, children }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}
