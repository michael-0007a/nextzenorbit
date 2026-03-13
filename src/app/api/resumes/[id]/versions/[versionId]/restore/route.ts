/**
 * Restore Resume Version API
 *
 * POST /api/resumes/[id]/versions/[versionId]/restore
 *
 * Restores a resume to a previous version state.
 * Auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, ERROR_CODES } from "@/types/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
): Promise<Response> {
  try {
    const { id, versionId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    const admin = createAdminClient();

    // Verify resume belongs to user
    const { data: resume } = await admin
      .from("resumes")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!resume) {
      return apiError(ERROR_CODES.NOT_FOUND, "Resume not found.", 404);
    }

    // Fetch the version to restore
    const { data: version, error: versionError } = await admin
      .from("resume_versions")
      .select("content, title, template_id")
      .eq("id", versionId)
      .eq("resume_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (versionError || !version) {
      return apiError(ERROR_CODES.NOT_FOUND, "Version not found.", 404);
    }

    // Update resume with version content
    const { data: updatedResume, error: updateError } = await admin
      .from("resumes")
      .update({
        content: version.content,
        title: version.title,
        template_id: version.template_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Restore error:", updateError.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to restore version.", 500);
    }

    return NextResponse.json({ success: true, data: updatedResume });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

