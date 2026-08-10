/**
 * Admin API: Admin-Generated Cover Letters
 * 
 * GET  /api/admin/cover-letters?user_id=X - List admin-generated cover letters for a user
 * POST /api/admin/cover-letters - Create a new admin-generated cover letter
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
    const userId = searchParams.get("user_id");

    if (!userId) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "user_id is required");
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("admin_cover_letters")
      .select("*")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin Cover Letters GET Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch cover letters.");
    }

    return NextResponse.json(apiSuccess(data || []));
  } catch (err) {
    console.error("Admin Cover Letters GET exception:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const body = await request.json();
    const { user_id, title, content, job_title, company_name, job_description } = body;

    if (!user_id || !title || !content) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "user_id, title, and content are required.");
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("admin_cover_letters")
      .insert({
        user_id,
        admin_id: adminAuth.userId,
        title,
        content,
        job_title: job_title || null,
        company_name: company_name || null,
        job_description: job_description || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Admin Cover Letters POST Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to create cover letter.");
    }

    return NextResponse.json(apiSuccess(data), { status: 201 });
  } catch (err) {
    console.error("Admin Cover Letters POST exception:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
