/**
 * Client ↔ team messages (client side)
 *
 * GET  /api/messages — the signed-in client's thread (marks team replies read)
 * POST /api/messages — send a message to the client's team
 */

import { NextResponse } from "next/server";
import { getCachedUser } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { messageBodySchema, readThread, sendMessage } from "@/lib/messages";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

const noStore = { headers: { "Cache-Control": "private, no-store" } };

export async function GET(): Promise<Response> {
  const { user } = await getCachedUser();
  if (!user) return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
  try {
    return NextResponse.json(apiSuccess(await readThread(user.id, "client")), noStore);
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Unable to load messages.", 503);
  }
}

export async function POST(request: Request): Promise<Response> {
  const { user } = await getCachedUser();
  if (!user) return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
  const parsed = messageBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(ERROR_CODES.VALIDATION_ERROR, parsed.error.issues[0]?.message ?? "Invalid message.", 400);
  const limited = await rateLimit("client-message", user.id, 30, 600);
  if (limited) return limited;
  try {
    return NextResponse.json(apiSuccess(await sendMessage(user.id, user.id, false, parsed.data.body)), { status: 201, ...noStore });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Unable to send message.", 503);
  }
}
