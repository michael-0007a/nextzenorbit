/**
 * Admin API: Users List
 *
 * GET /api/admin/users - List all users with profiles and subscriptions
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

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
        profile:profiles(full_name, avatar_url, preferred_role, location, phone, headline),
        subscription:subscriptions(plan_id, status),
        job_queue(status, claimed_by)
      `, { count: "exact" });

    // Optional email or name search (ilike on full_name is tricky with joined tables in Supabase RPC, so we do email for now)
    if (search) {
      query = query.ilike("email", `%${search}%`);
      // Note: To properly search by full_name, we'd ideally need a database view or an RPC.
      // We will filter client-side if it's a name search, or just rely on email for the backend query.
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Admin Users GET Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch users.");
    }

    const REQUIRED_PROFILE_FIELDS = ["full_name", "preferred_role", "location", "phone", "headline"];

    // Fetch claimed_by admin names
    const allClaimedByIds = (data || []).flatMap((u: any) => 
      u.job_queue?.map((j: any) => j.claimed_by).filter(Boolean)
    );
    const uniqueAdminIds = [...new Set(allClaimedByIds)] as string[];
    
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
    const processedData = (data || []).map((user: any) => {
      // Profile completeness
      const profile = user.profile;
      const profileComplete = profile
        ? REQUIRED_PROFILE_FIELDS.every((f) => {
            const v = profile[f as keyof typeof profile];
            return typeof v === "string" && v.trim().length > 0;
          })
        : false;

      // Job queue stats & claiming
      let claimedBy = null;
      let claimedByName = null;
      const jobCounts = { pending: 0, processing: 0, applied: 0, failed: 0, skipped: 0 };
      
      if (user.job_queue) {
        for (const job of user.job_queue) {
          if (job.status in jobCounts) {
            (jobCounts as any)[job.status]++;
          }
          if (job.claimed_by && !claimedBy) {
            claimedBy = job.claimed_by;
            claimedByName = adminNames[claimedBy] || null;
          }
        }
      }

      // Remove raw job_queue to save bandwidth
      const { job_queue, ...rest } = user;

      return {
        ...rest,
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
