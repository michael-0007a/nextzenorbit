import type { ResumeContent } from "@/lib/validations/resume";
import type { ResumeTemplate } from "@/lib/resume/templates";
import fontWidths from "./font-widths.json";

// All dimensions are points. PDF, browser preview and Word use this same plan.
export const PAPER = { width: 595.28, height: 841.89 };
export type BlockKind = "name" | "contact" | "section" | "entry" | "body" | "bullet";
export interface ResumeBlock {
  text: string; kind: BlockKind; keepNext?: boolean;
  /** Text printed right-aligned on the block's first line (location, dates). */
  right?: string;
  /** Bold label printed before the text on the first line ("Languages: ..."). */
  lead?: string;
  /** Character ranges of `text` printed bold (job keywords in bullets). */
  bold?: [number, number][];
  italic?: boolean;
  /** Sidebar column in two-column templates; omitted means the main column. */
  column?: "side";
}
export interface LayoutLine extends Omit<ResumeBlock, "kind"> {
  kind: BlockKind | "spacer";
  font: string; size: number; height: number; before: number; indent: number;
  align: "left" | "center"; color: string; rightFont?: string;
  /** Mixed regular/bold pieces of `text`; absent when the whole line uses `font`. */
  runs?: { text: string; bold: boolean }[];
}
export interface ResumeLayout { pages: LayoutLine[][]; fontSize: number; lineHeight: number; warnings: string[] }
const join = (values: (string | undefined)[], separator = " | ") => values.filter(v => v?.trim()).join(separator);
export const dateRange = (start?: string, end?: string, current?: boolean) => join([start, current ? "Present" : end], " - ");
/** "https://www.linkedin.com/in/x/" -> "linkedin.com/in/x" for display. */
export const displayUrl = (url?: string) => (url || "").trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
/** "McKinsey.org Forward Program" already names its issuer "McKinsey". */
export const redundantIssuer = (name?: string, issuer?: string) => {
  const key = (issuer || "").toLowerCase().split(/[\s/,|]+/).find(part => part.length >= 3);
  return !!key && (name || "").toLowerCase().includes(key);
};
export const italicFont = (font: string) => font.startsWith("Times") ? "Times-Italic" : "Helvetica-Oblique";
/** Width of the main column (the whole text area for one-column templates). */
export const mainWidth = (template: ResumeTemplate) =>
  PAPER.width - template.layout.margins.left - template.layout.margins.right - (template.layout.sidebar ? template.layout.sidebar.width + template.layout.sidebar.gap : 0);

/** Imported Word/PDF typography has equivalent glyphs outside standard PDF fonts.
 * Normalize only presentation characters; never strip names or other scripts.
 * All renderers measure and print this same text; saved source stays untouched.
 */
export function normalizeResumeTypography(text: string): string {
  return text.normalize("NFC")
    .replace(/[‐‑‒−﹣－]/g, "-")
    .replace(/[  -   　]/g, " ")
    .replace(/[­​⁠﻿]/g, "")
    .replace(/[ﬀ-ﬄ]/g, character => ({ "ﬀ": "ff", "ﬁ": "fi", "ﬂ": "fl", "ﬃ": "ffi", "ﬄ": "ffl" })[character]!);
}

