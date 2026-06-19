/**
 * Admin API: Apply Queue
 * 
 * GET  /api/admin/apply-queue - List job queue items with user/resume details
 * PATCH /api/admin/apply-queue - Claim, update status, add notes
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";
import type { Database } from "@/types/database";

type JobQueueUpdate = Database["public"]["Tables"]["job_queue"]["Update"];

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assigned_to"); // 'me' or uuid
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const admin = createAdminClient();

    // Base query: join with users, profiles, and resumes
    let query = admin
      .from("job_queue")
      .select(`
        *,
        user:users!user_id(
          email,
          profile:profiles(full_name, avatar_url, preferred_role)
        ),
        resume:resumes!resume_id(id, title, target_role),
        assignee:users!assigned_to(profile:profiles(full_name))
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status as any);
    }

    if (assignedTo === "me") {
      query = query.eq("assigned_to", adminAuth.userId);
    } else if (assignedTo === "unassigned") {
      query = query.is("assigned_to", null);
    } else if (assignedTo) {
      query = query.eq("assigned_to", assignedTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Admin Apply Queue GET Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch queue.");
    }

    const formattedData = (data || []).map((item: any) => ({
      ...item,
      profile: item.user?.profile || null,
      user: item.user ? { email: item.user.email } : null,
      assignee: item.assignee?.profile || null
    }));

    return NextResponse.json(apiSuccess(formattedData));
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
    const { id, action, status, notes } = body;

    if (!id) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Job ID is required.");
    }

    const admin = createAdminClient();
    const updates: JobQueueUpdate = {};

    // Actions: claim, unclaim, update
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
      .select(`
        *,
        user:users!user_id(
          email,
          profile:profiles(full_name, avatar_url, preferred_role)
        ),
        resume:resumes!resume_id(id, title, target_role),
        assignee:users!assigned_to(profile:profiles(full_name))
      `)
      .single();

    if (error) {
      console.error("Admin Apply Queue PATCH Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to update job.");
    }

    const raw = data as any;
    const formattedData = raw ? {
      ...raw,
      profile: raw.user?.profile || null,
      user: raw.user ? { email: raw.user.email } : null,
      assignee: raw.assignee?.profile || null
    } : null;

    return NextResponse.json(apiSuccess(formattedData));
  } catch (err) {
    console.error("Admin Apply Queue PATCH error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
