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
import { getPaymentProvider, calculateGST, PLAN_PRICING } from "@/lib/payments";
import { apiError, ERROR_CODES } from "@/types/api";

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

    const { planId, billingCycle, currency = "USD" } = parsed.data;

    // 3. Calculate amount
    const plan = PLAN_PRICING[planId];
    
    // The amount in PLAN_PRICING is in base currency, we need to convert it to paise/cents
    const baseCurrencyAmount =
      billingCycle === "annual" 
        ? plan.annual[currency as keyof typeof plan.annual] 
        : plan.monthly[currency as keyof typeof plan.monthly];
        
    const basePaise = Math.round(baseCurrencyAmount * 100);
    
    const { base, gst, total } = calculateGST(basePaise);

    // 4. Create order
    const provider = getPaymentProvider();
    const order = await provider.createOrder({
      amountPaise: total,
      currency: currency,
      receipt: `${planId}_${user.id}_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan_id: planId,
        billing_cycle: billingCycle,
        base_amount: String(base),
        gst_amount: String(gst),
        firstname: user.user_metadata?.full_name || "Customer",
        email: user.email || "",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        provider: order.provider,
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

