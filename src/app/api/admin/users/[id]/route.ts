/**
 * Admin API: Single User Details
 *
 * GET /api/admin/users/[id] - Fetch detailed user info (profile, resumes, applications)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const { id } = await params;
    if (!id) return apiError(ERROR_CODES.VALIDATION_ERROR, "User ID required");

    const admin = createAdminClient();

    // Fetch user details
    const { data: user, error: userError } = await admin
      .from("users")
      .select(`
        id, email, role, created_at,
        profile:profiles(full_name, avatar_url, preferred_role, location),
        subscription:subscriptions(plan_id, status, current_period_end)
      `)
      .eq("id", id)
      .single();

    if (userError || !user) {
      return apiError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }

    // Fetch resumes
    const { data: resumes } = await admin
      .from("resumes")
      .select("id, title, target_role, created_at, updated_at, data")
      .eq("user_id", id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    // Fetch queue history
    const { data: queue } = await admin
      .from("job_queue")
      .select("id, title, company, status, created_at, applied_at, admin_notes")
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json(
      apiSuccess({
        ...user,
        resumes: resumes || [],
        queue: queue || [],
      })
    );
  } catch (err) {
    console.error("Admin User Details GET exception:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
