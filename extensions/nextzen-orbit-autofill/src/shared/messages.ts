import { z } from "zod";
import { autofillProfileSchema } from "./profile";

export const settingsSchema = z.object({
  enabled: z.boolean(),
  apiBaseUrl: z.string(),
});

export const messageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("GET_SETTINGS") }),
  z.object({ type: z.literal("SET_SETTINGS"), settings: settingsSchema.partial() }),
  z.object({ type: z.literal("SETTINGS"), settings: settingsSchema }),
  z.object({ type: z.literal("REQUEST_PROFILE") }),
  z.object({ type: z.literal("PROFILE_RESPONSE"), ok: z.boolean(), profile: autofillProfileSchema.optional(), error: z.string().optional() }),
  z.object({ type: z.literal("FILL_REQUEST") }),
  z.object({ type: z.literal("GET_PAGE_STATUS") }),
  z.object({ type: z.literal("PAGE_STATUS"), supported: z.boolean(), portal: z.string(), fields: z.number() }),
  z.object({ type: z.literal("SEND_TELEMETRY"), payload: z.object({ portal: z.string(), url: z.string(), fieldsDetected: z.number(), fieldNames: z.array(z.string()), status: z.string(), error: z.string().optional() }) }),
]);

export type ExtensionMessage = z.infer<typeof messageSchema>;
export type ProfileResponseMessage = Extract<ExtensionMessage, { type: "PROFILE_RESPONSE" }>;
export type PageStatusMessage = Extract<ExtensionMessage, { type: "PAGE_STATUS" }>;
