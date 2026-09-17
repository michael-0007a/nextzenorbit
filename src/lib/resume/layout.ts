import type { ResumeContent } from "@/lib/validations/resume";
import type { ResumeTemplate } from "@/lib/resume/templates";
import fontWidths from "./font-widths.json";

// All dimensions are points. PDF, browser preview and Word use this same plan.
export const PAPER = { width: 595.28, height: 841.89 };
export type BlockKind = "name" | "contact" | "section" | "entry" | "body" | "bullet";
export interface ResumeBlock { text: string; kind: BlockKind; keepNext?: boolean }
export interface LayoutLine extends ResumeBlock {
  font: string; size: number; height: number; before: number; indent: number;
  align: "left" | "center"; color: string;
}
export interface ResumeLayout { pages: LayoutLine[][]; fontSize: number; lineHeight: number; warnings: string[] }
const join = (values: (string | undefined)[], separator = " | ") => values.filter(v => v?.trim()).join(separator);
export const dateRange = (start?: string, end?: string, current?: boolean) => join([start, current ? "Present" : end], " - ");

/** Preserve every supported field, with dates adjacent to the relevant entry. */
export function resumeBlocks(content: ResumeContent): ResumeBlock[] {
  const blocks: ResumeBlock[] = [];
  const add = (text: string | undefined, kind: BlockKind = "body", keepNext = false) => {
    if (text?.trim()) blocks.push({ text: text.trim(), kind, keepNext });
  };
  const section = (title: string) => add(title, "section", true);
  const bullets = (items?: string[]) => items?.forEach(text => add(text, "bullet"));
  const c = content.contact;
  add(c.full_name, "name", true);
  add(join([c.email, c.phone, c.location]), "contact", true);
  add(join([c.linkedin_url, c.github_url, c.portfolio_url]), "contact");
  if (content.summary?.text) { section("Professional Summary"); add(content.summary.text); }
  if (content.experience?.length) {
    section("Professional Experience");
    content.experience.forEach(e => {
      add(join([e.position, e.company]), "entry", true);
      add(join([e.location, dateRange(e.start_date, e.end_date, e.is_current)]), "body", !!e.bullets?.length);
      bullets(e.bullets);
    });
  }
  if (content.education?.length) {
    section("Education");
    content.education.forEach(e => {
      add(e.institution, "entry", true);
      add(join([e.degree, e.field_of_study]), "body", true);
      add(join([e.location, dateRange(e.start_date, e.end_date), e.gpa ? `GPA: ${e.gpa}` : ""]));
      bullets(e.bullets);
    });
  }
  if (content.skills?.length) {
    section("Skills");
    content.skills.forEach(s => add(join([s.category, s.items.filter(Boolean).join(", ")], ": ")));
  }
  if (content.projects?.length) {
    section("Projects");
    content.projects.forEach(p => {
      add(p.name, "entry", true); add(p.description); add(p.url);
      if (p.technologies?.length) add(`Technologies: ${p.technologies.filter(Boolean).join(", ")}`);
      bullets(p.bullets);
    });
  }
  if (content.certifications?.length) {
    section("Certifications");
    content.certifications.forEach(c => { add(join([c.name, c.issuer, c.date]), "body", !!c.url); add(c.url); });
  }
  if (content.languages?.length) {
    section("Languages"); add(content.languages.map(l => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ""}`).join(", "));
  }
  content.custom_sections?.forEach(s => { if (s.content?.trim()) { section(s.title || "Additional Information"); add(s.content); } });
  if (blocks.length) blocks[blocks.length - 1].keepNext = false;
  return blocks;
}

function wrapText(text: string, font: string, size: number, width: number): string[] {
  const metrics = fontWidths[font as keyof typeof fontWidths] as Record<string, number>;
  const measure = (value: string) => Array.from(value).reduce((sum, c) => sum + (metrics[c] ?? 1000), 0) * size / 1000;
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = "";
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      if (line && measure(`${line} ${word}`) > width) { lines.push(line); line = ""; }
      // Long URLs/identifiers must wrap without clipping or dropping characters.
      for (const character of Array.from(word)) {
        if (measure(line + character) > width) { lines.push(line); line = ""; }
        line += character;
      }
      line += " ";
    }
    if (line.trim()) lines.push(line.trimEnd());
  }
  return lines.length ? lines : [""];
}

function makeLines(blocks: ResumeBlock[], template: ResumeTemplate, size: number, leading: number, spacing = 1): LayoutLine[] {
  const width = PAPER.width - template.layout.margins.left - template.layout.margins.right - 8;
  return blocks.flatMap(block => {
    const bold = ["name", "section", "entry"].includes(block.kind);
    const font = bold ? template.fonts.heading : template.fonts.body;
    const fontSize = block.kind === "name" ? 22 : block.kind === "section" ? size + 1 : size;
    const indent = block.kind === "bullet" ? 12 : 0;
    const lines = wrapText(block.text, font, fontSize, width - indent);
    return lines.map((text, i) => ({
      ...block, text: block.kind === "bullet" && i === 0 ? `• ${text}` : text,
      font, size: fontSize, height: fontSize * leading,
      before: i ? 0 : (block.kind === "section" ? template.layout.sectionSpacing : block.kind === "entry" ? 6 : 3) * spacing,
      indent: block.kind === "bullet" && i > 0 ? indent : 0,
      align: (["name", "contact"].includes(block.kind) && template.layout.headerStyle === "centered" ? "center" : "left") as "center" | "left",
      color: block.kind === "section" ? template.colors.accent : template.colors.text,
      // Keep short paragraphs/bullets together; longer paragraphs may break,
      // but keep at least two lines at either end of a page.
      keepNext: i === lines.length - 1 ? block.keepNext : lines.length <= 4 || i === 0 || i === lines.length - 2,
    }));
  });
}

/** Minimum page count, then balanced whitespace. Never shrink below 10.5pt. */
function paginate(lines: LayoutLine[], capacity: number, targetPages?: number): LayoutLine[][] {
  const n = lines.length;
  if (!n) return [[]];
  if (targetPages && targetPages > 1 && n >= targetPages * 5) {
    const costs = Array.from({ length: targetPages + 1 }, () => new Array<number>(n + 1).fill(Infinity));
    const cuts = Array.from({ length: targetPages + 1 }, () => new Array<number>(n + 1).fill(-1));
    costs[0][n] = 0;
    for (let p = 1; p <= targetPages; p++) {
      for (let i = n - 1; i >= 0; i--) {
        let height = 0;
        for (let j = i; j < n; j++) {
          height += lines[j].height + (j === i ? 0 : lines[j].before);
          if (height > capacity) break;
          if (j < n - 1 && lines[j].keepNext) continue;
          const cost = (capacity - height) ** 2 + costs[p - 1][j + 1];
          if (cost < costs[p][i]) { costs[p][i] = cost; cuts[p][i] = j + 1; }
        }
      }
    }
    if (Number.isFinite(costs[targetPages][0])) {
      const pages: LayoutLine[][] = [];
      for (let i = 0, p = targetPages; p > 0; p--) {
        const end = cuts[p][i];
        pages.push(lines.slice(i, end).map((line, index) => ({ ...line, before: index ? line.before : 0 })));
        i = end;
      }
      return pages;
    }
  }
  const costs = new Array<number>(n + 1).fill(Infinity);
  const next = new Array<number>(n + 1).fill(n);
  costs[n] = 0;
  for (let i = n - 1; i >= 0; i--) {
    let height = 0;
    for (let j = i; j < n; j++) {
      height += lines[j].height + (j === i ? 0 : lines[j].before);
      if (height > capacity) break;
      if (j < n - 1 && lines[j].keepNext) continue;
      const cost = 1e9 + (capacity - height) ** 2 + costs[j + 1];
      if (cost < costs[i]) { costs[i] = cost; next[i] = j + 1; }
    }
    // A pathological chain of headings may exceed a page. Still preserve all
    // lines, and let the normal renderer paginate the rest without recursion.
    if (!Number.isFinite(costs[i])) {
      let j = i, height = 0;
      while (j < n && height + lines[j].height + (j === i ? 0 : lines[j].before) <= capacity) {
        height += lines[j].height + (j === i ? 0 : lines[j].before); j++;
      }
      next[i] = Math.max(i + 1, j); costs[i] = 1e9 + costs[next[i]];
    }
  }
  const pages: LayoutLine[][] = [];
  for (let i = 0; i < n; i = next[i]) pages.push(lines.slice(i, next[i]).map((line, index) => ({ ...line, before: index ? line.before : 0 })));
  return pages;
}

export function unsupportedPdfCharacters(content: ResumeContent, template: ResumeTemplate): string[] {
  const metrics = fontWidths[template.fonts.body as keyof typeof fontWidths] as Record<string, number>;
  return [...new Set(resumeBlocks(content).flatMap(b => Array.from(b.text).filter(c => !/\s/.test(c) && metrics[c] === undefined)))];
}

export function layoutResume(content: ResumeContent, template: ResumeTemplate): ResumeLayout {
  const blocks = resumeBlocks(content);
  const capacity = PAPER.height - template.layout.margins.top - template.layout.margins.bottom;
  const candidates = [10.5, 11, 11.5, 12].flatMap(size => [1.15, 1.2, 1.3, 1.4].flatMap(leading => [0.6, 1].map(spacing => {
    const pages = paginate(makeLines(blocks, template, size, leading, spacing), capacity, content.layout?.target_pages ?? undefined);
    const fill = pages.reduce((sum, page) => sum + page.reduce((h, line) => h + line.height + line.before, 0), 0) / (pages.length * capacity);
    return { pages, fontSize: size, lineHeight: leading, fill };
  })));
  const minPages = Math.min(...candidates.map(c => c.pages.length));
  // Aim for well-filled pages without stretching short resumes into filler.
  const requested = content.layout?.target_pages;
  const pageCount = requested && candidates.some(c => c.pages.length === requested) ? requested : minPages;
  const chosen = candidates.filter(c => c.pages.length === pageCount).sort((a, b) => Math.abs(a.fill - 0.92) - Math.abs(b.fill - 0.92))[0];
  const warnings: string[] = [];
  if (content.layout?.target_pages && chosen.pages.length !== content.layout.target_pages) warnings.push(`Requested ${content.layout.target_pages} pages; this content needs ${chosen.pages.length} at readable sizes. Use AI generation with the chosen length or edit the content. Nothing has been clipped.`);
  if (!content.contact.full_name.trim()) warnings.push("Add your full name.");
  if (!content.contact.email.trim()) warnings.push("Add a contact email.");
  if (!content.experience.length && !content.projects.length) warnings.push("Add experience or projects to demonstrate your skills.");
  if (unsupportedPdfCharacters(content, template).length) warnings.push("Some characters are outside this PDF font's character set. Use Word export and review the characters before applying.");
  if (chosen.fill < 0.7) warnings.push("Available content leaves some whitespace. Add relevant factual detail if needed; no content has been invented or removed to fill pages.");
  // Use the available sheet instead of leaving balanced but visibly unfinished
  // pages. Grow paragraph gaps proportionally, with a strict typographic cap;
  // never stretch a genuinely short resume or add fabricated content.
  const pages = chosen.pages.map(page => {
    const used = page.reduce((sum, line) => sum + line.height + line.before, 0);
    const room = Math.max(0, capacity * 0.96 - used);
    const weights = page.map((line, index) => index === 0 || line.before === 0 ? 0 : line.kind === "section" ? 3 : line.kind === "entry" ? 2 : 1);
    const total = weights.reduce<number>((sum, weight) => sum + weight, 0);
    const unit = used / capacity >= 0.65 && total ? Math.min(6, room / total) : 0;
    return page.map((line, index) => ({ ...line, before: line.before + weights[index] * unit }));
  });
  return { ...chosen, pages, warnings };
}
