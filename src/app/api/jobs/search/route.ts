/**
 * Job Search API
 *
 * POST /api/jobs/search — Search for jobs using Adzuna API
 *
 * Auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, ERROR_CODES } from "@/types/api";
import { searchAdzunaJobs, adzunaSearchSchema } from "@/lib/jobs/adzuna";

export async function POST(request: NextRequest): Promise<Response> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
        }

        const body = await request.json();
        const parsed = adzunaSearchSchema.safeParse(body);

        if (!parsed.success) {
            return apiError(
                ERROR_CODES.VALIDATION_ERROR,
                "Invalid search parameters.",
                400,
                parsed.error.flatten()
            );
        }

        const result = await searchAdzunaJobs(parsed.data);

        return NextResponse.json({ success: true, data: result });
    } catch (err) {
        console.error("Job search error:", err);
        return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to search jobs.", 500);
    }
}
