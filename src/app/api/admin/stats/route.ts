/**
 * Admin API: Analytics Stats
 *
 * GET /api/admin/stats - Get aggregate counts for dashboard
 * Super Admin access required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) return auth;

    // Check if user is supervisor or super admin to see all stats
    if (auth.role === "admin") {
      return apiError(ERROR_CODES.FORBIDDEN, "Supervisor or Super Admin access required.", 403);
    }

    const admin = createAdminClient();

    // Run aggregate queries in parallel
    const [
      { count: usersCount },
      { count: ssoUsersCount },
      { count: proCount },
      { count: pendingQueue },
      { count: appliedQueue },
      { data: adminsData }
    ] = await Promise.all([
      admin.from("users").select("*", { count: "exact", head: true }).eq("role", "user"),
      admin.from("users").select("*", { count: "exact", head: true }).eq("role", "sso_user"),
      admin.from("subscriptions").select("*", { count: "exact", head: true }).eq("plan_id", "pro").eq("status", "active"),
      admin.from("job_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("job_queue").select("*", { count: "exact", head: true }).eq("status", "applied"),
      admin.from("users").select("id, email, role, profile:profiles!profiles_user_id_fkey(full_name)").in("role", ["admin", "supervisor_admin", "super_admin"])
    ]);

    // Fetch per-admin stats
    const adminPerformance = await Promise.all(
      (adminsData || []).map(async (a: any) => {
        const adminId = a.id;
        const [
          { count: clientsCount },
          { count: jobsApplied },
          { count: jobsPending }
        ] = await Promise.all([
          admin.from("profiles").select("*", { count: "exact", head: true }).eq("assigned_admin_id", adminId),
          admin.from("job_queue").select("*", { count: "exact", head: true }).eq("claimed_by", adminId).eq("status", "applied"),
          admin.from("job_queue").select("*", { count: "exact", head: true }).eq("claimed_by", adminId).eq("status", "pending"),
        ]);
        
        return {
          id: adminId,
          name: a.profile?.[0]?.full_name || a.profile?.full_name || a.email,
          email: a.email,
          role: a.role,
          clientsCount: clientsCount || 0,
          jobsApplied: jobsApplied || 0,
          jobsPending: jobsPending || 0,
        };
      })
    );

    return NextResponse.json(apiSuccess({
      users: {
        regular: usersCount || 0,
        sso: ssoUsersCount || 0,
        total: (usersCount || 0) + (ssoUsersCount || 0),
      },
      subscriptions: {
        pro_active: proCount || 0,
      },
      queue: {
        pending: pendingQueue || 0,
        applied: appliedQueue || 0,
        total: (pendingQueue || 0) + (appliedQueue || 0),
      },
      adminPerformance
    }));
  } catch (err) {
    console.error("Admin Stats GET error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch stats.");
  }
}
