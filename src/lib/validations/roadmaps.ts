/**
 * Roadmap validation schemas
 */

import { z } from "zod";

export const roadmapLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);

export const roadmapSchema = z.object({
  id: z.string().uuid(),
  career_id: z.string().uuid().optional().nullable(),
  role: z.string().min(1).max(150),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const roadmapStepSchema = z.object({
  id: z.string().uuid(),
  roadmap_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  order_index: z.number().int().min(0),
  level: roadmapLevelSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createRoadmapSchema = z.object({
  career_id: z.string().uuid().optional().nullable(),
  role: z.string().min(1).max(150),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
});

export const updateRoadmapSchema = createRoadmapSchema.partial();

export const createRoadmapStepSchema = z.object({
  roadmap_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  order_index: z.number().int().min(0),
  level: roadmapLevelSchema.optional().default("beginner"),
});

export const updateRoadmapStepSchema = createRoadmapStepSchema
  .partial()
  .omit({ roadmap_id: true });

export type Roadmap = z.infer<typeof roadmapSchema>;
export type RoadmapStep = z.infer<typeof roadmapStepSchema>;
export type CreateRoadmapInput = z.infer<typeof createRoadmapSchema>;
export type UpdateRoadmapInput = z.infer<typeof updateRoadmapSchema>;
export type CreateRoadmapStepInput = z.infer<typeof createRoadmapStepSchema>;
export type UpdateRoadmapStepInput = z.infer<typeof updateRoadmapStepSchema>;
