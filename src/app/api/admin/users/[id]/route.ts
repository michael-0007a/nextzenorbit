/**
 * Admin API: Single User Details
 *
 * GET /api/admin/users/[id] - Fetch detailed user info
 *   (full profile, resumes with content, applications, admin resumes,
 *    admin cover letters, notifications, profile completeness)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

const REQUIRED_PROFILE_FIELDS = ["full_name", "preferred_role", "location", "phone", "headline"];

export const dynamic = "force-dynamic";

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

    // Fetch user details with full profile
    const { data: user, error: userError } = await admin
      .from("users")
      .select(`
        id, email, role, created_at,
        profile:profiles!profiles_user_id_fkey(
          full_name, avatar_url, preferred_role, location,
          phone, headline, linkedin_url,
          preferred_location, preferred_salary_min, preferred_salary_max,
          preferred_work_type, years_of_experience, preferred_portals
        ),
        subscription:subscriptions(plan_id, status, current_period_end, currency, amount_paise)
      `)
      .eq("id", id)
      .single();

    if (userError || !user) {
      return apiError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }

    // Check profile completeness
    const profile = (user as any).profile;
    const profileComplete = profile
      ? REQUIRED_PROFILE_FIELDS.every((f: string) => {
          const v = profile[f];
          return typeof v === "string" && v.trim().length > 0;
        })
      : false;

    // Fetch resumes with content (including is_base flag)
    const { data: resumes } = await admin
      .from("resumes")
      .select("id, title, content, template_id, is_base, version, created_at, updated_at")
      .eq("user_id", id)
      .is("deleted_at", null)
      .order("is_base", { ascending: false })
      .order("updated_at", { ascending: false });

    // Fetch queue history
    const { data: queue } = await admin
      .from("job_queue")
      .select("id, title, company, job_url, status, source, created_at, applied_at, admin_notes, assigned_to")
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    // Fetch admin-generated resumes for this user
    const { data: adminResumes } = await admin
      .from("admin_resumes")
      .select("id, title, job_title, company, job_description, template_id, expires_at, created_at, admin_id")
      .eq("user_id", id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    // Fetch admin-generated cover letters for this user
    const { data: adminCoverLetters } = await admin
      .from("admin_cover_letters")
      .select("id, title, company_name, job_title, expires_at, created_at, admin_id")
      .eq("user_id", id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    // Fetch recent notifications sent to this user
    const { data: notifications } = await admin
      .from("notifications")
      .select("id, type, title, message, is_read, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Find the base resume
    const baseResume = (resumes || []).find((r: any) => r.is_base) || null;

    return NextResponse.json(
      apiSuccess({
        ...user,
        profileComplete,
        resumes: resumes || [],
        baseResume,
        queue: queue || [],
        adminResumes: adminResumes || [],
        adminCoverLetters: adminCoverLetters || [],
        notifications: notifications || [],
      })
    );
  } catch (err) {
    console.error("Admin User Details GET exception:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
