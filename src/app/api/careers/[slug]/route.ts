/**
 * Career API — Single
 *
 * GET /api/careers/[slug]
 */

import { NextResponse } from "next/server";
import { getCareerBySlug } from "@/services/careers-service";
import { apiError, ERROR_CODES } from "@/types/api";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { slug } = await context.params;
    const result = await getCareerBySlug(slug);

    if (!result.ok) {
      if (result.error.message === "NOT_FOUND") {
        return apiError(ERROR_CODES.NOT_FOUND, "Career not found.", 404);
      }

      console.error("Career fetch error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch career.", 500);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("Career fetch error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
