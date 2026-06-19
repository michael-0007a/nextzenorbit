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
        profile:profiles(full_name, avatar_url),
        subscription:subscriptions(plan_id, status)
      `, { count: "exact" });

    // Optional email search (not ideal for full_name due to separate table, but good enough for now)
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

    return NextResponse.json(
      apiSuccess(data || [], {
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
