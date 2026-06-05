/**
 * Projects API — Single
 *
 * GET    /api/projects/[id]
 * PATCH  /api/projects/[id]
 * DELETE /api/projects/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateProjectSchema } from "@/lib/validations/projects";
import { apiError, ERROR_CODES } from "@/types/api";
import { deleteProject, getProjectById, updateProject } from "@/services/projects-service";

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

    const result = await getProjectById(user.id, id);

    if (!result.ok) {
      if (result.error.message === "NOT_FOUND") {
        return apiError(ERROR_CODES.NOT_FOUND, "Project not found.", 404);
      }

      console.error("Project fetch error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch project.", 500);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("Project fetch error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function PATCH(
  request: NextRequest,
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
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid project data.",
        400,
        parsed.error.flatten()
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "No updates provided.", 400);
    }

    const result = await updateProject(user.id, id, parsed.data);

    if (!result.ok) {
      if (result.error.message === "NOT_FOUND") {
        return apiError(ERROR_CODES.NOT_FOUND, "Project not found.", 404);
      }

      if (result.error.message === "NO_UPDATES") {
        return apiError(ERROR_CODES.VALIDATION_ERROR, "No updates provided.", 400);
      }

      console.error("Project update error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to update project.", 500);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("Project update error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function DELETE(
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

    const result = await deleteProject(user.id, id);

    if (!result.ok) {
      console.error("Project delete error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to delete project.", 500);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("Project delete error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
