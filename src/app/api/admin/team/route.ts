/**
 * Admin API: Team Management
 *
 * GET /api/admin/team - List all admin and super_admin users
 * POST /api/admin/team - Create a new admin user
 * PATCH /api/admin/team - Promote/demote admin
 * DELETE /api/admin/team - Remove admin (set to user)
 *
 * Super Admin access required for all endpoints.
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
    const { data, error } = await admin
      .from("users")
      .select(`
        id, email, role, created_at,
        profile:profiles(full_name, avatar_url)
      `)
      .in("role", ["admin", "super_admin"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(apiSuccess(data || []));
  } catch (err) {
    console.error("Admin Team GET error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch team.");
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const auth = await requireSuperAdmin();
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { email, password, full_name, role = "admin" } = body;

    if (!email || !password || !full_name) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Email, password, and full name are required.");
    }

    if (role !== "admin" && role !== "super_admin") {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Role must be admin or super_admin.");
    }

    const admin = createAdminClient();

    // 1. Create auth user with confirmed email
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        provider: "email",
      },
    });

    if (authError) {
      return apiError(ERROR_CODES.INTERNAL_ERROR, authError.message);
    }

    const newUserId = authData.user.id;

    // 2. The trigger creates the users and profiles rows automatically, 
    //    but we need to update the role and full name.
    
    // Update role
    await admin.from("users").update({ role }).eq("id", newUserId);
    
    // Update profile
    await admin.from("profiles").update({ full_name }).eq("id", newUserId);

    return NextResponse.json(apiSuccess({ id: newUserId, email, role, full_name }));
  } catch (err) {
    console.error("Admin Team POST error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to create admin.");
  }
}

export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const auth = await requireSuperAdmin();
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { id, role } = body;

    if (!id || (role !== "admin" && role !== "super_admin")) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid parameters.");
    }

    // Prevent removing the last super admin (basic safeguard)
    if (role === "admin" && id === auth.userId) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Cannot demote yourself.");
    }

    const admin = createAdminClient();
    const { error } = await admin.from("users").update({ role }).eq("id", id);

    if (error) throw error;

    return NextResponse.json(apiSuccess({ success: true }));
  } catch (err) {
    console.error("Admin Team PATCH error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to update role.");
  }
}

export async function DELETE(request: NextRequest): Promise<Response> {
  try {
    const auth = await requireSuperAdmin();
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return apiError(ERROR_CODES.VALIDATION_ERROR, "ID is required.");

    if (id === auth.userId) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Cannot remove yourself.");
    }

    const admin = createAdminClient();
    
    // We don't delete the user, we just set their role back to "user"
    const { error } = await admin.from("users").update({ role: "user" }).eq("id", id);

    if (error) throw error;

    return NextResponse.json(apiSuccess({ success: true }));
  } catch (err) {
    console.error("Admin Team DELETE error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to remove admin.");
  }
}
