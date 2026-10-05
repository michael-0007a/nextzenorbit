import { isAssignedToClient } from "@/lib/admin/assignments";
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
import { pagination, paginationMeta } from "@/lib/pagination";
import { resumeMetadata } from '@/lib/admin/resume-metadata';
import { createTimings } from '@/lib/performance';

const REQUIRED_PROFILE_FIELDS = ["full_name", "preferred_role", "phone", "headline"];

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const timings=createTimings();
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const { id } = await params;
    if (!id) return apiError(ERROR_CODES.VALIDATION_ERROR, "User ID required");

    if (adminAuth.role === "admin" && !await isAssignedToClient(adminAuth.userId,id)) return apiError(ERROR_CODES.FORBIDDEN,"This client is not assigned to you.",403);
    const admin = createAdminClient();
    const { page, limit, offset } = pagination(request.nextUrl.searchParams);

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
    const rawProfile = (user as any).profile;
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
    
    // Also fix subscription array if it exists
    if ((user as any).subscription && Array.isArray((user as any).subscription)) {
      (user as any).subscription = (user as any).subscription[0];
    }
    
    // Assign back the unwrapped profile so the frontend gets an object, not an array
    (user as any).profile = profile;

    const profileComplete = profile
      ? REQUIRED_PROFILE_FIELDS.every((f: string) => {
          const v = profile[f];
          return typeof v === "string" && v.trim().length > 0;
        })
      : false;

    const [{ data: resumes, error: resumeError }, { data: queue, error: queueError, count: queueCount }, { data: adminResumes, error: generatedError }, { data: adminCoverLetters, error: letterError }, { data: notifications, error: notificationError }] = await Promise.all([
timings.measure("resume_metadata",()=>resumeMetadata(adminAuth.userId,id)),
admin
      .from("job_queue")
      .select("id, title, company, job_url, status, source, created_at, applied_at, admin_notes, assigned_to", { count: "exact" })
      .eq("user_id", id)
      .order("created_at", { ascending: false }).order("id").range(offset, offset + limit - 1),
admin
      .from("admin_resumes")
      .select("id, title, job_title, company, job_description, template_id, expires_at, created_at, admin_id")
      .eq("user_id", id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
admin
      .from("admin_cover_letters")
      .select("id, title, company_name, job_title, expires_at, created_at, admin_id")
      .eq("user_id", id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
admin
      .from("notifications")
      .select("id, type, title, message, is_read, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
]);

for (const error of [resumeError, queueError, generatedError, letterError, notificationError]) if (error) throw error;

    // Find the base resume
    const displayResumes = resumes||[];
    const baseResume = displayResumes.find(resume => resume.is_base) || null;

    return NextResponse.json(
      apiSuccess({
        ...user,
        profileComplete,
        resumes: displayResumes,
        baseResume,
        queue: queue || [],
        queuePagination: paginationMeta(page, limit, queueCount ?? 0),
        adminResumes: adminResumes || [],
        adminCoverLetters: adminCoverLetters || [],
        notifications: notifications || [],
      }),{headers:{...timings.headers(),"Cache-Control":"private, no-store"}}
    );
  } catch (err) {
    console.error("Admin User Details GET exception:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
