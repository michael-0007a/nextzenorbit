/**
 * Admin API: Manual Subscription Activation
 *
 * POST /api/admin/subscription/activate
 *
 * Allows admins to manually activate a user's subscription.
 * Use when a payment was received but the webhook failed to activate.
 *
 * Body: { user_id: string, plan_id?: "free" | "pro" | "elite", duration_days?: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";
import { z } from "zod";
import { requireApprovedAccount } from "@/lib/onboarding";

const activateSchema = z.object({
  user_id: z.string().uuid(),
  plan_id: z.enum(["free", "pro", "elite"]).optional(),
  duration_days: z.number().min(1).max(365).optional().default(30),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const body = await request.json();
    const parsed = activateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid request.",
        400,
        parsed.error.flatten()
      );
    }

    const { user_id, plan_id, duration_days } = parsed.data;
    const approvalError = await requireApprovedAccount(user_id);
    if (approvalError) return approvalError;
    const admin = createAdminClient();

    // Check user exists
    const { data: user } = await admin
      .from("users")
      .select("id, email")
      .eq("id", user_id)
      .single();

    if (!user) {
      return apiError(ERROR_CODES.NOT_FOUND, "User not found.", 404);
    }

    // Calculate billing period
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + duration_days);

    // Check if user has an existing subscription row
    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("id, plan_id, status")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSub) {
      // Update existing subscription
      const updateData: Record<string, unknown> = {
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      };
      if (plan_id) updateData.plan_id = plan_id;

      const { error } = await admin
        .from("subscriptions")
        .update(updateData)
        .eq("id", existingSub.id);

      if (error) {
        console.error("[admin/subscription/activate] Update error:", error);
        return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to activate subscription.", 500);
      }

      console.log(
        `[admin/subscription/activate] ✅ Activated existing subscription for user=${user_id} plan=${plan_id || existingSub.plan_id} by admin=${adminAuth.userId}`
      );

      return NextResponse.json(
        apiSuccess({
          user_id,
          email: user.email,
          plan_id: plan_id || existingSub.plan_id,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          action: "updated",
        })
      );
    } else {
      // Create new subscription row
      const { error } = await admin
        .from("subscriptions")
        .insert({
          user_id,
          provider: "payu",
          plan_id: plan_id || "pro",
          status: "active",
          currency: "INR",
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        });

      if (error) {
        console.error("[admin/subscription/activate] Insert error:", error);
        return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to create subscription.", 500);
      }

      console.log(
        `[admin/subscription/activate] ✅ Created new subscription for user=${user_id} plan=${plan_id || "pro"} by admin=${adminAuth.userId}`
      );

      return NextResponse.json(
        apiSuccess({
          user_id,
          email: user.email,
          plan_id: plan_id || "pro",
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          action: "created",
        }),
        { status: 201 }
      );
    }
  } catch (err) {
    console.error("[admin/subscription/activate] Exception:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
