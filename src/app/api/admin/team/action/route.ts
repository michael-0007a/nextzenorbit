import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin, isAuthError } from "@/lib/admin/guards";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const auth = await requireSuperAdmin();
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { action, userId, newPassword } = body;

    if (!action || !userId) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Action and user ID are required.");
    }

    // Prevent acting on self
    if (userId === auth.userId) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Cannot perform this action on yourself.");
    }

    const admin = createAdminClient();

    if (action === "reset_password") {
      if (!newPassword || newPassword.length < 6) {
        return apiError(ERROR_CODES.VALIDATION_ERROR, "A valid new password is required (min 6 characters).");
      }
      const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) throw error;
      return NextResponse.json(apiSuccess({ success: true, message: "Password updated successfully" }));
    }

    if (action === "suspend") {
      // 876000h is 100 years
      const { error: authError } = await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
      if (authError) throw authError;

      const { error: dbError } = await admin.from("users").update({ is_suspended: true }).eq("id", userId);
      if (dbError) throw dbError;

      return NextResponse.json(apiSuccess({ success: true, message: "User suspended successfully" }));
    }

    if (action === "unsuspend") {
      const { error: authError } = await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
      if (authError) throw authError;

      const { error: dbError } = await admin.from("users").update({ is_suspended: false }).eq("id", userId);
      if (dbError) throw dbError;

      return NextResponse.json(apiSuccess({ success: true, message: "User unsuspended successfully" }));
    }

    return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid action specified.");
  } catch (err) {
    console.error("Admin Team Action POST error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to execute team action.");
  }
}
