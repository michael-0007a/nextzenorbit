/**
 * Jobs API — Aggregated listing
 *
 * GET /api/jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { listJobs } from "@/services/jobs-service";
import { apiError, ERROR_CODES } from "@/types/api";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const params = request.nextUrl.searchParams;
    const query = params.get("q")?.trim();
    const location = params.get("location")?.trim();
    const source = params.get("source")?.trim();
    const tag = params.get("tag")?.trim();

    const limitRaw = parseInt(params.get("limit") ?? "", 10);
    const offsetRaw = parseInt(params.get("offset") ?? "", 10);

    const limit = Math.min(
      Math.max(Number.isNaN(limitRaw) ? DEFAULT_LIMIT : limitRaw, 1),
      MAX_LIMIT
    );

    const offset = Math.max(Number.isNaN(offsetRaw) ? 0 : offsetRaw, 0);

    const result = await listJobs({
      query: query || undefined,
      location: location || undefined,
      source: source || undefined,
      tag: tag || undefined,
      limit,
      offset,
    });

    if (!result.ok) {
      console.error("Jobs list error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch jobs.", 500);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("Jobs list error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
