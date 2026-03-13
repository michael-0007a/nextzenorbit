/**
 * Cashfree Payment Provider (Fallback)
 *
 * Implements PaymentProvider using Cashfree REST API.
 * No SDK — uses fetch directly.
 * Server-side only.
 */

import crypto from "crypto";
import type {
  PaymentProvider,
  CreateOrderParams,
  OrderResult,
  VerifyPaymentParams,
  VerificationResult,
  SubscriptionParams,
  SubscriptionResult,
} from "./types";

const CASHFREE_BASE =
  process.env.NODE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const headers = {
  "Content-Type": "application/json",
  "x-client-id": process.env.CASHFREE_APP_ID!,
  "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
  "x-api-version": "2023-08-01",
};

export const cashfreeProvider: PaymentProvider = {
  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const res = await fetch(`${CASHFREE_BASE}/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        order_amount: params.amountPaise / 100, // Cashfree uses rupees, not paise
        order_currency: params.currency || "INR",
        order_id: params.receipt,
        order_note: params.notes?.description || "",
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Cashfree createOrder failed: ${JSON.stringify(err)}`);
    }

    const order = await res.json();

    return {
      orderId: order.order_id,
      amount: params.amountPaise,
      currency: params.currency || "INR",
      provider: "cashfree",
      raw: order,
    };
  },

  async verifyPayment(params: VerifyPaymentParams): Promise<VerificationResult> {
    // Cashfree verifies by fetching the order status server-side
    const res = await fetch(`${CASHFREE_BASE}/orders/${params.orderId}`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      return { verified: false, paymentId: params.paymentId };
    }

    const order = await res.json();
    const verified = order.order_status === "PAID";

    return { verified, paymentId: params.paymentId };
  },

  async createSubscription(params: SubscriptionParams): Promise<SubscriptionResult> {
    const res = await fetch(`${CASHFREE_BASE}/subscriptions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        subscription_id: `sub_${params.customerId}_${Date.now()}`,
        plan_id: params.planId,
        customer_email: params.email,
        customer_phone: "",
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Cashfree createSubscription failed: ${JSON.stringify(err)}`);
    }

    const sub = await res.json();

    return {
      subscriptionId: sub.subscription_id || sub.cf_subscription_id,
      status: sub.subscription_status || "created",
      provider: "cashfree",
      raw: sub,
    };
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const res = await fetch(
      `${CASHFREE_BASE}/subscriptions/${subscriptionId}/cancel`,
      { method: "POST", headers }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Cashfree cancelSubscription failed: ${JSON.stringify(err)}`);
    }
  },
};

// ── Webhook Signature Verification ──

export function verifyCashfreeWebhook(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  const payload = timestamp + body;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.CASHFREE_WEBHOOK_SECRET!)
    .update(payload)
    .digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "base64"),
      Buffer.from(signature, "base64")
    );
  } catch {
    return false;
  }
}

