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
      heading: "Helvetica-Bold",
      body: "Helvetica",
    },
    layout: {
      margins: { top: 40, right: 40, bottom: 40, left: 40 },
      headerStyle: "centered",
      sectionSpacing: 16,
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
      accent: "#3b82f6",
    },
    fonts: {
      heading: "Helvetica-Bold",
      body: "Helvetica",
    },
    layout: {
      margins: { top: 36, right: 36, bottom: 36, left: 36 },
      headerStyle: "left",
      sectionSpacing: 14,
      showDividers: false,
    },
  },
  {
    id: "executive",
    name: "Executive",
    description: "Sophisticated and bold. Ideal for senior leadership positions.",
    preview: "/templates/executive.png",
    category: "professional",
    isPro: true,
    colors: {
      primary: "#0d1b2a",
      secondary: "#1b263b",
      text: "#0d1b2a",
      muted: "#64748b",
      background: "#ffffff",
      accent: "#415a77",
    },
    fonts: {
      heading: "Helvetica-Bold",
      body: "Helvetica",
    },
    layout: {
      margins: { top: 48, right: 48, bottom: 48, left: 48 },
      headerStyle: "centered",
      sectionSpacing: 18,
      showDividers: true,
    },
  },
  {
    id: "creative",
    name: "Creative",
    description: "Stand out with a unique layout. Perfect for design and marketing.",
    preview: "/templates/creative.png",
    category: "creative",
    isPro: true,
    colors: {
      primary: "#2d3436",
      secondary: "#636e72",
      text: "#2d3436",
      muted: "#74b9ff",
      background: "#ffffff",
      accent: "#6c5ce7",
    },
    fonts: {
      heading: "Helvetica-Bold",
      body: "Helvetica",
    },
    layout: {
      margins: { top: 32, right: 32, bottom: 32, left: 32 },
      headerStyle: "split",
      sectionSpacing: 12,
      showDividers: false,
    },
  },
  {
    id: "ats-friendly",
    name: "ATS Optimized",
    description: "Maximum compatibility with applicant tracking systems.",
    preview: "/templates/ats.png",
    category: "minimal",
    isPro: false,
    colors: {
      primary: "#000000",
      secondary: "#333333",
      text: "#000000",
      muted: "#666666",
      background: "#ffffff",
      accent: "#000000",
    },
    fonts: {
      heading: "Helvetica-Bold",
      body: "Helvetica",
    },
    layout: {
      margins: { top: 50, right: 50, bottom: 50, left: 50 },
      headerStyle: "left",
      sectionSpacing: 12,
      showDividers: true,
    },
  },
  {
    id: "compact",
    name: "Compact",
    description: "Fit more content in one page. Great for experienced professionals.",
    preview: "/templates/compact.png",
    category: "minimal",
    isPro: true,
    colors: {
      primary: "#1e293b",
      secondary: "#334155",
      text: "#1e293b",
      muted: "#64748b",
      background: "#ffffff",
      accent: "#0ea5e9",
    },
    fonts: {
      heading: "Helvetica-Bold",
      body: "Helvetica",
    },
    layout: {
      margins: { top: 28, right: 28, bottom: 28, left: 28 },
      headerStyle: "left",
      sectionSpacing: 10,
      showDividers: false,
    },
  },
];

export function getTemplate(id: string): ResumeTemplate {
  return RESUME_TEMPLATES.find((t) => t.id === id) ?? RESUME_TEMPLATES[0];
}

export function getFreeTemplates(): ResumeTemplate[] {
  return RESUME_TEMPLATES.filter((t) => !t.isPro);
}

export function getProTemplates(): ResumeTemplate[] {
  return RESUME_TEMPLATES.filter((t) => t.isPro);
}

