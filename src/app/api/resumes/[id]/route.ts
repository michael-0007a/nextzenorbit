/**
 * Resume API — Single Resource
 *
 * GET    /api/resumes/[id] — Fetch single resume
 * PATCH  /api/resumes/[id] — Update resume
 * DELETE /api/resumes/[id] — Permanently delete resume
 *
 * Auth required. Uses admin client to bypass RLS.
 */

import { deleteSavedResume } from "@/lib/resume/delete";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateResumeSchema } from "@/lib/validations/resume";
import { apiError, ERROR_CODES } from "@/types/api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    const admin = createAdminClient();
    const { data: resume, error } = await admin
      .from("resumes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !resume) {
      return apiError(ERROR_CODES.NOT_FOUND, "Resume not found.", 404);
    }

    return NextResponse.json({ success: true, data: resume });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    const body = await request.json();
    const parsed = updateResumeSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid resume data.",
        400,
        parsed.error.flatten()
      );
    }

    const admin = createAdminClient();
    const { data: resume, error } = await admin
      .from("resumes")
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !resume) {
      return apiError(ERROR_CODES.NOT_FOUND, "Resume not found.", 404);
    }

    return NextResponse.json({ success: true, data: resume });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    const body = await request.json().catch(() => null);
    const kind = new URL(request.url).searchParams.get("kind") || "saved";
    if (body?.confirmation !== "DELETE" || !["saved", "generated"].includes(kind)) return apiError(ERROR_CODES.VALIDATION_ERROR, "Final deletion confirmation is required.", 400);
    return await deleteSavedResume(id, user.id, kind === "generated");
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Unable to finish deletion. Please retry.", 500);
  }
}
