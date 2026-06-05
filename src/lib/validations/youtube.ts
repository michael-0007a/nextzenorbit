/**
 * YouTube resource validation schemas
 */

import { z } from "zod";

export const youtubeResourceSchema = z.object({
  id: z.string().uuid(),
  career_id: z.string().uuid().optional().nullable(),
  role: z.string().min(1).max(150),
  title: z.string().min(1).max(300),
  url: z.string().url().max(500),
  thumbnail: z.string().url().max(500).optional().nullable(),
  channel: z.string().max(200).optional().nullable(),
  topic: z.string().max(200).optional().nullable(),
  difficulty: z.string().max(50).optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createYoutubeResourceSchema = z.object({
  career_id: z.string().uuid().optional().nullable(),
  role: z.string().min(1).max(150),
  title: z.string().min(1).max(300),
  url: z.string().url().max(500),
  thumbnail: z.string().url().max(500).optional().nullable(),
  channel: z.string().max(200).optional().nullable(),
  topic: z.string().max(200).optional().nullable(),
  difficulty: z.string().max(50).optional().nullable(),
});

export const updateYoutubeResourceSchema = createYoutubeResourceSchema.partial();

export type YoutubeResource = z.infer<typeof youtubeResourceSchema>;
export type CreateYoutubeResourceInput = z.infer<typeof createYoutubeResourceSchema>;
export type UpdateYoutubeResourceInput = z.infer<typeof updateYoutubeResourceSchema>;
