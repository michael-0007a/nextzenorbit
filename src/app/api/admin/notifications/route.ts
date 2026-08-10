/**
 * Admin Notifications API
 *
 * POST /api/admin/notifications — Send a notification to a user
 *   Body: { user_id, type, title, message?, metadata? }
 *   Types: 'resume_request', 'profile_update', 'admin_message'
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

const VALID_TYPES = ["resume_request", "profile_update", "admin_message"];

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const body = await request.json();
    const { user_id, type, title, message, metadata } = body;

    if (!user_id || !type || !title) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "user_id, type, and title are required."
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("notifications")
      .insert({
        user_id,
        type,
        title,
        message: message || null,
        metadata: { ...( metadata || {}), admin_id: adminAuth.userId },
      })
      .select()
      .single();

    if (error) {
      console.error("Admin Notifications POST Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to send notification.");
    }

    return NextResponse.json(apiSuccess(data), { status: 201 });
  } catch (err) {
    console.error("Admin Notifications POST exception:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
