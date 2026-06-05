/**
 * Roadmap API — Single + Steps
 *
 * GET /api/roadmaps/[id]
 */

import { NextResponse } from "next/server";
import { getRoadmapWithSteps } from "@/services/roadmaps-service";
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
    const result = await getRoadmapWithSteps(id);

    if (!result.ok) {
      if (result.error.message === "NOT_FOUND") {
        return apiError(ERROR_CODES.NOT_FOUND, "Roadmap not found.", 404);
      }

      console.error("Roadmap fetch error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch roadmap.", 500);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("Roadmap fetch error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
