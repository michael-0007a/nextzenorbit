/**
 * Single Application API — Get, Update, Delete
 *
 * GET    /api/applications/[id] — Get application details
 * PATCH  /api/applications/[id] — Update application
 * DELETE /api/applications/[id] — Delete application
 *
 * Auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { apiError, ERROR_CODES } from "@/types/api";

const updateApplicationSchema = z.object({
  company: z.string().min(1).max(200).optional(),
  position: z.string().min(1).max(200).optional(),
  job_url: z.string().url().max(500).optional().nullable(),
  status: z.enum(["applied", "screening", "interview", "offer", "rejected"]).optional(),
  notes: z.string().max(2000).optional().nullable(),
  follow_up_at: z.string().datetime().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      return apiError(ERROR_CODES.NOT_FOUND, "Application not found.", 404);
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    const body = await request.json();
    const parsed = updateApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid data.", 400, parsed.error.flatten());
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("applications")
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Application update error:", error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to update application.", 500);
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("applications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Application delete error:", error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to delete application.", 500);
    }

    return NextResponse.json({ success: true, data: null });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

