/**
 * GET /api/admin/messages — client threads with unread client messages, newest first.
 * Admins see their assigned clients; supervisors and super admins see all.
 */

import { NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { assignedClientIds } from "@/lib/admin/assignments";
import { createAdminClient } from "@/lib/supabase/admin";
import { unreadThreads } from "@/lib/messages";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

export async function GET(): Promise<Response> {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;
  try {
    const threads = await unreadThreads(auth.role === "admin" ? await assignedClientIds(auth.userId) : null);
    const ids = threads.map((t) => t.client_id);
    const { data: clients } = ids.length
      ? await createAdminClient().from("users").select("id, email, profile:profiles!profiles_user_id_fkey(full_name)").in("id", ids)
      : { data: [] };
    const byId = new Map((clients ?? []).map((c) => [c.id, c]));
    const data = threads.map((t) => {
      const client = byId.get(t.client_id) as { email?: string; profile?: { full_name?: string | null } | { full_name?: string | null }[] | null } | undefined;
      const profile = Array.isArray(client?.profile) ? client?.profile[0] : client?.profile;
      return { ...t, name: profile?.full_name || client?.email || "Client" };
    });
    return NextResponse.json(apiSuccess(data), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Unable to load messages.", 503);
  }
}
