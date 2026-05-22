/**
 * Cron Job: Cleanup Expired Screenshots
 *
 * Deletes screenshot files from Supabase Storage and clears DB columns
 * for jobs where screenshots have expired (7 days past).
 *
 * Trigger: Vercel cron or manual call to POST /api/cron/cleanup
 * Auth: Requires CRON_SECRET header for security
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    // Verify cron secret (optional — skip if not set)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { success: false, error: { message: "Unauthorized" } },
            { status: 401 }
        );
    }

    const admin = createAdminClient();

    try {
        // 1. Find all jobs with expired screenshots
        const { data: expiredJobs, error: fetchError } = await admin
            .from("job_queue")
            .select("id, screenshot_url, user_id")
            .lt("screenshot_expires_at", new Date().toISOString())
            .not("screenshot_url", "is", null);

        if (fetchError) {
            return NextResponse.json(
                { success: false, error: { message: fetchError.message } },
                { status: 500 }
            );
        }

        if (!expiredJobs || expiredJobs.length === 0) {
            return NextResponse.json({
                success: true,
                data: { deleted: 0, message: "No expired screenshots found" },
            });
        }

        let deletedCount = 0;

        // 2. Delete each screenshot from Storage + clear DB
        for (const job of expiredJobs) {
            try {
                // Extract file path from signed URL
                // Signed URLs contain the path after /object/sign/screenshots/
                const url = job.screenshot_url as string;
                const pathMatch = url.match(/screenshots\/(.+?)(?:\?|$)/);

                if (pathMatch) {
                    const filePath = pathMatch[1];
                    await admin.storage
                        .from("screenshots")
                        .remove([filePath]);
                }

                // Clear DB columns
                await admin
                    .from("job_queue")
                    .update({
                        screenshot_url: null,
                        screenshot_expires_at: null,
                    })
                    .eq("id", job.id);

                deletedCount++;
            } catch (err) {
                console.error(`[Cleanup] Failed for job ${job.id}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                deleted: deletedCount,
                total_expired: expiredJobs.length,
            },
        });
    } catch (err) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    message: err instanceof Error ? err.message : "Cleanup failed",
                },
            },
            { status: 500 }
        );
    }
}

// GET handler for health check
export async function GET() {
    return NextResponse.json({
        success: true,
        data: { status: "cleanup cron endpoint active" },
    });
}
