/**
 * Resume Templates — Nextzen Orbit
 *
 * Defines available resume templates with styling configurations.
 * Each template has metadata and PDF style definitions.
 */

export interface ResumeTemplate {
  resumeType?: "corporate" | "c2c";
  id: string;
  name: string;
  description: string;
  preview: string; // Preview image path
  category: "professional" | "modern" | "creative" | "minimal";
  isPro: boolean; // Requires paid subscription
  colors: {
    primary: string;
    secondary: string;
    text: string;
    muted: string;
    background: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: {
    margins: { top: number; right: number; bottom: number; left: number };
    headerStyle: "centered" | "left" | "split";
    sectionSpacing: number;
    showDividers: boolean;
    /** "split": organization + location on one line, title + dates on the next (Jake's Resume style). */
    entryStyle?: "stacked" | "split";
    /** Two-column layout: education, skills, certifications and languages go in a left sidebar (Deedy style). */
    sidebar?: { width: number; gap: number; position?: "left" | "right" };
    nameSize?: number;
    sectionCase?: "upper";
    /** Bold the job keywords stored in content.layout.highlights inside bullets (max 2 per bullet). */
    highlightKeywords?: boolean;
  };
}

/** Original designs, kept only as the base of the contract (C2C) templates; not offered for corporate resumes. */
const LEGACY: ResumeTemplate[] = [
  {
    id: "classic",
    name: "Classic Professional",
    description: "Clean, traditional layout. Perfect for corporate and finance roles.",
    preview: "/templates/classic.png",
    category: "professional",
    isPro: false,
    colors: {
      primary: "#1a1a2e",
      secondary: "#16213e",
      text: "#1a1a2e",
      muted: "#6b7280",
      background: "#ffffff",
      accent: "#0f4c75",
    },
    fonts: {
      heading: "Times-Bold",
      body: "Times-Roman",
    },
    layout: {
      margins: { top: 40, right: 42, bottom: 40, left: 42 },
      headerStyle: "centered",
      sectionSpacing: 12,
      showDividers: true,
    },
  },
  {
    id: "modern",
    name: "Modern Minimal",
    description: "Contemporary design with clean lines. Great for tech and startups.",
    preview: "/templates/modern.png",
    category: "modern",
    isPro: false,
    colors: {
      primary: "#111827",
      secondary: "#374151",
      text: "#111827",
      muted: "#6b7280",
      background: "#ffffff",
      accent: "#1e40af",
    },
    fonts: {
      heading: "Helvetica-Bold",
      body: "Helvetica",
    },
    layout: {
      margins: { top: 36, right: 36, bottom: 36, left: 36 },
      headerStyle: "left",
      sectionSpacing: 10,
      showDividers: false,
    },
  },
  {
    id: "creative",
    name: "Creative",
    description: "Stand out with a unique layout. Perfect for design and marketing.",
    preview: "/templates/creative.png",
    category: "creative",
    isPro: false,
    colors: {
      primary: "#2d3436",
      secondary: "#636e72",
      text: "#2d3436",
      muted: "#475569",
      background: "#ffffff",
      accent: "#6c5ce7",
    },
    fonts: {
      heading: "Helvetica-Bold",
      body: "Helvetica",
    },
    layout: {
      margins: { top: 42, right: 42, bottom: 42, left: 42 },
      headerStyle: "left",
      sectionSpacing: 12,
      showDividers: false,
    },
  },
];

// Popular ATS-friendly community designs, rebuilt on the shared layout plan so PDF, Word and preview match.
// The first entry is the default for new resumes and unknown template ids.
export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "harvard", name: "Harvard", description: "The Harvard career-office format: serif, centered, ruled sections. The standard for finance and consulting.",
    preview: "/templates/harvard.png", category: "professional", isPro: false,
    colors: { primary: "#000000", secondary: "#000000", text: "#111111", muted: "#333333", background: "#ffffff", accent: "#000000" },
    fonts: { heading: "Times-Bold", body: "Times-Roman" },
    layout: { margins: { top: 46, right: 50, bottom: 46, left: 50 }, headerStyle: "centered", sectionSpacing: 11, showDividers: true, entryStyle: "split", nameSize: 22 },
  },
  {
    id: "jake", name: "Jake's Resume", description: "The most-used tech resume: centered header, ruled sections, dates aligned right.",
    preview: "/templates/jake.png", category: "minimal", isPro: false,
    colors: { primary: "#000000", secondary: "#000000", text: "#000000", muted: "#333333", background: "#ffffff", accent: "#000000" },
    fonts: { heading: "Times-Bold", body: "Times-Roman" },
    layout: { margins: { top: 36, right: 40, bottom: 36, left: 40 }, headerStyle: "centered", sectionSpacing: 10, showDividers: true, entryStyle: "split", nameSize: 24, sectionCase: "upper", highlightKeywords: true },
  },
  {
    id: "deedy", name: "Deedy Two-Column", description: "Two columns: education and skills in a sidebar, experience in the main column.",
    preview: "/templates/deedy.png", category: "modern", isPro: false,
    colors: { primary: "#1f2937", secondary: "#374151", text: "#1f2937", muted: "#6b7280", background: "#ffffff", accent: "#2b6cb0" },
    fonts: { heading: "Helvetica-Bold", body: "Helvetica" },
    layout: { margins: { top: 34, right: 34, bottom: 34, left: 34 }, headerStyle: "left", sectionSpacing: 10, showDividers: false, entryStyle: "split", sidebar: { width: 158, gap: 18 }, nameSize: 26, sectionCase: "upper", highlightKeywords: true },
  },
  {
    id: "awesome", name: "Awesome CV", description: "Polished modern resume with colored headings and right-aligned dates.",
    preview: "/templates/awesome.png", category: "professional", isPro: false,
    colors: { primary: "#1a1a1a", secondary: "#333333", text: "#1a1a1a", muted: "#5d5d5d", background: "#ffffff", accent: "#b91c1c" },
    fonts: { heading: "Helvetica-Bold", body: "Helvetica" },
    layout: { margins: { top: 38, right: 40, bottom: 38, left: 40 }, headerStyle: "centered", sectionSpacing: 11, showDividers: true, entryStyle: "split", nameSize: 26, sectionCase: "upper", highlightKeywords: true },
  },
  {
    id: "faangpath", name: "FAANGPath", description: "Clean sans-serif one-column layout popular for tech roles, with bold job keywords.",
    preview: "/templates/faangpath.png", category: "modern", isPro: false,
    colors: { primary: "#111827", secondary: "#374151", text: "#111827", muted: "#4b5563", background: "#ffffff", accent: "#111827" },
    fonts: { heading: "Helvetica-Bold", body: "Helvetica" },
    layout: { margins: { top: 36, right: 38, bottom: 36, left: 38 }, headerStyle: "centered", sectionSpacing: 10, showDividers: true, entryStyle: "split", nameSize: 24, sectionCase: "upper", highlightKeywords: true },
  },
  {
    id: "altacv", name: "AltaCV", description: "Modern two-column layout with experience first and a skills sidebar on the right.",
    preview: "/templates/altacv.png", category: "creative", isPro: false,
    colors: { primary: "#1f2937", secondary: "#374151", text: "#1f2937", muted: "#6b7280", background: "#ffffff", accent: "#0e7490" },
    fonts: { heading: "Helvetica-Bold", body: "Helvetica" },
    layout: { margins: { top: 34, right: 34, bottom: 34, left: 34 }, headerStyle: "left", sectionSpacing: 10, showDividers: true, entryStyle: "split", sidebar: { width: 160, gap: 18, position: "right" }, nameSize: 26, sectionCase: "upper", highlightKeywords: true },
  },
];

