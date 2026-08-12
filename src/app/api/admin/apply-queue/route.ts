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

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const { searchParams } = new URL(request.url);
    const claimedBy = searchParams.get("claimed_by"); // 'me', 'unclaimed', or uuid
    const statusFilter = searchParams.get("status"); // optional

    const admin = createAdminClient();

    // Fetch all queue items with user/profile/resume data
    let query = admin
      .from("job_queue")
      .select(`
        *,
        user:users!user_id(
          id, email,
          profile:profiles!profiles_user_id_fkey(full_name, avatar_url, preferred_role, location, phone, headline, assigned_admin_id)
        ),
        resume:resumes!resume_id(id, title, target_role)
      `)
      .order("created_at", { ascending: false })
      .limit(500);

    if (statusFilter) {
      query = query.eq("status", statusFilter as any);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Admin Apply Queue GET Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch queue.");
    }

    // Group items by user
    const userMap = new Map<string, {
      user_id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
      preferred_role: string | null;
      profile_complete: boolean;
      claimed_by: string | null;
      claimed_at: string | null;
      jobs: any[];
      job_counts: { pending: number; processing: number; applied: number; failed: number; skipped: number };
    }>();

    for (const item of (data || []) as any[]) {
      const userId = item.user_id;
      const userInfo = item.user;
      const profile = userInfo?.profile;

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user_id: userId,
          full_name: profile?.full_name || "Unknown",
          email: userInfo?.email || "",
          avatar_url: profile?.avatar_url || null,
          preferred_role: profile?.preferred_role || null,
          profile_complete: checkProfileComplete(profile),
          claimed_by: item.claimed_by,
          claimed_at: item.claimed_at,
          jobs: [],
          job_counts: { pending: 0, processing: 0, applied: 0, failed: 0, skipped: 0 },
        });
      }

      const group = userMap.get(userId)!;

      // Add the job (strip nested user data to keep payload small)
      group.jobs.push({
        id: item.id,
        title: item.title,
        company: item.company,
        job_url: item.job_url,
        status: item.status,
        source: item.source,
        created_at: item.created_at,
        applied_at: item.applied_at,
        admin_notes: item.admin_notes,
        assigned_to: item.assigned_to,
        resume: item.resume,
      });

      // Count by status
      const st = item.status as string;
      if (st in group.job_counts) {
        (group.job_counts as any)[st]++;
      }

      // Use the profile's assigned_admin_id
      if (profile?.assigned_admin_id) {
        group.claimed_by = profile.assigned_admin_id;
      }
    }

    let users = Array.from(userMap.values());

    // Filter by assigned admin if the user is a standard admin
    if (adminAuth.role === "admin") {
      users = users.filter((u) => u.claimed_by === adminAuth.userId);
    }

    // Sort by: most pending jobs first
    users.sort((a, b) => b.job_counts.pending - a.job_counts.pending);

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
