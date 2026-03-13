/**
 * Resumes API — List + Create
 *
 * GET  /api/resumes — List user's resumes (non-deleted)
 * POST /api/resumes — Create a new resume
 *
 * Auth required. Uses admin client to bypass RLS.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createResumeSchema,
  createEmptyResumeContent,
} from "@/lib/validations/resume";
import type { ResumeContent } from "@/lib/validations/resume";
import { apiError, ERROR_CODES } from "@/types/api";
import { canCreateResume } from "@/lib/subscription";
import type { SubscriptionRow } from "@/types/database";

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
    const { data: resumes, error } = await admin
      .from("resumes")
      .select("id, title, is_base, version, template_id, file_url, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Resume list error:", error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch resumes.", 500);
    }

    return NextResponse.json({ success: true, data: resumes });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    const admin = createAdminClient();

    // Ensure user exists in public.users table (required for FK constraint)
    const { data: existingUser } = await admin
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingUser) {
      await admin.from("users").insert({
        id: user.id,
        email: user.email!,
        role: "user",
      });
    }

    // Check subscription limits
    const [subRes, countRes] = await Promise.all([
      admin.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
      admin
        .from("resumes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    if (!canCreateResume(subRes.data as SubscriptionRow | null, countRes.count ?? 0)) {
      return apiError(
        ERROR_CODES.SUBSCRIPTION_REQUIRED,
        "Resume limit reached. Upgrade your plan to create more resumes.",
        403
      );
    }

    // Validate input
    const body = await request.json();
    const parsed = createResumeSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid resume data.",
        400,
        parsed.error.flatten()
      );
    }

    // Pre-fill contact from profile if content is empty
    let content = parsed.data.content;
    if (!content) {
      // Fetch profile for pre-fill
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name, phone, location, linkedin_url")
        .eq("user_id", user.id)
        .maybeSingle();

      content = createEmptyResumeContent({
        full_name: profile?.full_name ?? "",
        email: user.email ?? "",
        phone: profile?.phone ?? "",
        location: profile?.location ?? "",
        linkedin_url: profile?.linkedin_url ?? "",
      });
    }

    const { data: resume, error } = await admin
      .from("resumes")
      .insert({
        user_id: user.id,
        title: parsed.data.title,
        content: content as ResumeContent,
        is_base: parsed.data.is_base ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error("Resume create error:", error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to create resume.", 500);
    }

    return NextResponse.json({ success: true, data: resume }, { status: 201 });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
