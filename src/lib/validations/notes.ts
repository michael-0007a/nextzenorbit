/**
 * AI notes validation schemas
 */

import { z } from "zod";

export const aiNoteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.string().max(120),
  topic: z.string().min(1).max(200),
  generated_content: z.string().min(1).max(20000),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createAiNoteSchema = z.object({
  role: z.string().max(120).optional().default(""),
  topic: z.string().min(1).max(200),
  generated_content: z.string().min(1).max(20000),
});

export const updateAiNoteSchema = createAiNoteSchema.partial();

export type AiNote = z.infer<typeof aiNoteSchema>;
export type CreateAiNoteInput = z.infer<typeof createAiNoteSchema>;
export type UpdateAiNoteInput = z.infer<typeof updateAiNoteSchema>;
