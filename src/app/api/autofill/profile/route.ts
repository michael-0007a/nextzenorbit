/**
 * Autofill Profile API
 *
 * GET /api/autofill/profile
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, ERROR_CODES } from "@/types/api";
import { getAutofillProfile } from "@/services/autofill-service";
import { autofillProfileSchema } from "@/lib/validations/autofill";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    if (!user.email) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "User email is missing.", 400);
    }

    const result = await getAutofillProfile(user.id, user.email);

    if (!result.ok) {
      console.error("Autofill profile error:", result.error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to load profile.", 500);
    }

    const parsed = autofillProfileSchema.parse(result.data);

    return NextResponse.json(
      { success: true, data: parsed },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Autofill profile error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
