/**
 * Projects validation schemas
 */

import { z } from "zod";

const optionalUrl = z.string().url().max(500).optional().nullable();
const optionalText = z.string().max(2000).optional().nullable();

export const projectSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  github_url: optionalUrl,
  description: optionalText,
  tech_stack: z.array(z.string().max(80)).max(30),
  screenshots: z.array(z.string().url().max(500)).max(10),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const normalizedUrl = z
  .string()
  .url()
  .max(500)
  .optional()
  .nullable()
  .or(z.literal(""))
  .transform((value) => value || null);

const normalizedText = z
  .string()
  .max(2000)
  .optional()
  .nullable()
  .transform((value) => value || null);

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  github_url: normalizedUrl,
  description: normalizedText,
  tech_stack: z.array(z.string().max(80)).max(30).optional().default([]),
  screenshots: z.array(z.string().url().max(500)).max(10).optional().default([]),
});

export const updateProjectSchema = createProjectSchema.partial();

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
