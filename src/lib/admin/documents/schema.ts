import { z } from "zod";
import { resumeContentFormSchema } from "@/lib/validations/resume";
export const documentPayloadSchema = z.object({
  resume: resumeContentFormSchema,
  letter: z.string().max(30000).default(""),
  templateId: z.string().max(50).default("classic"),
  jobDescription: z.string().max(15000).default(""),
  company: z.string().max(200).default(""),
  jobTitle: z.string().max(200).default(""),
});
export const adminDocumentSchema = z.object({
  id: z.string().uuid(), kind: z.enum(["resume", "cover_letter"]), title: z.string().trim().min(1).max(200),
  payload: documentPayloadSchema, clientId: z.string().uuid().nullable().optional(),
});
export type AdminDocumentPayload = z.infer<typeof documentPayloadSchema>;
export type AdminDocument = {id:string;kind:"resume"|"cover_letter";title:string;payload:AdminDocumentPayload;updated_at:string};
