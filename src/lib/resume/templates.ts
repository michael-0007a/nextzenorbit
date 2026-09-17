/**
 * Resume Templates — Nextzen Orbit
 *
 * Defines available resume templates with styling configurations.
 * Each template has metadata and PDF style definitions.
 */

export interface ResumeTemplate {
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

export function getTemplate(id: string): ResumeTemplate {
  const aliases: Record<string, string> = { "classic-professional": "classic", "modern-tech": "modern", "deedy-resume": "creative", "academic-cv": "classic", "jake-resume": "classic", "software-engineer": "modern" };
  return RESUME_TEMPLATES.find((t) => t.id === (aliases[id] || id)) ?? RESUME_TEMPLATES[0];
}

export function getFreeTemplates(): ResumeTemplate[] {
  return RESUME_TEMPLATES.filter((t) => !t.isPro);
}

export function getProTemplates(): ResumeTemplate[] {
  return RESUME_TEMPLATES.filter((t) => t.isPro);
}

