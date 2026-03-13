/**
 * Razorpay Payment Provider
 *
 * Implements the PaymentProvider interface using the Razorpay Node SDK.
 * Server-side only — never import on the client.
 */

import Razorpay from "razorpay";
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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const razorpayProvider: PaymentProvider = {
  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const order = await razorpay.orders.create({
      amount: params.amountPaise,
      currency: params.currency || "INR",
      receipt: params.receipt,
      notes: params.notes || {},
    });

    return {
      orderId: order.id,
      amount: order.amount as number,
      currency: order.currency,
      provider: "razorpay",
      raw: order,
    };
  },

  async verifyPayment(params: VerifyPaymentParams): Promise<VerificationResult> {
    const body = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    const verified = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(params.signature)
    );

    return { verified, paymentId: params.paymentId };
  },

  async createSubscription(params: SubscriptionParams): Promise<SubscriptionResult> {
    const subscription = await razorpay.subscriptions.create({
      plan_id: params.planId,
      customer_notify: 1,
      total_count: 12,
      notes: {
        email: params.email,
        customer_id: params.customerId,
      },
    });

    return {
      subscriptionId: subscription.id,
      status: subscription.status || "created",
      provider: "razorpay",
      raw: subscription,
    };
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await razorpay.subscriptions.cancel(subscriptionId, false);
  },
};

// ── Webhook Signature Verification ──

export function verifyRazorpayWebhook(
  body: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

