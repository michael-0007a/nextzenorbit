/**
 * AI Notes API — List + Upsert
 *
 * GET  /api/ai-notes
 * POST /api/ai-notes
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAiNoteSchema } from "@/lib/validations/notes";
import { apiError, ERROR_CODES } from "@/types/api";
import { listNotes, upsertNote } from "@/services/notes-service";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    const params = request.nextUrl.searchParams;
    const role = params.get("role")?.trim();
    const topic = params.get("topic")?.trim();

    const result = await listNotes(user.id, {
      role: role || undefined,
      topic: topic || undefined,
    });

    if (!result.ok) {
      console.error("AI notes list error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch notes.", 500);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("AI notes list error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    if (!user.email) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "User email is missing.", 400);
    }

    const body = await request.json();
    const parsed = createAiNoteSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid note data.", 400, parsed.error.flatten());
    }

    const result = await upsertNote(user.id, user.email, parsed.data);

    if (!result.ok) {
      console.error("AI notes upsert error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to save note.", 500);
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (err) {
    console.error("AI notes upsert error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
