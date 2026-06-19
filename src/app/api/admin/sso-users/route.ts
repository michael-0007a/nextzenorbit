/**
 * Admin API: SSO Users Management
 *
 * GET /api/admin/sso-users - List all sso_user accounts
 * POST /api/admin/sso-users - Create a new SSO user (no billing)
 * DELETE /api/admin/sso-users - Deactivate an SSO user
 *
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
    const { data, error } = await admin
      .from("users")
      .select(`
        id, email, role, created_at,
        profile:profiles(full_name, avatar_url)
      `)
      .eq("role", "sso_user")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(apiSuccess(data || []));
  } catch (err) {
    console.error("Admin SSO Users GET error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch SSO users.");
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const auth = await requireSuperAdmin();
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { email, password, full_name } = body;

    if (!email || !password || !full_name) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Email, password, and full name are required.");
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

    // 2. The trigger creates the users and profiles rows automatically.
    
    // Update role
    await admin.from("users").update({ role: "sso_user" }).eq("id", newUserId);
    
    // Update profile
    await admin.from("profiles").update({ full_name }).eq("id", newUserId);

    // 3. Create active free subscription for them (so they don't hit paywalls)
    // The trigger might have created a trial subscription, so we update it or insert if missing
    const { data: existingSub } = await admin.from("subscriptions").select("id").eq("user_id", newUserId).maybeSingle();
    
    if (existingSub) {
      await admin.from("subscriptions").update({
        plan_id: "free",
        status: "active",
        current_period_end: null
      }).eq("user_id", newUserId);
    } else {
      await admin.from("subscriptions").insert({
        user_id: newUserId,
        plan_id: "free",
        status: "active",
        current_period_end: null
      });
    }

    return NextResponse.json(apiSuccess({ id: newUserId, email, full_name }));
  } catch (err) {
    console.error("Admin SSO Users POST error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to create SSO user.");
  }
}

export async function DELETE(request: NextRequest): Promise<Response> {
  try {
    const auth = await requireSuperAdmin();
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return apiError(ERROR_CODES.VALIDATION_ERROR, "ID is required.");

    const admin = createAdminClient();
    
    // We don't fully delete the user, we just set their role to user and maybe cancel their sub.
    // However, to completely stop SSO login, we should probably delete the auth user or disable it.
    // For now, we'll just set role to 'user' which removes their free access and subjects them to billing.
    
    const { error } = await admin.from("users").update({ role: "user" }).eq("id", id);

    if (error) throw error;

    return NextResponse.json(apiSuccess({ success: true }));
  } catch (err) {
    console.error("Admin SSO Users DELETE error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to deactivate SSO user.");
  }
}
