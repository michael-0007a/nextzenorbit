/**
 * Profile Validation Schemas
 *
 * Zod schemas for profile CRUD operations.
 */

import { z } from "zod";

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100).optional(),
  phone: z
    .string()
    .max(20)
    .optional()
    .nullable()
    .transform((v) => v || null),
  headline: z
    .string()
    .max(200)
    .optional()
    .nullable()
    .transform((v) => v || null),
  location: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((v) => v || null),
  linkedin_url: z
    .string()
    .url("Invalid URL")
    .max(250)
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  avatar_url: z
    .string()
    .url("Invalid URL")
    .max(500)
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

