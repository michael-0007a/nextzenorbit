/**
 * Admin API: Apply Queue
 *
 * GET   /api/admin/apply-queue - List queue items grouped by user
 * PATCH /api/admin/apply-queue - Claim user, update job status, add notes
 * POST  /api/admin/apply-queue - Add a new job to the queue
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";
import type { Database } from "@/types/database";

type JobQueueUpdate = Database["public"]["Tables"]["job_queue"]["Update"];

// Required profile fields — matches the dashboard gate
const REQUIRED_PROFILE_FIELDS = ["full_name", "preferred_role", "location", "phone", "headline"];

function checkProfileComplete(profile: Record<string, unknown> | null): boolean {
  if (!profile) return false;
  return REQUIRED_PROFILE_FIELDS.every((f) => {
    const v = profile[f as keyof typeof profile];
    return typeof v === "string" && v.trim().length > 0;
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status"); // optional

    const admin = createAdminClient();

    // Fetch all users with their profiles and their job queue items
    const { data: usersData, error } = await admin
      .from("users")
      .select(`
        id, email, role,
        profile:profiles!profiles_user_id_fkey(
          full_name, avatar_url, preferred_role, location, phone, headline, assigned_admin_id
        ),
        job_queue:job_queue!job_queue_user_id_fkey(
          id, title, company, job_url, status, source, created_at, applied_at, admin_notes, assigned_to,
          resume:resumes(id, title, target_role)
        )
      `)
      .eq("role", "user");

    if (error) {
      console.error("Admin Apply Queue GET Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch queue.");
    }

    const users = (usersData || [])
      .map((user: any) => {
        // Safely unwrap nested arrays
        const rawProfile = user.profile;
        const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
        
        let jobQueue = user.job_queue || [];
        if (statusFilter) {
          jobQueue = jobQueue.filter((j: any) => j.status === statusFilter);
        }
        
        // Fix resume unwrapping from array if it is an array
        jobQueue = jobQueue.map((job: any) => ({
          ...job,
          resume: Array.isArray(job.resume) ? job.resume[0] : job.resume
        }));
        
        const jobCounts = { pending: 0, processing: 0, applied: 0, failed: 0, skipped: 0 };
        for (const job of jobQueue) {
          const st = job.status as string;
          if (st in jobCounts) {
            (jobCounts as any)[st]++;
          }
        }
        
        return {
          user_id: user.id,
          full_name: profile?.full_name || "Unknown",
          email: user.email || "",
          avatar_url: profile?.avatar_url || null,
          preferred_role: profile?.preferred_role || null,
          profile_complete: checkProfileComplete(profile),
          claimed_by: profile?.assigned_admin_id || null, // Authoritative claimed by
          claimed_at: null, // no longer tracked at user level
          jobs: jobQueue.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
          job_counts: jobCounts
        };
      })
      .filter(u => {
        // If the requester is an admin, they should ONLY see users assigned to them
        if (adminAuth.role === "admin") {
          return u.claimed_by === adminAuth.userId;
        }
        return true; // Super admins and supervisor admins see everyone
      })
      .sort((a, b) => b.job_counts.pending - a.job_counts.pending);

    return NextResponse.json(apiSuccess({ users }));
  } catch (err) {
    console.error("Admin Apply Queue error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const body = await request.json();
    const { action, id, user_id, status, notes } = body;

    const admin = createAdminClient();



    // ── Per-job updates (existing behavior) ──
    if (!id) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Job ID is required for per-job updates.");
    }

    const updates: JobQueueUpdate = {};

    if (action === "claim") {
      updates.assigned_to = adminAuth.userId;
      updates.assigned_at = new Date().toISOString();
    } else if (action === "unclaim") {
      updates.assigned_to = null;
      updates.assigned_at = null;
    }

    if (status) {
      updates.status = status;
      if (status === "applied") {
        updates.applied_at = new Date().toISOString();
      }
    }

    if (notes !== undefined) {
      updates.admin_notes = notes;
    }

    if (Object.keys(updates).length === 0) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "No updates provided.");
    }

    const { data, error } = await admin
      .from("job_queue")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Admin Apply Queue PATCH Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to update job.");
    }

    return NextResponse.json(apiSuccess(data));
  } catch (err) {
    console.error("Admin Apply Queue PATCH error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const body = await request.json();
    const { user_id, title, company, job_url, description, admin_notes, resume_id } = body;

    if (!user_id || !title || !company || !job_url) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "user_id, title, company, and job_url are required.");
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("job_queue")
      .insert({
        user_id,
        title,
        company,
        job_url,
        description: description || null,
        source: "manual" as any,
        status: "pending" as any,
        assigned_to: adminAuth.userId,
        assigned_at: new Date().toISOString(),
        admin_notes: admin_notes || null,
        resume_id: resume_id || null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Admin Apply Queue POST Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to add job to queue.");
    }

    return NextResponse.json(apiSuccess(data), { status: 201 });
  } catch (err) {
    console.error("Admin Apply Queue POST error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
