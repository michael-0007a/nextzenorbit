/**
 * Interview question validation schemas
 */

import { z } from "zod";

export const interviewQuestionSchema = z.object({
  id: z.string().uuid(),
  career_id: z.string().uuid().optional().nullable(),
  role: z.string().min(1).max(150),
  company: z.string().max(200).optional().nullable(),
  difficulty: z.string().max(50).optional().nullable(),
  topic: z.string().max(120).optional().nullable(),
  question: z.string().min(1).max(4000),
  answer: z.string().min(1).max(8000),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createInterviewQuestionSchema = z.object({
  career_id: z.string().uuid().optional().nullable(),
  role: z.string().min(1).max(150),
  company: z.string().max(200).optional().nullable(),
  difficulty: z.string().max(50).optional().nullable(),
  topic: z.string().max(120).optional().nullable(),
  question: z.string().min(1).max(4000),
  answer: z.string().min(1).max(8000),
});

export const updateInterviewQuestionSchema = createInterviewQuestionSchema.partial();

export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type CreateInterviewQuestionInput = z.infer<typeof createInterviewQuestionSchema>;
export type UpdateInterviewQuestionInput = z.infer<typeof updateInterviewQuestionSchema>;
