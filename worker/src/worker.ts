/**
 * Nextzen Orbit — Auto-Apply Worker
 *
 * Main worker loop that:
 * 1. Polls Supabase for pending jobs every N seconds
 * 2. Picks a job, marks it as processing
 * 3. Opens the job URL in Playwright
 * 4. Detects the form and fills it using hardcoded or AI-powered filler
 * 5. Updates status to applied/failed
 * 6. Creates an application record in the Kanban tracker
 *
 * Entry point: index.ts (loads env first, then calls startWorker)
 */

import {
    getNextPendingJob,
    markAsProcessing,
    markAsApplied,
    markAsFailed,
    getUserProfile,
    getResumeContent,
    getUserEmail,
} from "./supabase.js";
import { openPage, closeBrowser, navigateToApplyPage, addProofOverlay } from "./browser.js";
import { isIndeedPage, fillIndeedForm } from "./fillers/indeed.js";
import { fillGenericForm } from "./fillers/generic.js";

const POLL_INTERVAL = Number(process.env.POLL_INTERVAL_MS || 5000);
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 3);

let running = true;

export async function startWorker(): Promise<void> {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║     Nextzen Orbit — Auto-Apply Worker v1.0      ║");
    console.log("╠══════════════════════════════════════════════════╣");
    console.log(`║  Poll interval: ${POLL_INTERVAL}ms`);
    console.log(`║  Max retries:   ${MAX_RETRIES}`);
    console.log("╚══════════════════════════════════════════════════╝");
    console.log("");

    while (running) {
        try {
            const job = await getNextPendingJob();

            if (!job) {
                process.stdout.write(".");
                await sleep(POLL_INTERVAL);
                continue;
            }

            console.log(`\n[Worker] Processing job: ${job.title} @ ${job.company}`);
            console.log(`         URL: ${job.job_url}`);

            await markAsProcessing(job.id);

            const [profile, email] = await Promise.all([
                getUserProfile(job.user_id),
                getUserEmail(job.user_id),
            ]);

            if (!profile || !email) {
                await markAsFailed(job.id, "User profile or email not found");
                console.error("[Worker] ✗ User data missing. Skipping.");
                continue;
            }

            let resume = null;
            if (job.resume_id) {
                resume = await getResumeContent(job.resume_id);
            }

            if (!resume) {
                resume = {
                    contact: {
                        full_name: profile.full_name,
                        email: email,
                        phone: profile.phone || "",
                        location: profile.location || "",
                        linkedin_url: profile.linkedin_url || "",
                        portfolio_url: "",
                        github_url: "",
                    },
                    summary: { text: "" },
                    experience: [],
                    education: [],
                    skills: [],
                };
            }

            let context;
            try {
                const result = await openPage(job.job_url);
                context = result.context;
                const page = result.page;

                // Step 1: If on Adzuna, click through to the actual employer page
                const currentUrl = page.url();
                if (currentUrl.includes("adzuna.com") || currentUrl.includes("adzuna.in")) {
                    console.log("[Worker] On Adzuna page — clicking through to employer...");
                    await navigateToApplyPage(page);
                }

                // Step 2: Fill the application form on the employer's site
                let fillResult;

                if (isIndeedPage(page.url())) {
                    console.log("[Worker] Using Indeed filler...");
                    fillResult = await fillIndeedForm(page, profile, resume, email);
                } else {
                    console.log("[Worker] Using AI generic filler...");
                    fillResult = await fillGenericForm(page, profile, resume, email);
                }

                if (fillResult.success) {
                    // Step 3: Add proof-of-submission overlay
                    console.log("[Worker] Adding proof overlay...");
                    await addProofOverlay(page, job.title, job.company);

                    // Step 4: Capture screenshot as proof
                    console.log("[Worker] 📸 Taking proof screenshot...");
                    let screenshotBuffer: Buffer | undefined;
                    try {
                        screenshotBuffer = await page.screenshot({
                            fullPage: false,
                            type: "png",
                        });
                        console.log(`[Worker] Screenshot captured (${(screenshotBuffer.length / 1024).toFixed(0)}KB)`);
                    } catch (screenshotErr) {
                        console.error("[Worker] Screenshot failed:", screenshotErr);
                    }

                    console.log(
                        `[Worker] ✓ Applied! Filled ${fillResult.fieldsFilled}/${fillResult.fieldsFound} fields`
                    );
                    await markAsApplied(
                        job.id,
                        job.user_id,
                        job.company,
                        job.title,
                        job.job_url,
                        job.resume_id,
                        screenshotBuffer
                    );
                } else {
                    const errorMsg = fillResult.errors.join("; ") || "Form fill failed";
                    console.log(`[Worker] ✗ Failed: ${errorMsg}`);
                    await markAsFailed(job.id, errorMsg);
                }

                await context.close();
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                console.error(`[Worker] ✗ Error: ${errorMsg}`);
                await markAsFailed(job.id, errorMsg);

                if (context) {
                    await context.close().catch(() => { });
                }
            }

            await sleep(2000);
        } catch (err) {
            console.error("[Worker] Unexpected error:", err);
            await sleep(POLL_INTERVAL);
        }
    }

    await closeBrowser();
    console.log("\n[Worker] Shutdown complete.");
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

process.on("SIGINT", async () => {
    console.log("\n[Worker] Shutting down...");
    running = false;
});

process.on("SIGTERM", async () => {
    console.log("\n[Worker] Shutting down...");
    running = false;
});
