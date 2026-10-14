"use client";

import { useMemo, memo } from "react";
import { cn } from "@/lib/utils";
import type { ResumeContent } from "@/lib/validations/resume";
import { getTemplate, type ResumeTemplate } from "@/lib/resume/templates";
import { layoutResume, mainWidth, PAPER, type LayoutLine } from "@/lib/resume/layout";

const font = (name: string) => name.startsWith("Times") ? "'Times New Roman', serif" : "Arial, sans-serif";
function Line({ line, template }: { line: LayoutLine; template: ResumeTemplate }) {
  return <div style={{ height: line.height, marginTop: line.before, display: "flex", justifyContent: "space-between",
    paddingLeft: line.indent, boxSizing: "border-box", fontFamily: font(line.font),
    fontSize: line.size, fontWeight: line.font.endsWith("Bold") ? 700 : 400, fontStyle: /Italic|Oblique/.test(line.font) ? "italic" : undefined,
    lineHeight: `${line.height}px`, color: line.color, whiteSpace: "pre",
    borderBottom: line.kind === "section" && template.layout.showDividers ? `0.5px solid ${template.colors.accent}` : undefined,
  }}>
    <span style={{ flexGrow: 1, textAlign: line.align }}>{line.lead && <b>{line.lead} </b>}{line.runs ? line.runs.map((run, i) => run.bold ? <b key={i}>{run.text}</b> : <span key={i}>{run.text}</span>) : line.text}</span>
    {line.right && <span style={{ fontFamily: font(line.rightFont!), fontWeight: 400, fontStyle: /Italic|Oblique/.test(line.rightFont!) ? "italic" : undefined, color: template.colors.muted }}>{line.right}</span>}
  </div>;
}

export const ResumePreview = memo(function ResumePreview({ content, templateId = "classic", className, scale = 0.55, showDetails = true }: {
  content: ResumeContent; templateId?: string; className?: string; scale?: number; showDetails?: boolean;
}) {
  const template = getTemplate(templateId);
  const layout = useMemo(() => layoutResume(content, template), [content, template]);
  return <div className={cn("flex flex-col gap-4", className)}>
    {showDetails && <div className="rounded-lg border border-border bg-surface p-3 text-xs" style={{ width: PAPER.width * scale }}>
      <p>{layout.pages.length} {layout.pages.length === 1 ? "page" : "pages"} · A4 · {layout.fontSize} pt · {template.name}</p>
      <p className="mt-1 text-text-secondary">{template.layout.sidebar ? "Two-column" : "Single-column"}, selectable text. Review your details after uploading to an application.</p>
      {layout.warnings.length > 0 && <ul className="mt-2 list-disc pl-4 text-amber-700 dark:text-amber-400">
        {layout.warnings.map(w => <li key={w}>{w}</li>)}
      </ul>}
    </div>}
    {layout.pages.map((lines, pageIndex) => <div key={pageIndex}>
      <div className="relative border border-slate-200 shadow-sm" style={{ width: PAPER.width * scale, height: PAPER.height * scale }}>
        <div className="absolute left-0 top-0 bg-white" style={{ width: PAPER.width, height: PAPER.height,
          transform: `scale(${scale})`, transformOrigin: "top left", boxSizing: "border-box",
          padding: `${template.layout.margins.top}px ${template.layout.margins.right}px ${template.layout.margins.bottom}px ${template.layout.margins.left}px` }}>
          {template.layout.sidebar ? (() => {
            const main = lines.filter(line => line.column !== "side");
            const header = main.filter(line => line.kind === "name" || line.kind === "contact");
            return <>
              {header.map((line, index) => <Line key={`h${index}`} line={line} template={template} />)}
              <div style={{ display: "flex" }}>
                <div style={{ width: template.layout.sidebar.width, marginRight: template.layout.sidebar.gap }}>
                  {lines.filter(line => line.column === "side" && line.kind !== "spacer").map((line, index) => <Line key={index} line={line} template={template} />)}
                </div>
                <div style={{ width: mainWidth(template) }}>
                  {main.filter(line => !header.includes(line)).map((line, index) => <Line key={index} line={line} template={template} />)}
                </div>
              </div>
            </>;
          })() : lines.map((line, index) => <Line key={index} line={line} template={template} />)}
        </div>
      </div>
      <p className="mt-1 text-center text-xs text-text-secondary">Page {pageIndex + 1} of {layout.pages.length}</p>
    </div>)}
  </div>;
});
