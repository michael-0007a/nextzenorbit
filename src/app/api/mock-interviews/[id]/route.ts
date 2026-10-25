/** GET /api/mock-interviews/[id] — one session, owner only. */

import { NextResponse } from "next/server";
import { getCachedUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { user } = await getCachedUser();
  if (!user) return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError(ERROR_CODES.NOT_FOUND, "Interview not found.", 404);
  const { data } = await createAdminClient().from("mock_interviews").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!data) return apiError(ERROR_CODES.NOT_FOUND, "Interview not found.", 404);
  return NextResponse.json(apiSuccess(data), { headers: { "Cache-Control": "private, no-store" } });
}
