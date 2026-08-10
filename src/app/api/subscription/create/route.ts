/**
 * Create Subscription
 *
 * POST /api/subscription/create
 * Auth required. Creates a subscription via the selected payment gateway.
 *
 * Body: { plan: "pro" | "elite", currency?: "USD" | "INR", paymentMethod?: "usd" | "inr" }
 * Response: { subscriptionId, payu?, redirectUrl? }
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
  currency: z.enum(["USD", "INR"]).optional(),
  paymentMethod: z.enum(["usd", "inr"]).optional(),
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

    const { plan, paymentMethod = "inr" } = parsed.data;
    
    // Determine currency from payment method
    const currency = paymentMethod === "inr" ? "INR" : "USD";

    // 3. Resolve plan pricing
    const planConfig = PLANS[plan];
    
    // Get the correct price based on currency
    const priceKey = `price_${currency.toLowerCase()}` as keyof typeof planConfig;
    const priceAmount = (planConfig[priceKey] as number) || 0;
    const totalAmountPaise = Math.round(priceAmount * 100);

    // 4. Create subscription via the correct provider
    const provider = getPaymentProvider(currency);
    const result = await provider.createSubscription({
      planId: plan,
      customerId: user.id,
      email: user.email || "",
      totalAmountPaise,
      currency,
    });

    // 5. Determine the provider type for DB storage
    const providerType = paymentMethod === "inr" ? "payu" : "usd_gateway";

    // 6. Save to database (upsert subscription row)
    const admin = createAdminClient();
    await upsertSubscriptionCreated(admin, user.id, {
      subscriptionId: result.subscriptionId,
      planId: plan as PlanId,
      provider: providerType as any,
      currency,
      amountPaise: totalAmountPaise,
    });

    // 7. Return details for frontend checkout
    console.log(
      `[subscription/create] Created subscription for user=${user.id} plan=${plan} sub=${result.subscriptionId} provider=${providerType}`
    );

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: result.subscriptionId,
        // PayU flow: form data for redirect
        payu: result.payu,
        // USD gateway flow: redirect URL
        redirectUrl: result.redirectUrl,
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
