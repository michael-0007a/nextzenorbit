import { createAdminClient } from "@/lib/supabase/admin";
import type { Result } from "@/types/api";
import type { ProjectRow } from "@/types/database";
import { ensureUserRecord } from "@/services/users-service";

export type ProjectInput = {
  title: string;
  github_url?: string | null;
  description?: string | null;
  tech_stack?: string[];
  screenshots?: string[];
};

export async function listProjects(userId: string): Promise<Result<ProjectRow[]>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  return { ok: true, data: data as any || [] };
}

export async function getProjectById(
  userId: string,
  projectId: string
): Promise<Result<ProjectRow>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("*")
    .eq("id", projectId)
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

export async function createProject(
  userId: string,
  email: string,
  input: ProjectInput
): Promise<Result<ProjectRow>> {
  const admin = createAdminClient();
  const ensured = await ensureUserRecord(admin, userId, email);

  if (!ensured.ok) {
    return ensured;
  }

  const { data, error } = await admin
    .from("projects")
    .insert({
      user_id: userId,
      title: input.title,
      github_url: input.github_url ?? null,
      description: input.description ?? null,
      tech_stack: input.tech_stack ?? [],
      screenshots: input.screenshots ?? [],
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  return { ok: true, data: data as any };
}

export async function updateProject(
  userId: string,
  projectId: string,
  updates: Partial<ProjectInput>
): Promise<Result<ProjectRow>> {
  const admin = createAdminClient();
  const payload: Partial<ProjectRow> = {};

  if (updates.title !== undefined) {
    payload.title = updates.title;
  }

  if (updates.github_url !== undefined) {
    payload.github_url = updates.github_url;
  }

  if (updates.description !== undefined) {
    payload.description = updates.description;
  }

  if (updates.tech_stack !== undefined) {
    payload.tech_stack = updates.tech_stack;
  }

  if (updates.screenshots !== undefined) {
    payload.screenshots = updates.screenshots;
  }

  if (Object.keys(payload).length === 0) {
    return { ok: false, error: new Error("NO_UPDATES") };
  }

  const { data, error } = await admin
    .from("projects")
    .update(payload)
    .eq("id", projectId)
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

export async function deleteProject(
  userId: string,
  projectId: string
): Promise<Result<{ id: string }>> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }

  return { ok: true, data: { id: projectId } };
}
