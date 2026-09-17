import type { ResumeContent } from "@/lib/validations/resume";
import { RESUME_TEMPLATES, getTemplate, type ResumeTemplate } from "@/lib/resume/templates";
import { resumeBlocks } from "@/lib/resume/layout";

export type LaTeXTemplate = ResumeTemplate;
export const LATEX_TEMPLATES = RESUME_TEMPLATES;
export const getLatexTemplate = getTemplate;

// Escape in one pass so inserted control sequences are not escaped again.
function escapeLatex(text: string): string {
  const escapes: Record<string, string> = { "\\": "\\textbackslash{}", "&": "\\&", "%": "\\%", "$": "\\$", "#": "\\#", "_": "\\_", "{": "\\{", "}": "\\}", "~": "\\textasciitilde{}", "^": "\\textasciicircum{}" };
  return text.replace(/[\\&%$#_{}~^]/g, c => escapes[c]);
}

/** Editable source uses the same content and template. TeX engines paginate independently. */
export function generateLatex(content: ResumeContent, templateId: string): string {
  const template = getTemplate(templateId);
  const margin = template.layout.margins;
  const body = resumeBlocks(content).map(block => {
    const text = escapeLatex(block.text);
    if (block.kind === "name") return `\\begin{${template.layout.headerStyle === "centered" ? "center" : "flushleft"}}{\\LARGE\\bfseries ${text}}\\end{${template.layout.headerStyle === "centered" ? "center" : "flushleft"}}`;
    if (block.kind === "section") return `\\section*{${text}}`;
    if (block.kind === "entry") return `\\needspace{3\\baselineskip}\\noindent\\textbf{${text}}\\par`;
    if (block.kind === "bullet") return `\\noindent\\hangindent=12pt \\textbullet\\ ${text}\\par`;
    return `\\noindent ${text}\\par`;
  }).join("\n");
  return `\\documentclass[a4paper,11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{${template.fonts.body.startsWith("Times") ? "mathptmx" : "helvet"}}
${template.fonts.body.startsWith("Times") ? "" : "\\renewcommand{\\familydefault}{\\sfdefault}"}
\\usepackage[top=${margin.top}bp,bottom=${margin.bottom}bp,left=${margin.left}bp,right=${margin.right}bp]{geometry}
\\usepackage{xcolor,titlesec,needspace}
\\input{glyphtounicode}
\\pdfgentounicode=1
\\pagestyle{empty}
\\definecolor{accent}{HTML}{${template.colors.accent.slice(1)}}
\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0em}{}${template.layout.showDividers ? "[\\titlerule]" : ""}
\\titlespacing{\\section}{0pt}{${template.layout.sectionSpacing}pt}{4pt}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{3pt}
\\emergencystretch=3em
\\begin{document}
${body}
\\end{document}
`;
}
