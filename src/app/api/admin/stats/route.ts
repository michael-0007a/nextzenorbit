/**
 * Admin API: Analytics Stats
 *
 * GET /api/admin/stats - Get aggregate counts for dashboard
 * Super Admin access required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin, isAuthError } from "@/lib/admin/guards";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const auth = await requireSuperAdmin();
    if (isAuthError(auth)) return auth;

    const admin = createAdminClient();

    // Run queries in parallel
    const [
      { count: usersCount },
      { count: ssoUsersCount },
      { count: proCount },
      { count: pendingQueue },
      { count: appliedQueue },
    ] = await Promise.all([
      admin.from("users").select("*", { count: "exact", head: true }).eq("role", "user"),
      admin.from("users").select("*", { count: "exact", head: true }).eq("role", "sso_user"),
      admin.from("subscriptions").select("*", { count: "exact", head: true }).eq("plan_id", "pro").eq("status", "active"),
      admin.from("job_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("job_queue").select("*", { count: "exact", head: true }).eq("status", "applied"),
    ]);

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
      }
    }));
  } catch (err) {
    console.error("Admin Stats GET error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch stats.");
  }
}
