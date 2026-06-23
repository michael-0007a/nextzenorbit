/**
 * Create Subscription
 *
 * POST /api/subscription/create
 * Auth required. Creates a Razorpay subscription for the authenticated user.
 *
 * Body: { plan: "pro" | "elite" }
 * Response: { subscriptionId, razorpayKey }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments";
import { PLANS } from "@/lib/subscription";
import { upsertSubscriptionCreated } from "@/services/subscription-service";
import { apiError, ERROR_CODES } from "@/types/api";
import type { PlanId } from "@/types/database";

const createSubscriptionSchema = z.object({
  plan: z.enum(["pro", "elite"]),
  currency: z.enum(["USD", "INR", "EUR", "GBP", "CAD", "AUD"]).optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
    }

    // 2. Validate input
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid JSON in request body.",
        400
      );
    }

    const parsed = createSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid request body.",
        400,
        parsed.error.flatten()
      );
    }

    const { plan, currency = "USD" } = parsed.data;

    // 3. Resolve plan pricing
    const planConfig = PLANS[plan];
    
    // Calculate total amount in paise/cents based on the currency
    const priceKey = `price_${currency.toLowerCase()}` as keyof typeof planConfig;
    const priceAmount = (planConfig[priceKey] as number) || 0;
    const totalAmountPaise = priceAmount * 100;

    // 4. Create subscription via provider
    const provider = getPaymentProvider();
    const result = await provider.createSubscription({
      planId: plan,
      customerId: user.id,
      email: user.email || "",
      totalAmountPaise,
      currency,
    });

    // 5. Save to database (upsert subscription row)
    const admin = createAdminClient();
    await upsertSubscriptionCreated(admin, user.id, {
      subscriptionId: result.subscriptionId,
      planId: plan as PlanId,
      provider: process.env.PAYMENT_PROVIDER as any || "payu",
      currency,
      amountPaise: totalAmountPaise,
    });

    // 6. Return details for frontend checkout
    console.log(
      `[subscription/create] Created subscription for user=${user.id} plan=${plan} sub=${result.subscriptionId}`
    );

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: result.subscriptionId,
        // For PayU, result might contain form fields
        payu: result.payu,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("[subscription/create] Error:", error);
    return apiError(
      ERROR_CODES.INTERNAL_ERROR,
      "Failed to create subscription. Please try again.",
      500
    );
  }
}
