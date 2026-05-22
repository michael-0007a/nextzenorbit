/**
 * Screenshot Viewer API
 *
 * Generates a fresh signed URL for a user's job screenshot.
 * Verifies the requesting user owns the job queue entry.
 *
 * GET /api/jobs/screenshot?jobId=uuid
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { success: false, error: { message: "Unauthorized" } },
            { status: 401 }
        );
    }

    const jobId = req.nextUrl.searchParams.get("jobId");
    if (!jobId) {
        return NextResponse.json(
            { success: false, error: { message: "jobId is required" } },
            { status: 400 }
        );
    }

    const admin = createAdminClient();

    // Verify this job belongs to the authenticated user
    const { data: job, error } = await admin
        .from("job_queue")
        .select("id, user_id, screenshot_url, screenshot_expires_at")
        .eq("id", jobId)
        .eq("user_id", user.id) // Only allow owner
        .maybeSingle();

    if (error || !job) {
        return NextResponse.json(
            { success: false, error: { message: "Job not found" } },
            { status: 404 }
        );
    }

    if (!job.screenshot_url) {
        return NextResponse.json(
            { success: false, error: { message: "No screenshot available" } },
            { status: 404 }
        );
    }

    // Check if screenshot has expired
    if (job.screenshot_expires_at && new Date(job.screenshot_expires_at) < new Date()) {
        return NextResponse.json(
            { success: false, error: { message: "Screenshot has expired" } },
            { status: 410 }
        );
    }

    // Extract file path from the stored URL and generate a fresh signed URL
    const url = job.screenshot_url as string;
    const pathMatch = url.match(/screenshots\/(.+?)(?:\?|$)/);

    if (!pathMatch) {
        // Return the stored URL as-is (legacy or different format)
        return NextResponse.json({
            success: true,
            data: { url: job.screenshot_url },
        });
    }

    const filePath = pathMatch[1];
    const { data: signedData, error: signError } = await admin.storage
        .from("screenshots")
        .createSignedUrl(filePath, 3600); // 1 hour signed URL

    if (signError || !signedData) {
        return NextResponse.json(
            { success: false, error: { message: "Could not generate screenshot URL" } },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        data: { url: signedData.signedUrl },
    });
}
