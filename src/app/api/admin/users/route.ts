/**
 * Admin API: Users List
 *
 * GET /api/admin/users - List all users with profiles and subscriptions
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    const admin = createAdminClient();

    let query = admin
      .from("users")
      .select(`
        id,
        email,
        role,
        created_at,
        profile:profiles!profiles_user_id_fkey(full_name, avatar_url, preferred_role, location, phone, headline, assigned_admin_id),
        subscription:subscriptions!inner(plan_id, status),
        job_queue:job_queue!job_queue_user_id_fkey(status, claimed_by)
      `, { count: "exact" })
      .eq("role", "user")
      .in("subscriptions.status", ["active", "trialing"]);

    if (search) {
      query = query.ilike("email", `%${search}%`);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Admin Users GET Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch users.");
    }

    const REQUIRED_PROFILE_FIELDS = ["full_name", "preferred_role", "location", "phone", "headline"];

    // Fetch assigned admin names
    const allAssignedAdminIds = (data || []).map((u: any) => {
      const p = Array.isArray(u.profile) ? u.profile[0] : u.profile;
      return p?.assigned_admin_id;
    }).filter(Boolean);
    
    const uniqueAdminIds = [...new Set(allAssignedAdminIds)] as string[];
    
    let adminNames: Record<string, string> = {};
    if (uniqueAdminIds.length > 0) {
      const { data: admins } = await admin
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", uniqueAdminIds);
        
      if (admins) {
        adminNames = Object.fromEntries(admins.map((a: any) => [a.user_id, a.full_name]));
      }
    }

    // Process data to include profile completeness and job stats
    const processedData = (data || [])
      .filter((user: any) => {
        const p = Array.isArray(user.profile) ? user.profile[0] : user.profile;
        // If the requester is an admin, they should only see users assigned to them
        if (adminAuth.role === "admin") {
          return p?.assigned_admin_id === adminAuth.userId;
        }
        return true;
      })
      .map((user: any) => {
      // Safely unwrap nested arrays
      const profile = Array.isArray(user.profile) ? user.profile[0] : user.profile;
      const subscription = Array.isArray(user.subscription) ? user.subscription[0] : user.subscription;

      // Profile completeness
      const profileComplete = profile
        ? REQUIRED_PROFILE_FIELDS.every((f) => {
            const v = profile[f as keyof typeof profile];
            return typeof v === "string" && v.trim().length > 0;
          })
        : false;

      // Job queue stats & claiming
      let claimedBy = profile?.assigned_admin_id || null;
      let claimedByName = claimedBy ? adminNames[claimedBy] || null : null;
      const jobCounts = { pending: 0, processing: 0, applied: 0, failed: 0, skipped: 0 };
      
      const jobQueue = Array.isArray(user.job_queue) ? user.job_queue : (user.job_queue ? [user.job_queue] : []);
      for (const job of jobQueue) {
        if (job.status in jobCounts) {
          (jobCounts as any)[job.status]++;
        }
      }

      // Remove raw job_queue to save bandwidth
      const { job_queue, ...rest } = user;

      return {
        ...rest,
        profile,
        subscription,
        profileComplete,
        claimedBy,
        claimedByName,
        jobCounts,
      };
    });

    return NextResponse.json(
      apiSuccess(processedData, {
        pagination: {
          page,
          perPage: limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      })
    );
  } catch (err) {
    console.error("Admin Users GET exception:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