/** Preserve every supported field, with dates adjacent to the relevant entry. */
export function resumeBlocks(content: ResumeContent, template?: ResumeTemplate): ResumeBlock[] {
  const blocks: ResumeBlock[] = [];
  const split = template?.layout.entryStyle === "split";
  const sidebar = !!template?.layout.sidebar;
  let column: "side" | undefined;
  const highlights = template?.layout.highlightKeywords ? (content.layout?.highlights || []).filter(h => h.trim().length >= 2) : [];
  const add = (text: string | undefined, kind: BlockKind = "body", keepNext = false, extra: { right?: string; italic?: boolean; lead?: string } = {}) => {
    if (!text?.trim()) return;
    const block: ResumeBlock = { text: normalizeResumeTypography(text.trim()), kind, keepNext };
    if (extra.right?.trim()) block.right = normalizeResumeTypography(extra.right.trim());
    if (extra.lead?.trim()) block.lead = normalizeResumeTypography(extra.lead.trim());
    if (kind === "bullet" && highlights.length) { const ranges = keywordRanges(block.text, highlights); if (ranges.length) block.bold = ranges; }
    if (extra.italic) block.italic = true;
    if (column) block.column = column;
    blocks.push(block);
  };
  const contract = content.resume_type === "c2c";
  const upper = contract || template?.layout.sectionCase === "upper";
  const section = (title: string) => add(upper ? title.toUpperCase() : title, "section", true);
  const bullets = (items?: string[]) => items?.forEach(text => add(text, "bullet"));
  // Sidebar sections are narrow, so they always use the stacked entry style.
  const inSidebar = (draw: () => void) => { column = sidebar ? "side" : undefined; draw(); column = undefined; };
  const c = content.contact;
  add(c.full_name, "name", true);
  const details = join([c.email, c.phone, c.location]);
  const links = template ? join([c.linkedin_url, c.github_url, c.portfolio_url].map(displayUrl)) : join([c.linkedin_url, c.github_url, c.portfolio_url]);
  // New-style templates fit contact on one line when it is short enough at the largest font size.
  const oneLine = template && details && links && textUnits(`${details} | ${links}`, template.fonts.body) * 12 / 1000 <= PAPER.width - template.layout.margins.left - template.layout.margins.right - 8;
  if (oneLine) add(`${details} | ${links}`, "contact");
  else { add(details, "contact", true); add(links, "contact"); }
  if (content.summary?.text) {
    section("Professional Summary");
    if (contract) content.summary.text.split(/\n+/).filter(text => text.trim()).forEach(text => add(text.replace(/^\s*[•*\-]\s*/, ""), "bullet"));
    else add(content.summary.text);
  }
  const addSkills = () => inSidebar(() => {
    if (!content.skills?.length) return;
    section("Skills");
    content.skills.forEach(s => sidebar
      ? (add(s.category, "entry", true), add(s.items.filter(Boolean).join(", ")))
      : split && s.category?.trim()
        ? add(s.items.filter(Boolean).join(", "), "body", false, { lead: `${s.category}:` })
        : add(join([s.category, s.items.filter(Boolean).join(", ")], ": ")));
  });
  const addEducation = () => inSidebar(() => {
    if (!content.education?.length) return;
    section("Education");
    content.education.forEach(e => {
      if (split && !sidebar) {
        add(e.institution, "entry", true, { right: e.location });
        add(join([join([e.degree, e.field_of_study], ", "), e.gpa ? `GPA: ${e.gpa}` : ""]), "body", true, { italic: true, right: dateRange(e.start_date, e.end_date) });
      } else if (sidebar) {
        // Narrow column: one short fact per line so dates and degrees never split mid-phrase.
        add(e.institution, "entry", true);
        add(join([e.degree, e.field_of_study], ", "), "body", true);
        add(dateRange(e.start_date, e.end_date), "body", true, { italic: true });
        add(e.location);
        add(e.gpa ? `GPA: ${e.gpa}` : "");
      } else {
        add(e.institution, "entry", true);
        add(join([e.degree, e.field_of_study]), "body", true);
        add(join([e.location, dateRange(e.start_date, e.end_date), e.gpa ? `GPA: ${e.gpa}` : ""]));
      }
      bullets(e.bullets);
    });
  });
  if (contract) addSkills();
  if (sidebar) { addEducation(); addSkills(); }
  if (content.experience?.length) {
    section("Professional Experience");
    content.experience.forEach(e => {
      if (split) {
        add(e.company, "entry", true, { right: e.location });
        add(e.position, "body", !!e.bullets?.length, { italic: true, right: dateRange(e.start_date, e.end_date, e.is_current) });
      } else {
        add(join([e.position, e.company]), "entry", true);
        add(join([e.location, dateRange(e.start_date, e.end_date, e.is_current)]), "body", !!e.bullets?.length);
      }
      bullets(e.bullets);
    });
  }
  if (!sidebar) addEducation();
  if (!contract && !sidebar) addSkills();
  if (content.projects?.length) {
    section("Projects");
    content.projects.forEach(p => {
      if (split) add(join([p.name, p.technologies?.filter(Boolean).join(", ")]), "entry", true);
      else add(p.name, "entry", true);
      add(p.description); add(template ? displayUrl(p.url) : p.url);
      if (!split && p.technologies?.length) add(`Technologies: ${p.technologies.filter(Boolean).join(", ")}`);
      bullets(p.bullets);
    });
  }
  inSidebar(() => {
    if (content.certifications?.length) {
      section("Certifications");
      content.certifications.forEach(c => {
        const issuer = redundantIssuer(c.name, c.issuer) ? "" : c.issuer;
        if (sidebar) { add(c.name, "body", !!(issuer || c.date || c.url)); add(join([issuer, c.date], " · "), "body", !!c.url, { italic: true }); }
        else if (split) add(c.name, "body", !!c.url, { right: join([issuer, c.date], " · ") });
        else add(join([c.name, issuer, c.date]), "body", !!c.url);
        add(template ? displayUrl(c.url) : c.url);
      });
    }
    if (content.languages?.length) {
      section("Languages"); add(content.languages.map(l => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ""}`).join(", "));
    }
  });
  content.custom_sections?.forEach(s => { if (s.content?.trim()) { section(s.title || "Additional Information"); add(s.content); } });
  // Each column must end without a dangling keep-with-next.
  for (const side of [undefined, "side"]) { const last = blocks.findLast(b => b.column === side); if (last) last.keepNext = false; }
  return blocks;
}

/** Up to two non-overlapping, whole-word, case-insensitive keyword matches; longer phrases win. */
export function keywordRanges(text: string, keywords: string[]): [number, number][] {
  const ranges: [number, number][] = [];
  const lower = text.toLowerCase();
  for (const keyword of [...keywords].sort((a, b) => b.length - a.length)) {
    if (ranges.length >= 2) break;
    const needle = keyword.toLowerCase().trim();
    for (let at = lower.indexOf(needle); at >= 0; at = lower.indexOf(needle, at + 1)) {
      const end = at + needle.length;
      const whole = !/[a-z0-9]/.test(lower[at - 1] || "") && !/[a-z0-9]/.test(lower[end] || "");
      if (whole && !ranges.some(([a, b]) => at < b && end > a)) { ranges.push([at, end]); break; }
    }
  }
  return ranges.sort((a, b) => a[0] - b[0]);
}

/** Word wrap with per-word fonts so bold keywords are measured at bold width. Null if a word cannot fit. */
function wrapRuns(text: string, bold: [number, number][], fonts: { regular: string; bold: string }, size: number, width: number, firstWidth: number) {
  type Piece = { text: string; bold: boolean };
  // Each word is split at keyword edges, so "criteria," bolds the word but not the comma.
  const words = [...text.matchAll(/\S+/g)].map(m => {
    const at = m.index!, cuts = new Set([0, m[0].length]);
    for (const [a, b] of bold) for (const edge of [a - at, b - at]) if (edge > 0 && edge < m[0].length) cuts.add(edge);
    const edges = [...cuts].sort((x, y) => x - y);
    return edges.slice(1).map((edge, i): Piece => ({ text: m[0].slice(edges[i], edge), bold: bold.some(([a, b]) => at + edges[i] >= a && at + edges[i] < b) }));
  });
  const measure = (pieces: Piece[]) => pieces.reduce((sum, p) => sum + textUnits(p.text, p.bold ? fonts.bold : fonts.regular), 0) * size / 1000;
  const space = textUnits(" ", fonts.regular) * size / 1000;
  const lines: Piece[][][] = [];
  let line: Piece[][] = [], used = 0;
  for (const word of words) {
    const w = measure(word), limit = lines.length ? width : firstWidth;
    if (w > limit) return null;
    if (line.length && used + space + w > limit) { lines.push(line); line = []; used = 0; }
    used += (line.length ? space : 0) + w;
    line.push(word);
  }
  if (line.length) lines.push(line);
  // Merge neighbouring pieces of the same weight into runs; the space between words joins the next run.
  return lines.map(lineWords => lineWords.flatMap((word, i) => i ? [{ text: " ", bold: false }, ...word] : word)
    .reduce<Piece[]>((runs, piece) => {
      const last = runs.at(-1);
      if (last && (last.bold === piece.bold || piece.text === " ")) last.text += piece.text;
      else runs.push({ ...piece });
      return runs;
    }, []));
}

const textUnits = (text: string, font: string) => {
  const metrics = fontWidths[font as keyof typeof fontWidths] as Record<string, number>;
  return Array.from(text).reduce((sum, c) => sum + (metrics[c] ?? 1000), 0);
};

function wrapText(text: string, font: string, size: number, width: number, firstWidth = width): string[] {
  const metrics = fontWidths[font as keyof typeof fontWidths] as Record<string, number>;
  // Keep integer font units, matching the old measurement exactly. Avoid
  // rescanning the growing line for every character of every candidate layout.
  const units = (characters: string[]) => characters.reduce((sum, c) => sum + (metrics[c] ?? 1000), 0);
  const space = metrics[' '] ?? 1000;
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = "";
    let lineUnits = 0;
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      const characters = Array.from(word);
      const limit = () => lines.length ? width : firstWidth;
      if (line && (lineUnits + space + units(characters)) * size / 1000 > limit()) { lines.push(line); line = ""; lineUnits = 0; }
      // Long URLs/identifiers must wrap without clipping or dropping characters.
      for (const character of characters) {
        const characterUnits = metrics[character] ?? 1000;
        if ((lineUnits + characterUnits) * size / 1000 > limit()) { lines.push(line); line = ""; lineUnits = 0; }
        line += character;
        lineUnits += characterUnits;
      }
      line += " ";
      lineUnits += space;
    }
    if (line.trim()) lines.push(line.trimEnd());
  }
  return lines.length ? lines : [""];
}

function makeLines(blocks: ResumeBlock[], template: ResumeTemplate, size: number, leading: number, spacing = 1): LayoutLine[] {
  return blocks.flatMap(block => {
    // The name/contact header spans the full sheet, also above two columns.
    const header = block.kind === "name" || block.kind === "contact";
    const width = (block.column === "side" ? template.layout.sidebar!.width : header ? PAPER.width - template.layout.margins.left - template.layout.margins.right : mainWidth(template)) - 8;
    const bold = ["name", "section", "entry"].includes(block.kind);
    const font = bold ? template.fonts.heading : block.italic ? italicFont(template.fonts.body) : template.fonts.body;
    const fontSize = block.kind === "name" ? template.layout.nameSize ?? 22 : block.kind === "section" ? size + 1 : size;
    const indent = block.kind === "bullet" ? 12 : 0;
    const rightFont = block.right ? (block.italic ? italicFont(template.fonts.body) : template.fonts.body) : undefined;
    // Leave room for right-aligned dates/location on the first line.
    const reserved = block.right ? textUnits(block.right, rightFont!) * fontSize / 1000 + 10 : 0;
    // A bold lead label shares the first line with the text.
    const leadWidth = block.lead ? (textUnits(block.lead, template.fonts.heading) + textUnits(" ", font)) * fontSize / 1000 : 0;
    const runLines = block.bold ? wrapRuns(block.text, block.bold, { regular: font, bold: template.fonts.heading }, fontSize, width - indent, width - indent - reserved - leadWidth) : null;
    const lines = runLines ? runLines.map(runs => runs.map(r => r.text).join("")) : wrapText(block.text, font, fontSize, width - indent, width - indent - reserved - leadWidth);
    return lines.map((text, i) => {
      const line: LayoutLine = {
        ...block, text: block.kind === "bullet" && i === 0 ? `• ${text}` : text,
        font, size: fontSize, height: fontSize * leading,
        before: i ? 0 : (block.kind === "section" ? template.layout.sectionSpacing : block.kind === "entry" ? 6 : 3) * spacing,
        indent: block.kind === "bullet" && i > 0 ? indent : 0,
        align: (["name", "contact"].includes(block.kind) && template.layout.headerStyle === "centered" ? "center" : "left") as "center" | "left",
        color: block.kind === "section" ? template.colors.accent : template.colors.text,
        // Keep short paragraphs/bullets together; longer paragraphs may break,
        // but keep at least two lines at either end of a page.
        keepNext: i === lines.length - 1 ? block.keepNext : lines.length <= 4 || i === 0 || i === lines.length - 2,
      };
      if (block.right && i === 0) line.rightFont = rightFont; else delete line.right;
      if (i > 0) delete line.lead;
      delete line.bold;
      if (runLines) line.runs = block.kind === "bullet" && i === 0 ? [{ text: "• ", bold: false }, ...runLines[i]] : runLines[i];
      delete line.italic;
      if (!block.column) delete line.column;
      return line;
    });
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

const used = (lines: LayoutLine[]) => lines.reduce((sum, line) => sum + line.height + line.before, 0);

/** Two-column templates: the header spans both columns, then each column paginates on its own. */
function paginateColumns(lines: LayoutLine[], capacity: number, targetPages?: number): LayoutLine[][] {
  const main = lines.filter(line => line.column !== "side");
  const side = lines.filter(line => line.column === "side");
  const header = main.findIndex(line => line.kind !== "name" && line.kind !== "contact");
  const headerHeight = used(main.slice(0, header < 0 ? main.length : header));
  // The sidebar starts below the header: reserve that height with a spacer the renderers skip.
  const spacer: LayoutLine = { text: "", kind: "spacer", column: "side", font: "Helvetica", size: 0, height: headerHeight, before: 0, indent: 0, align: "left", color: "#000000", keepNext: true };
  const mainPages = paginate(main, capacity, targetPages);
  const sidePages = side.length ? paginate([spacer, ...side], capacity) : [];
  return Array.from({ length: Math.max(mainPages.length, sidePages.length) }, (_, i) => [...(mainPages[i] || []), ...(sidePages[i] || [])]);
}

export function unsupportedPdfCharacters(content: ResumeContent, template: ResumeTemplate): string[] {
  const metrics = fontWidths[template.fonts.body as keyof typeof fontWidths] as Record<string, number>;
  return [...new Set(resumeBlocks(content).flatMap(b => Array.from(b.text).filter(c => !/\s/.test(c) && metrics[c] === undefined)))];
}

/** Use the available sheet instead of leaving visibly unfinished pages: grow gaps proportionally, with a strict cap. */
function spread(page: LayoutLine[], capacity: number, maxUnit = 6) {
  const total = used(page);
  const room = Math.max(0, capacity * 0.96 - total);
  const weights = page.map((line, index) => index === 0 || line.before === 0 ? 0 : line.kind === "section" ? 3 : line.kind === "entry" ? 2 : 1);
  const sum = weights.reduce<number>((acc, weight) => acc + weight, 0);
  const unit = total / capacity >= 0.65 && sum ? Math.min(maxUnit, room / sum) : 0;
  return page.map((line, index) => ({ ...line, before: line.before + weights[index] * unit }));
}

export function layoutResume(content: ResumeContent, template: ResumeTemplate): ResumeLayout {
  const blocks = resumeBlocks(content, template);
  const capacity = PAPER.height - template.layout.margins.top - template.layout.margins.bottom;
  const columns = !!template.layout.sidebar;
  const candidates = [10.5, 11, 11.5, 12].flatMap(size => {
   const wrapped = makeLines(blocks, template, size, 1);
   return [1.15, 1.2, 1.3, 1.4].flatMap(leading => [0.6, 1].map(spacing => {
    const lines = wrapped.map(line => ({ ...line, height: line.size * leading, before: line.before * spacing }));
    const pages = columns ? paginateColumns(lines, capacity, content.layout?.target_pages ?? undefined) : paginate(lines, capacity, content.layout?.target_pages ?? undefined);
    const fill = pages.reduce((sum, page) => sum + used(page.filter(line => line.column !== "side")), 0) / (pages.length * capacity);
    return { pages, fontSize: size, lineHeight: leading, fill };
  }));});
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
  const pages = chosen.pages.map(page => columns
    ? [...spread(page.filter(line => line.column !== "side"), capacity, 2.5), ...page.filter(line => line.column === "side")]
    : spread(page, capacity));
  return { ...chosen, pages, warnings };
}
