"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ResumeContent } from "@/lib/validations/resume";
import { getTemplate } from "@/lib/resume/templates";
import { layoutResume, PAPER } from "@/lib/resume/layout";

export function ResumePreview({ content, templateId = "classic", className, scale = 0.55 }: {
  content: ResumeContent; templateId?: string; className?: string; scale?: number;
}) {
  const template = getTemplate(templateId);
  const layout = useMemo(() => layoutResume(content, template), [content, template]);
  return <div className={cn("flex flex-col gap-4", className)}>
    <div className="rounded-lg border border-border bg-surface p-3 text-xs" style={{ width: PAPER.width * scale }}>
      <p>{layout.pages.length} {layout.pages.length === 1 ? "page" : "pages"} · A4 · {layout.fontSize} pt · {template.name}</p>
      <p className="mt-1 text-text-secondary">Single-column, selectable text. Review your details after uploading to an application.</p>
      {layout.warnings.length > 0 && <ul className="mt-2 list-disc pl-4 text-amber-700 dark:text-amber-400">
        {layout.warnings.map(w => <li key={w}>{w}</li>)}
      </ul>}
    </div>
    {layout.pages.map((lines, pageIndex) => <div key={pageIndex}>
      <div className="relative border border-slate-200 shadow-sm" style={{ width: PAPER.width * scale, height: PAPER.height * scale }}>
        <div className="absolute left-0 top-0 bg-white" style={{ width: PAPER.width, height: PAPER.height,
          transform: `scale(${scale})`, transformOrigin: "top left", boxSizing: "border-box",
          padding: `${template.layout.margins.top}px ${template.layout.margins.right}px ${template.layout.margins.bottom}px ${template.layout.margins.left}px` }}>
          {lines.map((line, index) => <div key={index} style={{ height: line.height, marginTop: line.before,
            paddingLeft: line.indent, boxSizing: "border-box", fontFamily: line.font.startsWith("Times") ? "'Times New Roman', serif" : "Arial, sans-serif",
            fontSize: line.size, fontWeight: line.font.endsWith("Bold") ? 700 : 400,
            lineHeight: `${line.height}px`, textAlign: line.align, color: line.color, whiteSpace: "pre",
            borderBottom: line.kind === "section" && template.layout.showDividers ? `0.5px solid ${template.colors.accent}` : undefined,
          }}>{line.text}</div>)}
        </div>
      </div>
      <p className="mt-1 text-center text-xs text-text-secondary">Page {pageIndex + 1} of {layout.pages.length}</p>
    </div>)}
  </div>;
}
