import { z } from "zod";

export const autofillEducationSchema = z.object({
  institution: z.string().default(""),
  degree: z.string().default(""),
  fieldOfStudy: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  location: z.string().default(""),
  gpa: z.string().default(""),
});

export const autofillExperienceSchema = z.object({
  company: z.string().default(""),
  position: z.string().default(""),
  location: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});

export const autofillProfileSchema = z.object({
  fullName: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  linkedinUrl: z.string().default(""),
  githubUrl: z.string().default(""),
  portfolioUrl: z.string().default(""),
  skills: z.array(z.string()).default([]),
  education: z.array(autofillEducationSchema).default([]),
  experience: z.array(autofillExperienceSchema).default([]),
  resumeUrl: z.string().nullable().default(null),
});

export type AutofillProfile = z.infer<typeof autofillProfileSchema>;
