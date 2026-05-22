/**
 * Worker — Supabase Admin Client
 *
 * Uses service role key to bypass RLS.
 * Only used by the background worker process.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
    if (!_supabase) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
            throw new Error(
                `Missing env vars. SUPABASE_URL=${url ? "set" : "MISSING"}, SERVICE_ROLE_KEY=${key ? "set" : "MISSING"}`
            );
        }
        _supabase = createClient(url, key, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
    }
    return _supabase;
}

// ── Queue Operations ──

export interface QueueJob {
    id: string;
    user_id: string;
    title: string;
    company: string;
    job_url: string;
    location: string | null;
    salary_text: string | null;
    description: string | null;
    source: string;
    status: string;
    resume_id: string | null;
}

export interface UserProfile {
    full_name: string;
    phone: string | null;
    location: string | null;
    linkedin_url: string | null;
    preferred_role: string | null;
    years_of_experience: number | null;
}

export interface ResumeContent {
    contact: {
        full_name: string;
        email: string;
        phone: string;
        location: string;
        linkedin_url: string;
        portfolio_url: string;
        github_url: string;
    };
    summary: { text: string };
    experience: Array<{
        company: string;
        position: string;
        location: string;
        start_date: string;
        end_date: string;
        is_current: boolean;
        bullets: string[];
    }>;
    education: Array<{
        institution: string;
        degree: string;
        field_of_study: string;
        start_date: string;
        end_date: string;
    }>;
    skills: Array<{
        category: string;
        items: string[];
    }>;
}

/**
 * Get the next pending job from the queue.
 */
export async function getNextPendingJob(): Promise<QueueJob | null> {
    const { data, error } = await getSupabase()
        .from("job_queue")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("[DB] Error fetching pending job:", error.message);
        return null;
    }

    return data as QueueJob | null;
}

/**
 * Mark a job as processing.
 */
export async function markAsProcessing(jobId: string): Promise<void> {
    const { error } = await getSupabase()
        .from("job_queue")
        .update({ status: "processing" })
        .eq("id", jobId);

    if (error) console.error("[DB] Error marking as processing:", error.message);
}

/**
 * Mark a job as applied, upload screenshot proof, and create an application record.
 */
export async function markAsApplied(
    jobId: string,
    userId: string,
    company: string,
    position: string,
    jobUrl: string,
    resumeId: string | null,
    screenshotBuffer?: Buffer
): Promise<void> {
    const sb = getSupabase();
    let screenshotUrl: string | null = null;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Upload screenshot to Supabase Storage
    if (screenshotBuffer) {
        const fileName = `${userId}/${jobId}_${Date.now()}.png`;
        const { error: uploadError } = await sb.storage
            .from("screenshots")
            .upload(fileName, screenshotBuffer, {
                contentType: "image/png",
                upsert: false,
            });

        if (uploadError) {
            console.error("[Storage] Screenshot upload failed:", uploadError.message);
        } else {
            // Generate a signed URL valid for 7 days
            const { data: signedData } = await sb.storage
                .from("screenshots")
                .createSignedUrl(fileName, 7 * 24 * 60 * 60); // 7 days in seconds

            screenshotUrl = signedData?.signedUrl || null;
            console.log(`[Storage] Screenshot uploaded: ${fileName}`);
        }
    }

    // Update queue status + screenshot
    await sb
        .from("job_queue")
        .update({
            status: "applied",
            applied_at: new Date().toISOString(),
            screenshot_url: screenshotUrl,
            screenshot_expires_at: screenshotUrl ? expiresAt : null,
        })
        .eq("id", jobId);

    // Create application record for the Kanban tracker
    await sb.from("applications").insert({
        user_id: userId,
        resume_id: resumeId,
        company,
        position,
        job_url: jobUrl,
        status: "applied",
        notes: screenshotUrl
            ? "Auto-applied via Nextzen Orbit worker (screenshot proof attached)"
            : "Auto-applied via Nextzen Orbit worker",
        applied_at: new Date().toISOString(),
    });
}

/**
 * Mark a job as failed with an error message.
 */
export async function markAsFailed(jobId: string, errorMessage: string): Promise<void> {
    const { error } = await getSupabase()
        .from("job_queue")
        .update({
            status: "failed",
            error_message: errorMessage.slice(0, 500),
        })
        .eq("id", jobId);

    if (error) console.error("[DB] Error marking as failed:", error.message);
}

/**
 * Get user's profile data.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await getSupabase()
        .from("profiles")
        .select("full_name, phone, location, linkedin_url, preferred_role, years_of_experience")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        console.error("[DB] Error fetching profile:", error.message);
        return null;
    }

    return data as UserProfile | null;
}

/**
 * Get resume content.
 */
export async function getResumeContent(resumeId: string): Promise<ResumeContent | null> {
    const { data, error } = await getSupabase()
        .from("resumes")
        .select("content")
        .eq("id", resumeId)
        .maybeSingle();

    if (error) {
        console.error("[DB] Error fetching resume:", error.message);
        return null;
    }

    return (data?.content as ResumeContent) || null;
}

/**
 * Get user's email.
 */
export async function getUserEmail(userId: string): Promise<string | null> {
    const { data, error } = await getSupabase()
        .from("users")
        .select("email")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        console.error("[DB] Error fetching user email:", error.message);
        return null;
    }

    return data?.email || null;
}
