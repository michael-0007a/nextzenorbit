/**
 * Resume Content Schema & Validation
 *
 * Defines the structured JSONB content shape for resumes.
 * Used by API routes, AI parser, and manual entry forms.
 * Zod v4 schemas with full TypeScript inference.
 */

import { z } from "zod";

// ── Contact Info ──
// Schema for final validation - accepts any string URLs (normalization done in parser)
export const contactInfoSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").max(150),
  phone: z.string().max(20).optional().default(""),
  location: z.string().max(100).optional().default(""),
  linkedin_url: z.string().max(250).optional().default(""),
  portfolio_url: z.string().max(250).optional().default(""),
  github_url: z.string().max(250).optional().default(""),
});

// Lenient schema for editor form - allows empty values during editing
export const contactInfoFormSchema = z.object({
  full_name: z.string().max(100).default(""),
  email: z.string().max(150).default(""),
  phone: z.string().max(20).optional().default(""),
  location: z.string().max(100).optional().default(""),
  linkedin_url: z.string().max(250).optional().default(""),
  portfolio_url: z.string().max(250).optional().default(""),
  github_url: z.string().max(250).optional().default(""),
});

// ── Professional Summary ──
export const summarySchema = z.object({
  text: z.string().max(2000).optional().default(""),
});

// ── Experience Entry ──
export const experienceEntrySchema = z.object({
  id: z.string(),
  company: z.string().max(150).default(""),
  position: z.string().max(150).default(""),
  location: z.string().max(100).optional().default(""),
  start_date: z.string().max(20).default(""), // "Jan 2023" or "2023-01"
  end_date: z.string().max(20).optional().default(""), // empty = "Present"
  is_current: z.boolean().optional().default(false),
  bullets: z.array(z.string().max(500)).max(10).default([]),
});

// ── Education Entry ──
export const educationEntrySchema = z.object({
  id: z.string(),
  institution: z.string().max(200).default(""),
  degree: z.string().max(150).default(""),
  field_of_study: z.string().max(150).optional().default(""),
  location: z.string().max(100).optional().default(""),
  start_date: z.string().max(20).optional().default(""),
  end_date: z.string().max(20).optional().default(""),
  gpa: z.string().max(20).optional().default(""),
  bullets: z.array(z.string().max(500)).max(5).default([]),
});

// ── Skill ──
export const skillSchema = z.object({
  id: z.string(),
  category: z.string().max(80).optional().default(""), // e.g. "Languages", "Frameworks"
  items: z.array(z.string().max(60)).max(30).default([]),
});

// ── Project Entry ──
export const projectEntrySchema = z.object({
  id: z.string(),
  name: z.string().max(150).default(""),
  description: z.string().max(1000).optional().default(""),
  url: z.string().max(250).optional().default(""),
  technologies: z.array(z.string().max(60)).max(20).default([]),
  bullets: z.array(z.string().max(500)).max(5).default([]),
});

// ── Certification Entry ──
export const certificationEntrySchema = z.object({
  id: z.string(),
  name: z.string().max(200).default(""),
  issuer: z.string().max(150).optional().default(""),
  date: z.string().max(20).optional().default(""),
  url: z.string().max(250).optional().default(""),
});

// ── Language Entry ──
export const languageEntrySchema = z.object({
  id: z.string(),
  name: z.string().max(60).default(""),
  proficiency: z
    .enum(["native", "fluent", "advanced", "intermediate", "basic"])
    .optional()
    .default("intermediate"),
});

// ── Custom Section ──
export const customSectionSchema = z.object({
  id: z.string(),
  title: z.string().max(100).default(""),
  content: z.string().max(3000).optional().default(""),
});

// ── Full Resume Content ──
export const resumeContentSchema = z.object({
  contact: contactInfoSchema.optional().default({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    linkedin_url: "",
    portfolio_url: "",
    github_url: "",
  }),
  summary: summarySchema.optional().default({ text: "" }),
  experience: z.array(experienceEntrySchema).max(20).default([]),
  education: z.array(educationEntrySchema).max(10).default([]),
  skills: z.array(skillSchema).max(15).default([]),
  projects: z.array(projectEntrySchema).max(15).default([]),
  certifications: z.array(certificationEntrySchema).max(20).default([]),
  languages: z.array(languageEntrySchema).max(10).default([]),
  custom_sections: z.array(customSectionSchema).max(5).default([]),
});

// Lenient form schema - allows incomplete data during editing
export const resumeContentFormSchema = z.object({
  contact: contactInfoFormSchema.optional().default({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    linkedin_url: "",
    portfolio_url: "",
    github_url: "",
  }),
  summary: summarySchema.optional().default({ text: "" }),
  experience: z.array(experienceEntrySchema).max(20).default([]),
  education: z.array(educationEntrySchema).max(10).default([]),
  skills: z.array(skillSchema).max(15).default([]),
  projects: z.array(projectEntrySchema).max(15).default([]),
  certifications: z.array(certificationEntrySchema).max(20).default([]),
  languages: z.array(languageEntrySchema).max(10).default([]),
  custom_sections: z.array(customSectionSchema).max(5).default([]),
});

// ── Inferred Types ──
export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type Summary = z.infer<typeof summarySchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type Skill = z.infer<typeof skillSchema>;
export type ProjectEntry = z.infer<typeof projectEntrySchema>;
export type CertificationEntry = z.infer<typeof certificationEntrySchema>;
export type LanguageEntry = z.infer<typeof languageEntrySchema>;
export type CustomSection = z.infer<typeof customSectionSchema>;
export type ResumeContent = z.infer<typeof resumeContentSchema>;

// ── API Request Schemas ──

export const createResumeSchema = z.object({
  title: z.string().min(1, "Title is required").max(150).default("Untitled Resume"),
  content: resumeContentSchema.optional(),
  is_base: z.boolean().optional().default(false),
});

export const updateResumeSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  content: resumeContentSchema.optional(),
  template_id: z.string().max(50).nullable().optional(),
  is_base: z.boolean().optional(),
});

export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;

// ── Empty Resume Content Factory ──
export function createEmptyResumeContent(
  prefill?: Partial<ContactInfo>
): ResumeContent {
  return {
    contact: {
      full_name: prefill?.full_name ?? "",
      email: prefill?.email ?? "",
      phone: prefill?.phone ?? "",
      location: prefill?.location ?? "",
      linkedin_url: prefill?.linkedin_url ?? "",
      portfolio_url: prefill?.portfolio_url ?? "",
      github_url: prefill?.github_url ?? "",
    },
    summary: { text: "" },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    custom_sections: [],
  };
}


