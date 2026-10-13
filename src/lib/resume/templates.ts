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
    sidebar?: { width: number; gap: number };
    nameSize?: number;
    sectionCase?: "upper";
  };
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
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
RESUME_TEMPLATES.push(
  {
    id: "jake", name: "Jake's Resume", description: "The most-used tech resume: centered header, ruled sections, dates aligned right.",
    preview: "/templates/jake.png", category: "minimal", isPro: false,
    colors: { primary: "#000000", secondary: "#000000", text: "#000000", muted: "#333333", background: "#ffffff", accent: "#000000" },
    fonts: { heading: "Times-Bold", body: "Times-Roman" },
    layout: { margins: { top: 36, right: 40, bottom: 36, left: 40 }, headerStyle: "centered", sectionSpacing: 10, showDividers: true, entryStyle: "split", nameSize: 24, sectionCase: "upper" },
  },
  {
    id: "deedy", name: "Deedy Two-Column", description: "Two columns: education and skills in a sidebar, experience in the main column.",
    preview: "/templates/deedy.png", category: "modern", isPro: false,
    colors: { primary: "#1f2937", secondary: "#374151", text: "#1f2937", muted: "#6b7280", background: "#ffffff", accent: "#2b6cb0" },
    fonts: { heading: "Helvetica-Bold", body: "Helvetica" },
    layout: { margins: { top: 34, right: 34, bottom: 34, left: 34 }, headerStyle: "left", sectionSpacing: 10, showDividers: false, entryStyle: "split", sidebar: { width: 158, gap: 18 }, nameSize: 26, sectionCase: "upper" },
  },
  {
    id: "awesome", name: "Awesome CV", description: "Polished modern resume with colored headings and right-aligned dates.",
    preview: "/templates/awesome.png", category: "professional", isPro: false,
    colors: { primary: "#1a1a1a", secondary: "#333333", text: "#1a1a1a", muted: "#5d5d5d", background: "#ffffff", accent: "#b91c1c" },
    fonts: { heading: "Helvetica-Bold", body: "Helvetica" },
    layout: { margins: { top: 38, right: 40, bottom: 38, left: 40 }, headerStyle: "centered", sectionSpacing: 11, showDividers: true, entryStyle: "split", nameSize: 26, sectionCase: "upper" },
  },
);

// Contract layouts retain the reference's summary -> skills -> experience order.
RESUME_TEMPLATES.push(
  { ...RESUME_TEMPLATES[1], id: "c2c-consultant", resumeType: "c2c", name: "Contract Consultant", description: "Reference-inspired contract resume with a detailed summary and grouped skills.", colors: { ...RESUME_TEMPLATES[1].colors, primary: "#111111", accent: "#111111" }, layout: { ...RESUME_TEMPLATES[1].layout, margins: {top:54,right:54,bottom:54,left:54}, showDividers: true } },
  { ...RESUME_TEMPLATES[0], id: "c2c-classic", resumeType: "c2c", name: "Contract Classic", description: "Traditional serif headings and complete project history.", layout: { ...RESUME_TEMPLATES[0].layout, headerStyle: "left" } },
  { ...RESUME_TEMPLATES[2], id: "c2c-modern", resumeType: "c2c", name: "Contract Modern", description: "Centered contact header and blue section dividers.", colors: { ...RESUME_TEMPLATES[2].colors, primary: "#123858", accent: "#215b86" }, layout: { ...RESUME_TEMPLATES[2].layout, headerStyle: "centered", showDividers: true } },
);

export function templatesForType(type: "corporate" | "c2c") {
  return RESUME_TEMPLATES.filter(template => (template.resumeType || "corporate") === type);
}

export function getTemplate(id: string): ResumeTemplate {
  const aliases: Record<string, string> = { "classic-professional": "classic", "modern-tech": "modern", "deedy-resume": "deedy", "academic-cv": "classic", "jake-resume": "jake", "awesome-cv": "awesome", "software-engineer": "modern" };
  return RESUME_TEMPLATES.find((t) => t.id === (aliases[id] || id)) ?? RESUME_TEMPLATES[0];
}

export function getFreeTemplates(): ResumeTemplate[] {
  return RESUME_TEMPLATES.filter((t) => !t.isPro);
}

export function getProTemplates(): ResumeTemplate[] {
  return RESUME_TEMPLATES.filter((t) => t.isPro);
}

