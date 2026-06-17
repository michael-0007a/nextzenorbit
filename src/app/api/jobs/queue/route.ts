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
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in to manage your queue.", 401);
        }

        const body = await request.json();
        const { jobs, resume_id } = body;

        if (!Array.isArray(jobs) || jobs.length === 0) {
            return apiError(ERROR_CODES.VALIDATION_ERROR, "No jobs provided.");
        }

        let addedCount = 0;
        const processedJobs = [];

        for (const job of jobs) {
            // Check for existing to avoid user-side confusion even though we use UPSERT or IGNORE
            const { data: existing } = await supabase
                .from("job_queue")
                .select("id")
                .eq("user_id", user.id)
                .eq("job_url", job.job_url)
                .maybeSingle();

            if (existing) continue;

            const { data, error } = await supabase
                .from("job_queue")
                .insert({
                    user_id: user.id,
                    title: job.title,
                    company: job.company,
                    job_url: job.job_url,
                    location: job.location || null,
                    salary_text: job.salary_text || null,
                    description: job.description || null,
                    source: job.source || "adzuna",
                    resume_id: resume_id || null,
                    status: "pending",
                })
                .select()
                .single();

            if (!error && data) {
                addedCount++;
                processedJobs.push(data);
            } else if (error) {
                console.error("Insert job error:", error);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                added: addedCount,
                jobs: processedJobs,
            },
        });
    } catch (err) {
        console.error("Queue POST error:", err);
        return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
    }
}
