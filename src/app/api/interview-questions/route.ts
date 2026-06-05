/**
 * Interview Questions API — List
 *
 * GET /api/interview-questions
 */

import { NextRequest, NextResponse } from "next/server";
import { listInterviewQuestions } from "@/services/interview-service";
import { apiError, ERROR_CODES } from "@/types/api";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const params = request.nextUrl.searchParams;

    const result = await listInterviewQuestions({
      careerId: params.get("career_id")?.trim() || undefined,
      role: params.get("role")?.trim() || undefined,
      company: params.get("company")?.trim() || undefined,
      difficulty: params.get("difficulty")?.trim() || undefined,
      topic: params.get("topic")?.trim() || undefined,
      limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    });

    if (!result.ok) {
      console.error("Interview questions list error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch interview questions.", 500);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("Interview questions list error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
