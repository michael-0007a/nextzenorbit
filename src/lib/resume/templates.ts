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

