/**
 * Projects API — List + Create
 *
 * GET  /api/projects
 * POST /api/projects
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProjectSchema } from "@/lib/validations/projects";
import { apiError, ERROR_CODES } from "@/types/api";
import { createProject, listProjects } from "@/services/projects-service";

export async function GET(): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    const result = await listProjects(user.id);

    if (!result.ok) {
      console.error("Projects list error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch projects.", 500);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("Projects list error:", err);
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
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid project data.",
        400,
        parsed.error.flatten()
      );
    }

    const result = await createProject(user.id, user.email, parsed.data);

    if (!result.ok) {
      console.error("Project create error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to create project.", 500);
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (err) {
    console.error("Project create error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
