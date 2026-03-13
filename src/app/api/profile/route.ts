/**
 * Profile API Routes
 *
 * GET  /api/profile — Return authenticated user's profile
 * PATCH /api/profile — Update profile fields
 *
 * Auth required. Uses admin client for updates to bypass RLS.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateProfileSchema } from "@/lib/validations/profile";
import { apiError, ERROR_CODES } from "@/types/api";

export async function GET(): Promise<Response> {
  try {
    // Use admin client to avoid RLS recursion issues
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !profile) {
      return apiError(ERROR_CODES.NOT_FOUND, "Profile not found.", 404);
    }

    return NextResponse.json({ success: true, data: profile });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid profile data.",
        400,
        parsed.error.flatten()
      );
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient();

    // First, ensure user exists in public.users table (required for FK constraint)
    const { data: existingUser } = await admin
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingUser) {
      // Create user record first
      const { error: userError } = await admin
        .from("users")
        .insert({
          id: user.id,
          email: user.email!,
          role: "user",
        });

      if (userError) {
        console.error("Failed to create user:", userError.message);
        return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to initialize user.", 500);
      }
    }

    // Now check if profile exists
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let profile;
    let error;

    if (existing) {
      // Update existing profile
      const result = await admin
        .from("profiles")
        .update({
          ...parsed.data,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .maybeSingle();

      profile = result.data;
      error = result.error;
    } else {
      // Create new profile
      const result = await admin
        .from("profiles")
        .insert({
          user_id: user.id,
          ...parsed.data,
        })
        .select()
        .single();

      profile = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Profile update error:", error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to update profile.", 500);
    }

    if (!profile) {
      console.error("Profile update returned no data");
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Profile update failed.", 500);
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (err) {
    console.error("Profile PATCH error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}



