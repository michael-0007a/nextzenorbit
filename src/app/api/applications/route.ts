/**
 * Applications API — List + Create
 *
 * GET  /api/applications — List user's applications
 * POST /api/applications — Create a new application
 *
 * Auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { apiError, ERROR_CODES } from "@/types/api";
import { canTrackApplication } from "@/lib/subscription";
import type { SubscriptionRow } from "@/types/database";

const createApplicationSchema = z.object({
  company: z.string().min(1, "Company is required").max(200),
  position: z.string().min(1, "Position is required").max(200),
  job_url: z.string().url().max(500).optional().nullable(),
  status: z.enum(["applied", "screening", "interview", "offer", "rejected"]).default("applied"),
  notes: z.string().max(2000).optional().nullable(),
  applied_at: z.string().datetime().optional(),
  follow_up_at: z.string().datetime().optional().nullable(),
});

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
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .order("applied_at", { ascending: false });

    if (error) {
      console.error("Applications list error:", error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch applications.", 500);
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    const body = await request.json();
    const parsed = createApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid application data.", 400, parsed.error.flatten());
    }

    const admin = createAdminClient();

    // Ensure user exists
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

    // Check subscription daily application limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [subRes, todayCountRes] = await Promise.all([
      admin.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
      admin
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString()),
    ]);

    if (!canTrackApplication(subRes.data as SubscriptionRow | null, todayCountRes.count ?? 0)) {
      return apiError(
        ERROR_CODES.SUBSCRIPTION_REQUIRED,
        "Daily job application tracking limit reached for your plan. Please upgrade to track more applications.",
        403
      );
    }

    const { data: application, error } = await admin
      .from("applications")
      .insert({
        user_id: user.id,
        ...parsed.data,
        applied_at: parsed.data.applied_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Application create error:", error.message);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to create application.", 500);
    }

    return NextResponse.json({ success: true, data: application }, { status: 201 });
  } catch {
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

