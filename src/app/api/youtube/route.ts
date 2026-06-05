/**
 * YouTube Resources API — List
 *
 * GET /api/youtube
 */

import { NextRequest, NextResponse } from "next/server";
import { listYoutubeResources } from "@/services/youtube-service";
import { apiError, ERROR_CODES } from "@/types/api";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const params = request.nextUrl.searchParams;
    const careerId = params.get("career_id")?.trim();
    const role = params.get("role")?.trim();
    const topic = params.get("topic")?.trim();
    const difficulty = params.get("difficulty")?.trim();
    const limit = params.get("limit") ? Number(params.get("limit")) : undefined;

    const result = await listYoutubeResources({
      careerId: careerId || undefined,
      role: role || undefined,
      topic: topic || undefined,
      difficulty: difficulty || undefined,
      limit,
    });

    if (!result.ok) {
      console.error("YouTube resources list error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch resources.", 500);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("YouTube resources list error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
