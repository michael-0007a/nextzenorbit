/**
 * Create Payment Order
 *
 * POST /api/payments/create-order
 * Auth required. Creates a Razorpay/Cashfree order for plan upgrade.
 *
 * Body: { planId: "pro" | "elite", billingCycle: "monthly" | "annual" }
 * Response: { orderId, amount, currency, provider }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";
import { apiError, ERROR_CODES } from "@/types/api";
import { requireApprovedAccount } from "@/lib/onboarding";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymentOrder } from "@/services/subscription-service";
import { PLANS } from "@/lib/subscription";
import { rateLimit } from "@/lib/rate-limit";

const createOrderSchema = z.object({
  planId: z.enum(["pro", "elite"]),
  billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
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

    const approvalError = await requireApprovedAccount(user.id);
    if (approvalError) return approvalError;
    const limited = await rateLimit("checkout", user.id, 5, 300);
    if (limited) return limited;

    // 2. Validate input
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid request body.",
        400,
        parsed.error.flatten()
      );
    }

    const { planId, billingCycle, currency = "INR" } = parsed.data;
    if (currency !== "INR" || billingCycle !== "monthly") return apiError(ERROR_CODES.VALIDATION_ERROR, "Only monthly INR checkout is available.", 400);
    const amount = PLANS[planId].price_paise;
    const order = await getPaymentProvider("INR").createSubscription({ planId, customerId: user.id, email: user.email || "", totalAmountPaise: amount, currency });
    await createPaymentOrder(createAdminClient(), user.id, { subscriptionId: order.subscriptionId, planId, amountPaise: amount, currency });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.subscriptionId,
        amount,
        currency,
        provider: order.provider,
        payu: order.payu,
        keyId: process.env.PAYU_MERCHANT_KEY,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    return apiError(
      ERROR_CODES.INTERNAL_ERROR,
      "Failed to create payment order.",
      500
    );
  }
}

