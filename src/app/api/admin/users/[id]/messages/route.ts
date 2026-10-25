/**
 * Client ↔ team messages (staff side)
 *
 * GET  /api/admin/users/[id]/messages — thread for one client (marks client messages read)
 * POST /api/admin/users/[id]/messages — reply as the team
 * Admins must be assigned to the client; supervisors and super admins see every client.
 */

import { NextResponse } from "next/server";
import { requireAdmin, isAuthError, type AuthenticatedAdmin } from "@/lib/admin/guards";
import { denyUnassignedClient } from "@/lib/admin/assignments";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { messageBodySchema, readThread, sendMessage } from "@/lib/messages";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

const noStore = { headers: { "Cache-Control": "private, no-store" } };
type Context = { params: Promise<{ id: string }> };

async function authorize(params: Context["params"]): Promise<{ error: Response } | { auth: AuthenticatedAdmin; clientId: string }> {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return { error: auth };
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid client.", 400) };
  try {
    const denied = await denyUnassignedClient(auth, id);
    if (denied) return { error: denied };
    const { data: client } = await createAdminClient().from("users").select("role").eq("id", id).maybeSingle();
    if (!client || !["user", "sso_user"].includes(client.role)) return { error: apiError(ERROR_CODES.NOT_FOUND, "Client not found.", 404) };
  } catch {
    return { error: apiError(ERROR_CODES.INTERNAL_ERROR, "Unable to verify client access.", 503) };
  }
  return { auth, clientId: id };
}

export async function GET(_request: Request, { params }: Context): Promise<Response> {
  const result = await authorize(params);
  if ("error" in result) return result.error;
  try {
    return NextResponse.json(apiSuccess(await readThread(result.clientId, "team")), noStore);
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Unable to load messages.", 503);
  }
}

export async function POST(request: Request, { params }: Context): Promise<Response> {
  const result = await authorize(params);
  if ("error" in result) return result.error;
  const parsed = messageBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(ERROR_CODES.VALIDATION_ERROR, parsed.error.issues[0]?.message ?? "Invalid message.", 400);
  const limited = await rateLimit("team-message", result.auth.userId, 120, 600);
  if (limited) return limited;
  try {
    return NextResponse.json(apiSuccess(await sendMessage(result.clientId, result.auth.userId, true, parsed.data.body)), { status: 201, ...noStore });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Unable to send message.", 503);
  }
}
