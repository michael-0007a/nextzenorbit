/**
 * Career validation schemas
 */

import { z } from "zod";

export const careerSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  icon: z.string().max(200).optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createCareerSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  icon: z.string().max(200).optional().nullable(),
});

export const updateCareerSchema = createCareerSchema.partial();

export type Career = z.infer<typeof careerSchema>;
export type CreateCareerInput = z.infer<typeof createCareerSchema>;
export type UpdateCareerInput = z.infer<typeof updateCareerSchema>;
