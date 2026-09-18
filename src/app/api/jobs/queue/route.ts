import { queueSearchJobs } from "@/lib/jobs/queue";
/**
 * Job Queue API
 * 
 * GET  /api/jobs/queue - List current user's queued jobs
 * POST /api/jobs/queue - Add one or more jobs to the auto-apply queue
 * 
 * Auth required. Managed by RLS.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, ERROR_CODES } from "@/types/api";

/**
 * GET: Fetch the current user's job queue
 */
export async function GET(request: NextRequest): Promise<Response> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in to view your queue.", 401);
        }

        const { data, error } = await supabase
            .from("job_queue")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Fetch queue error:", error);
            return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch queued jobs.", 500);
        }

        return NextResponse.json({
            success: true,
            data: data || [],
        });
    } catch (err) {
        console.error("Queue GET error:", err);
        return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
    }
}

/**
 * POST: Add jobs to the queue
 */
export async function POST(request: NextRequest): Promise<Response> {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
  return queueSearchJobs(request, { userId: user.id });
}