// Contract layouts retain the reference's summary -> skills -> experience order.
RESUME_TEMPLATES.push(
  { ...LEGACY[1], id: "c2c-consultant", resumeType: "c2c", name: "Contract Consultant", description: "Reference-inspired contract resume with a detailed summary and grouped skills.", colors: { ...LEGACY[1].colors, primary: "#111111", accent: "#111111" }, layout: { ...LEGACY[1].layout, margins: {top:54,right:54,bottom:54,left:54}, showDividers: true } },
  { ...LEGACY[0], id: "c2c-classic", resumeType: "c2c", name: "Contract Classic", description: "Traditional serif headings and complete project history.", layout: { ...LEGACY[0].layout, headerStyle: "left" } },
  { ...LEGACY[2], id: "c2c-modern", resumeType: "c2c", name: "Contract Modern", description: "Centered contact header and blue section dividers.", colors: { ...LEGACY[2].colors, primary: "#123858", accent: "#215b86" }, layout: { ...LEGACY[2].layout, headerStyle: "centered", showDividers: true } },
);

export function templatesForType(type: "corporate" | "c2c") {
  return RESUME_TEMPLATES.filter(template => (template.resumeType || "corporate") === type);
}

export function getTemplate(id: string): ResumeTemplate {
  // Retired designs and older ids map to the closest current template, so saved resumes keep rendering.
  const aliases: Record<string, string> = { classic: "harvard", "classic-professional": "harvard", "academic-cv": "harvard", modern: "faangpath", "modern-tech": "faangpath", "software-engineer": "faangpath", creative: "awesome", "deedy-resume": "deedy", "jake-resume": "jake", "awesome-cv": "awesome" };
  return RESUME_TEMPLATES.find((t) => t.id === (aliases[id] || id)) ?? RESUME_TEMPLATES[0];
}

export function getFreeTemplates(): ResumeTemplate[] {
  return RESUME_TEMPLATES.filter((t) => !t.isPro);
}

export function getProTemplates(): ResumeTemplate[] {
  return RESUME_TEMPLATES.filter((t) => t.isPro);
}

