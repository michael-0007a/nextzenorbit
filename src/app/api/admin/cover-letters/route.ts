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
import { z } from "zod";

const letterSchema = z.object({
  user_id: z.string().uuid(), title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(30000), job_title: z.string().max(200).optional(),
  company_name: z.string().max(200).optional(), job_description: z.string().max(10000).optional(),
});

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

    const parsed = letterSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiError(ERROR_CODES.VALIDATION_ERROR, "Provide a valid client, title and cover letter content.", 400);
    const { user_id, title, content, job_title, company_name, job_description } = parsed.data;

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
