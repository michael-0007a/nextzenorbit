/**
 * User Notifications API
 *
 * GET  /api/notifications — Fetch unread notifications for the current user
 * PATCH /api/notifications — Mark notifications as read
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

export async function GET(): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("notifications")
      .select("id, type, title, message, metadata, created_at")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Notifications GET Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch notifications.");
    }

    return NextResponse.json(apiSuccess(data || []));
  } catch (err) {
    console.error("Notifications GET exception:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "ids array is required.");
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .in("id", ids);

    if (error) {
      console.error("Notifications PATCH Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to update notifications.");
    }

    return NextResponse.json(apiSuccess({ updated: ids.length }));
  } catch (err) {
    console.error("Notifications PATCH exception:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
