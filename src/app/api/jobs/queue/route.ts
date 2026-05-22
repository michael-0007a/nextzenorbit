/**
 * Job Queue API — List + Add to queue
 *
 * GET  /api/jobs/queue — List user's queued jobs
 * POST /api/jobs/queue — Add jobs to the auto-apply queue
 *
 * Auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { apiError, ERROR_CODES } from "@/types/api";

const addToQueueSchema = z.object({
    jobs: z.array(
        z.object({
            title: z.string().min(1).max(300),
            company: z.string().min(1).max(200),
            job_url: z.string().url().max(500),
            location: z.string().max(200).optional().nullable(),
            salary_text: z.string().max(200).optional().nullable(),
            description: z.string().max(5000).optional().nullable(),
            source: z.enum(["adzuna", "jsearch", "manual"]).optional().default("adzuna"),
        })
    ).min(1, "At least one job is required").max(50, "Maximum 50 jobs at a time"),
    resume_id: z.string().uuid().optional().nullable(),
});

export async function GET(): Promise<Response> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
        }

        const admin = createAdminClient();
        const { data, error } = await admin
            .from("job_queue")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(100);

        if (error) {
            console.error("Job queue list error:", error.message);
            return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch job queue.", 500);
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch {
        return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
    }
}

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
        const parsed = addToQueueSchema.safeParse(body);

        if (!parsed.success) {
            return apiError(
                ERROR_CODES.VALIDATION_ERROR,
                "Invalid job queue data.",
                400,
                parsed.error.flatten()
            );
        }

        const admin = createAdminClient();

        // Ensure user exists
        const { data: existingUser } = await admin
            .from("users")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

        if (!existingUser) {
            await admin.from("users").insert({
                id: user.id,
                email: user.email!,
                role: "user",
            });
        }

        // Check for duplicate job URLs already in queue
        const jobUrls = parsed.data.jobs.map((j) => j.job_url);
        const { data: existing } = await admin
            .from("job_queue")
            .select("job_url")
            .eq("user_id", user.id)
            .in("job_url", jobUrls);

        const existingUrls = new Set((existing || []).map((e) => e.job_url));
        const newJobs = parsed.data.jobs.filter((j) => !existingUrls.has(j.job_url));

        if (newJobs.length === 0) {
            return NextResponse.json({
                success: true,
                data: { added: 0, skipped: parsed.data.jobs.length, message: "All jobs already in queue." },
            });
        }

        const insertData = newJobs.map((job) => ({
            user_id: user.id,
            title: job.title,
            company: job.company,
            job_url: job.job_url,
            location: job.location || null,
            salary_text: job.salary_text || null,
            description: job.description || null,
            source: job.source || ("adzuna" as const),
            status: "pending" as const,
            resume_id: parsed.data.resume_id || null,
        }));

        const { data: inserted, error } = await admin
            .from("job_queue")
            .insert(insertData)
            .select();

        if (error) {
            console.error("Job queue insert error:", error.message);
            return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to add jobs to queue.", 500);
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    added: inserted?.length || 0,
                    skipped: parsed.data.jobs.length - newJobs.length,
                    jobs: inserted,
                },
            },
            { status: 201 }
        );
    } catch {
        return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
    }
}
