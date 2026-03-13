/**
 * LaTeX Resume Templates — Nextzen Orbit
 *
 * Professional LaTeX templates for high-quality resume generation.
 * These templates match the Live Preview exactly.
 */

import type { ResumeContent } from "@/lib/validations/resume";

export interface LaTeXTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: "professional" | "modern" | "creative" | "academic";
  isPro: boolean;
}

export const LATEX_TEMPLATES: LaTeXTemplate[] = [
  {
    id: "classic-professional",
    name: "Classic Professional",
    description: "Clean, traditional layout perfect for corporate roles",
    preview: "/templates/latex-classic.png",
    category: "professional",
    isPro: false,
  },
  {
    id: "modern-tech",
    name: "Modern Tech",
    description: "Contemporary design for tech professionals",
    preview: "/templates/latex-modern.png",
    category: "modern",
    isPro: false,
  },
  {
    id: "deedy-resume",
    name: "Deedy Resume",
    description: "Popular two-column layout for tech professionals",
    preview: "/templates/latex-deedy.png",
    category: "modern",
    isPro: false,
  },
  {
    id: "academic-cv",
    name: "Academic CV",
    description: "Comprehensive layout for academia and research",
    preview: "/templates/latex-academic.png",
    category: "academic",
    isPro: false,
  },
  {
    id: "jake-resume",
    name: "Jake's Resume",
    description: "Highly popular single-column tech resume",
    preview: "/templates/latex-jake.png",
    category: "modern",
    isPro: false,
  },
  {
    id: "software-engineer",
    name: "Software Engineer",
    description: "Optimized for software engineering roles",
    preview: "/templates/latex-swe.png",
    category: "professional",
    isPro: false,
  },
];

