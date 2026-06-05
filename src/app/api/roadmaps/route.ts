/**
 * Roadmaps API — List
 *
 * GET /api/roadmaps
 */

import { NextRequest, NextResponse } from "next/server";
import { listRoadmaps } from "@/services/roadmaps-service";
import { apiError, ERROR_CODES } from "@/types/api";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const params = request.nextUrl.searchParams;
    const careerId = params.get("career_id")?.trim();
    const role = params.get("role")?.trim();

    const result = await listRoadmaps({
      careerId: careerId || undefined,
      role: role || undefined,
    });

    if (!result.ok) {
      console.error("Roadmaps list error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch roadmaps.", 500);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("Roadmaps list error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
