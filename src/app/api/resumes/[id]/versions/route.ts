/**
 * Resume Versions API
 *
 * GET  /api/resumes/[id]/versions — List all versions
 * POST /api/resumes/[id]/versions — Create a new version snapshot
 *
 * Auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { apiError, ERROR_CODES } from "@/types/api";
import type { ResumeRow } from "@/types/database";

const createVersionSchema = z.object({
  changeSummary: z.string().max(200).optional(),
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

    // Fetch versions
    const { data: versions, error } = await admin
      .from("resume_versions")
      .select("id, version_number, title, template_id, change_summary, created_at")
      .eq("resume_id", id)
      .order("version_number", { ascending: false });

    if (error) {
      console.error("Versions fetch error:", error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch versions.", 500);
    }

    return NextResponse.json({ success: true, data: versions || [] });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function POST(
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
    const parsed = createVersionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid request.", 400);
    }

    const admin = createAdminClient();

    // Fetch current resume state
    const { data: resume, error: resumeError } = await admin
      .from("resumes")
      .select("id, user_id, title, content, template_id, version")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (resumeError || !resume) {
      return apiError(ERROR_CODES.NOT_FOUND, "Resume not found.", 404);
    }

    const typedResume = resume as ResumeRow;

    // Get current max version number
    const { data: maxVersion } = await admin
      .from("resume_versions")
      .select("version_number")
      .eq("resume_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const newVersionNumber = (maxVersion?.version_number || 0) + 1;

    // Create version snapshot
    const { data: version, error: versionError } = await admin
      .from("resume_versions")
      .insert({
        resume_id: id,
        user_id: user.id,
        version_number: newVersionNumber,
        content: typedResume.content,
        title: typedResume.title,
        template_id: typedResume.template_id,
        change_summary: parsed.data.changeSummary || `Version ${newVersionNumber}`,
      })
      .select()
      .single();

    if (versionError) {
      console.error("Version create error:", versionError.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to create version.", 500);
    }

    // Update resume version counter
    await admin
      .from("resumes")
      .update({ version: newVersionNumber })
      .eq("id", id);

    return NextResponse.json({ success: true, data: version }, { status: 201 });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

