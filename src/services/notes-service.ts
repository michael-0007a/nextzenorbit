import { createAdminClient } from "@/lib/supabase/admin";
import type { Result } from "@/types/api";
import type { AiNoteRow } from "@/types/database";
import { ensureUserRecord } from "@/services/users-service";

export type AiNoteInput = {
  role?: string;
  topic: string;
  generated_content: string;
};

export async function listNotes(
  userId: string,
  filters?: { role?: string; topic?: string }
): Promise<Result<AiNoteRow[]>> {
  const admin = createAdminClient();
  let query = admin
    .from("ai_notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (filters?.role) {
    query = query.eq("role", filters.role);
  }

  if (filters?.topic) {
    query = query.eq("topic", filters.topic);
  }

  const { data, error } = await query;

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  return { ok: true, data: data as any || [] };
}

export async function getNoteById(
  userId: string,
  noteId: string
): Promise<Result<AiNoteRow>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ai_notes")
    .select("*")
    .eq("id", noteId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  if (!data) {
    return { ok: false, error: new Error("NOT_FOUND") };
  }

  return { ok: true, data: data as any };
}

export async function upsertNote(
  userId: string,
  email: string,
  input: AiNoteInput
): Promise<Result<AiNoteRow>> {
  const admin = createAdminClient();
  const ensured = await ensureUserRecord(admin, userId, email);

  if (!ensured.ok) {
    return ensured;
  }

  const payload = {
    user_id: userId,
    role: input.role ?? "",
    topic: input.topic,
    generated_content: input.generated_content,
  };

  const { data, error } = await admin
    .from("ai_notes")
    .upsert(payload, { onConflict: "user_id,role,topic" })
    .select()
    .single();

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  return { ok: true, data: data as any };
}

export async function updateNote(
  userId: string,
  noteId: string,
  updates: Partial<AiNoteInput>
): Promise<Result<AiNoteRow>> {
  const admin = createAdminClient();
  const payload: Partial<AiNoteRow> = {};

  if (updates.role !== undefined) {
    payload.role = updates.role;
  }

  if (updates.topic !== undefined) {
    payload.topic = updates.topic;
  }

  if (updates.generated_content !== undefined) {
    payload.generated_content = updates.generated_content;
  }

  if (Object.keys(payload).length === 0) {
    return { ok: false, error: new Error("NO_UPDATES") };
  }

  const { data, error } = await admin
    .from("ai_notes")
    .update(payload)
    .eq("id", noteId)
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  if (!data) {
    return { ok: false, error: new Error("NOT_FOUND") };
  }

  return { ok: true, data: data as any };
}

export async function deleteNote(
  userId: string,
  noteId: string
): Promise<Result<{ id: string }>> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("ai_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", userId);

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  return { ok: true, data: { id: noteId } };
}