function escapeLatex(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/</g, "\\textless{}")
    .replace(/>/g, "\\textgreater{}")
    .replace(/"/g, "''")
    .replace(/'/g, "'");
}

/**
 * Generate LaTeX that matches the Live Preview exactly
 * Single unified template that produces consistent output
 */
function generateUnifiedTemplate(content: ResumeContent): string {
  const { contact, summary, experience, education, skills, projects, certifications, languages } = content;

  // Build contact line with proper hyperlinks
  const contactItems: string[] = [];
  if (contact.phone) {
    contactItems.push(escapeLatex(contact.phone));
  }
  if (contact.email) {
    contactItems.push(`\\href{mailto:${contact.email}}{${escapeLatex(contact.email)}}`);
  }
  if (contact.location) {
    contactItems.push(escapeLatex(contact.location));
  }

  // Build links line with proper hyperlinks
  const linkItems: string[] = [];
  if (contact.linkedin_url) {
    linkItems.push(`\\href{${contact.linkedin_url}}{\\textcolor{linkblue}{LinkedIn}}`);
  }
  if (contact.github_url) {
    linkItems.push(`\\href{${contact.github_url}}{\\textcolor{linkblue}{GitHub}}`);
  }
  if (contact.portfolio_url) {
    linkItems.push(`\\href{${contact.portfolio_url}}{\\textcolor{linkblue}{Portfolio}}`);
  }

  return `%-------------------------
% Resume - Nextzen Orbit
% Matches Live Preview exactly
%-------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{xcolor}

% Hyperlink setup - make links clickable and colored
\\hypersetup{
    colorlinks=true,
    linkcolor=black,
    urlcolor=blue,
    citecolor=black,
    pdfborder={0 0 0}
}

% Remove page numbers
\\pagestyle{empty}

% Section formatting - matches preview with black underline
\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{6pt}

% Colors
\\definecolor{linkblue}{HTML}{0066CC}

\\begin{document}

%----------HEADER----------
\\begin{center}
    {\\LARGE\\bfseries\\MakeUppercase{${escapeLatex(contact.full_name || "Your Name")}}}\\\\[4pt]
    ${contactItems.join(" \\textbullet\\ ")}
    ${linkItems.length > 0 ? `\\\\[2pt]\n    ${linkItems.join(" \\textbullet\\ ")}` : ""}
\\end{center}

${summary?.text ? `%----------ABOUT ME----------
\\section{About Me}
${escapeLatex(summary.text)}

` : ""}
${education && education.length > 0 ? `%----------EDUCATION----------
\\section{Education}
${education.map(edu => `\\noindent\\textbf{${escapeLatex(edu.institution)}} \\hfill \\textit{--- ${escapeLatex(edu.end_date || "")}}\\\\
\\textit{${escapeLatex(edu.degree)}${edu.field_of_study ? ` in ${escapeLatex(edu.field_of_study)}` : ""}} \\hfill ${edu.gpa ? `GPA: ${escapeLatex(edu.gpa)}` : ""}
`).join("\\vspace{4pt}\n\n")}

` : ""}
${experience && experience.length > 0 ? `%----------EXPERIENCE----------
\\section{Experience}
${experience.map(exp => `\\noindent\\textbf{${escapeLatex(exp.company)}} --- \\textit{${escapeLatex(exp.position)}} \\hfill ${escapeLatex(exp.start_date)} --- ${exp.is_current ? "Present" : escapeLatex(exp.end_date)}\\\\
${exp.location ? `\\hfill \\textit{${escapeLatex(exp.location)}}\\\\` : ""}
${(exp.bullets || []).filter(b => b).length > 0 ? `\\begin{itemize}[leftmargin=1.5em, topsep=2pt, itemsep=1pt, parsep=0pt]
${(exp.bullets || []).filter(b => b).map(bullet => `  \\item --- ${escapeLatex(bullet)}`).join("\n")}
\\end{itemize}` : ""}
`).join("\\vspace{6pt}\n\n")}

` : ""}
${projects && projects.length > 0 ? `%----------PROJECTS----------
\\section{Projects}
${projects.map(proj => `\\noindent\\textbf{${escapeLatex(proj.name)}}${(proj.technologies || []).filter(t => t).length > 0 ? ` \\textbar\\ \\textit{${(proj.technologies || []).filter(t => t).map(t => escapeLatex(t)).join(", ")}}` : ""}${proj.url ? ` --- \\href{${proj.url}}{\\textcolor{linkblue}{Link}}` : ""}\\\\
${proj.description ? `\\hspace{1em}--- ${escapeLatex(proj.description)}` : ""}
`).join("\\vspace{4pt}\n\n")}

` : ""}
${skills && skills.length > 0 ? `%----------TECHNICAL SKILLS----------
\\section{Technical Skills}
${skills.map(skill => `\\noindent\\textbf{${escapeLatex(skill.category)}:} ${(skill.items || []).filter(i => i).map(i => escapeLatex(i)).join(", ")}`).join("\\\\[2pt]\n")}

` : ""}
${certifications && certifications.length > 0 ? `%----------CERTIFICATIONS----------
\\section{Certifications}
${certifications.map(cert => `\\noindent\\textbf{${escapeLatex(cert.name)}}${cert.issuer ? ` --- ${escapeLatex(cert.issuer)}` : ""}${cert.url ? ` --- \\href{${cert.url}}{\\textcolor{linkblue}{View}}` : ""}${cert.date ? ` \\textit{(${escapeLatex(cert.date)})}` : ""}`).join("\\\\[2pt]\n")}

` : ""}
${languages && languages.length > 0 ? `%----------LANGUAGES----------
\\section{Languages}
${languages.map(lang => `${escapeLatex(lang.name)}${lang.proficiency ? ` (${escapeLatex(lang.proficiency)})` : ""}`).join(" \\textbullet\\ ")}
` : ""}

\\end{document}
`;
}

/**
 * Main function to generate LaTeX code based on template
 * All templates now use the unified template for consistency
 */
export function generateLatex(content: ResumeContent, templateId: string): string {
  // All templates use the same unified format that matches the preview
  return generateUnifiedTemplate(content);
}

export function getLatexTemplate(id: string): LaTeXTemplate | undefined {
  return LATEX_TEMPLATES.find((t) => t.id === id);
}

