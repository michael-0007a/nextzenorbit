/**
 * Careers API — List
 *
 * GET /api/careers
 */

import { NextRequest, NextResponse } from "next/server";
import { listCareers } from "@/services/careers-service";
import { apiError, ERROR_CODES } from "@/types/api";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const search = request.nextUrl.searchParams.get("q")?.trim();
    const result = await listCareers(search || undefined);

    if (!result.ok) {
      console.error("Careers list error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch careers.", 500);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("Careers list error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
