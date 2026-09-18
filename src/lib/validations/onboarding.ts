import { z } from "zod";

export const CONSENT_VERSION = "2026-09-17";
export const COUNTRIES = { us: "United States", in: "India", gb: "United Kingdom", ca: "Canada", au: "Australia", nz: "New Zealand", sg: "Singapore", za: "South Africa", other: "Other country" } as const;
export const EXPERIENCE_RANGES = ["Less than 1 year", "1–2 years", "3–5 years", "6–10 years", "10–15 years", "15+ years"] as const;
export const VISA_STATUSES = ["U.S. Citizen", "Permanent Resident / Green Card", "F-1 OPT", "F-1 STEM OPT", "H-1B", "O-1", "L-1", "TN / E-3", "Other"] as const;
export const GENDERS = ["Male", "Female", "Non-binary / Third gender", "Prefer to self-describe", "Prefer not to say"] as const;
export const ETHNICITIES = ["Hispanic or Latino", "White", "Black or African American", "Asian", "Native Hawaiian or Other Pacific Islander", "American Indian or Alaska Native", "Two or More Races", "Prefer not to say"] as const;
export const REFERRAL_SOURCES = ["LinkedIn", "Indeed", "Glassdoor", "Company Website", "Referral", "Job Fair/Event", "University/Campus", "Social Media", "Other"] as const;
export const phoneSchema = z.string().trim().transform(value => value.replace(/[\s()-]/g, "")).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Enter your phone with country code, for example +919876543210."));
const text = (max = 200) => z.string().trim().max(max).default("");
const yesNo = z.enum(["yes", "no"]);
const optionalSalary = z.preprocess(v => v === "" || v == null ? null : Number(v), z.number().int().min(0).max(100000000).nullable());
const url = z.union([z.literal(""), z.string().url().max(500).refine(value => /^https?:\/\//i.test(value), "Use an https:// or http:// URL.")]).default("");
const date = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value, "Enter a valid date.")]).default("");
export const onboardingBasicSchema = z.object({
  full_name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254), phone: phoneSchema,
  target_country: z.enum(["us", "in", "gb", "ca", "au", "nz", "sg", "za", "other"]), other_country: text(100),
  location: text(100), current_company: text(), current_job_title: text(),
  experience_range: z.enum(EXPERIENCE_RANGES),
  notice_period: z.enum(["", "Immediately available", "1 week", "2 weeks", "1 month", "2 months", "3 months"]).default(""),
  expected_annual_salary: optionalSalary, other_currency: z.string().trim().toUpperCase().regex(/^$|^[A-Z]{3}$/, "Use a three-letter currency code, for example EUR.").default(""), preferred_start_date: date,
  linkedin_url: url, github_url: url, portfolio_url: url, cover_letter: text(10000),
  referral_source: z.enum(["", ...REFERRAL_SOURCES]).default(""),
  preferred_role: z.string().trim().min(2).max(150), preferred_location: text(100),
  preferred_work_type: z.enum(["remote", "onsite", "hybrid", "any"]).default("any"),
}).refine(value => value.target_country !== "other" || value.other_country.length >= 2, { path: ["other_country"], message: "Specify the country where you want to work." })
  .refine(value => value.target_country !== "other" || value.expected_annual_salary === null || !!value.other_currency, { path: ["other_currency"], message: "Specify the currency for your expected salary." });
export const immigrationSchema = z.object({
  authorized: yesNo, sponsorship: yesNo, status: z.enum(VISA_STATUSES), other_status: text(),
  cpt_required: yesNo.optional(), stem_degree: yesNo.optional(), ead_expiration: date,
  held_h1b: yesNo, held_j1: yesNo, j1_residency_requirement: yesNo.optional(),
  i140_filed: yesNo, future_sponsorship: yesNo, certified: z.literal(true),
}).superRefine((value, ctx) => {
  const require = (key: "other_status" | "cpt_required" | "stem_degree" | "j1_residency_requirement") => { if (!value[key]) ctx.addIssue({ code: "custom", path: [key], message: "This answer is required." }); };
  if (value.status === "Other") require("other_status");
  if (["F-1 OPT", "F-1 STEM OPT"].includes(value.status)) { require("cpt_required"); require("stem_degree"); }
  if (value.held_j1 === "yes") require("j1_residency_requirement");
}).transform(value => ({ ...value, other_status: value.status === "Other" ? value.other_status : "", ...(!["F-1 OPT", "F-1 STEM OPT"].includes(value.status) ? { cpt_required: undefined, stem_degree: undefined, ead_expiration: "" } : {}), j1_residency_requirement: value.held_j1 === "yes" ? value.j1_residency_requirement : undefined }));
export const workAuthorizationSchema = z.object({ authorized: yesNo, sponsorship: yesNo, restrictions: text(1000), permit_expiration: date, certified: z.literal(true) });
export const eeoSchema = z.object({
  gender: z.enum(["", ...GENDERS]).default(""), gender_description: text(),
  ethnicity: z.array(z.enum(ETHNICITIES)).max(8).default([]),
  disability: z.enum(["", "Yes", "No", "Prefer not to answer"]).default(""),
  veteran: z.enum(["", "Yes", "No", "Prefer not to say"]).default(""), acknowledged: z.literal(true),
}).superRefine((value, ctx) => {
  if (value.gender === "Prefer to self-describe" && !value.gender_description) ctx.addIssue({ code: "custom", path: ["gender_description"], message: "Describe your gender or choose another option." });
  if (value.ethnicity.includes("Prefer not to say") && value.ethnicity.length > 1) ctx.addIssue({ code: "custom", path: ["ethnicity"], message: "Choose either an ethnicity or Prefer not to say." });
}).transform(value => ({ ...value, gender_description: value.gender === "Prefer to self-describe" ? value.gender_description : "" }));
export const onboardingProfileSchema = onboardingBasicSchema.safeExtend({
  immigration: z.unknown().optional(), work_authorization: z.unknown().optional(), eeo: eeoSchema, consent: z.literal(true),
}).superRefine((value, ctx) => {
  const field = value.target_country === "us" ? "immigration" : value.target_country === "in" ? null : "work_authorization";
  if (!field) return;
  const result = (field === "immigration" ? immigrationSchema : workAuthorizationSchema).safeParse(value[field]);
  if (!result.success) result.error.issues.forEach(issue => ctx.addIssue({ ...issue, path: [field, ...issue.path] }));
}).transform(value => ({ ...value,
  immigration: value.target_country === "us" ? immigrationSchema.parse(value.immigration) : null,
  work_authorization: !["us", "in"].includes(value.target_country) ? workAuthorizationSchema.parse(value.work_authorization) : null,
  // Retain existing profile consumers; the exact range remains available separately.
  years_of_experience: [0, 1, 3, 6, 10, 15][EXPERIENCE_RANGES.indexOf(value.experience_range)],
  headline: value.current_job_title || value.preferred_role,
  salary_currency: ({ us: "USD", in: "INR", gb: "GBP", ca: "CAD", au: "AUD", nz: "NZD", sg: "SGD", za: "ZAR", other: value.other_currency })[value.target_country],
}));
