import { z } from "zod";

export const CONSENT_VERSION = "2026-09-16";
export const phoneSchema = z.string().trim().transform(value => value.replace(/[\s()-]/g, "")).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Enter your phone with country code, for example +919876543210."));
const optionalSalary = z.preprocess(v => v === "" || v == null ? null : Number(v), z.number().int().min(0).max(100000000).nullable());
export const onboardingProfileSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: phoneSchema,
  headline: z.string().trim().min(3).max(200),
  location: z.string().trim().min(2).max(100),
  preferred_role: z.string().trim().min(2).max(150),
  preferred_location: z.string().trim().min(2).max(100),
  preferred_work_type: z.enum(["remote", "onsite", "hybrid", "any"]),
  years_of_experience: z.preprocess(value => value === "" ? undefined : value, z.coerce.number().int().min(0).max(50)),
  linkedin_url: z.union([z.literal(""), z.string().url().max(250)]).default(""),
  preferred_salary_min: optionalSalary,
  preferred_salary_max: optionalSalary,
  preferred_portals: z.array(z.enum(["indeed", "linkedin", "naukri", "internshala", "glassdoor"])).max(5).default([]),
  consent: z.literal(true),
}).refine(v => v.preferred_salary_min === null || v.preferred_salary_max === null || v.preferred_salary_max >= v.preferred_salary_min, { message: "Maximum salary must be at least the minimum salary.", path: ["preferred_salary_max"] });
