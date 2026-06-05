/**
 * Job validation schemas
 */

import { z } from "zod";

export const jobSchema = z.object({
  id: z.string().uuid(),
  company: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  description: z.string().max(8000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  apply_url: z.string().url().max(500).optional().nullable(),
  source: z.string().min(1).max(50),
  tags: z.array(z.string().max(50)),
  source_ref: z.string().max(200).optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createJobSchema = z.object({
  company: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  description: z.string().max(8000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  apply_url: z.string().url().max(500).optional().nullable(),
  source: z.string().min(1).max(50),
  tags: z.array(z.string().max(50)).optional().default([]),
  source_ref: z.string().max(200).optional().nullable(),
});

export const updateJobSchema = createJobSchema.partial();

export type Job = z.infer<typeof jobSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
