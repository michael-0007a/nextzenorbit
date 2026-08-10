/**
 * USD Payment Gateway — Placeholder
 *
 * Placeholder implementation for USD payments via Airwallex or Stripe.
 * Replace this with the actual gateway implementation when ready.
 * Server-side only.
 */

import type {
  PaymentProvider,
  CreateOrderParams,
  OrderResult,
  VerifyPaymentParams,
  VerificationResult,
  SubscriptionParams,
  SubscriptionResult,
} from "./types";

export const usdGatewayProvider: PaymentProvider = {
  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    // TODO: Replace with actual Airwallex/Stripe order creation
    const txnid = params.receipt;
    const amount = params.amountPaise / 100;

    console.log(
      `[usd-gateway] Placeholder: Would create order for $${amount} (receipt: ${txnid})`
    );

    return {
      orderId: txnid,
      amount: params.amountPaise,
      currency: "USD",
      provider: "usd_gateway",
      redirectUrl: undefined, // Will be the checkout URL when gateway is configured
      raw: { placeholder: true },
    };
  },

  async verifyPayment(params: VerifyPaymentParams): Promise<VerificationResult> {
    // TODO: Replace with actual gateway verification
    return { verified: true, paymentId: params.paymentId };
  },

  async createSubscription(params: SubscriptionParams): Promise<SubscriptionResult> {
    const txnid = `usd_txn_${Date.now()}`;
    const amount = params.totalAmountPaise / 100;

    console.log(
      `[usd-gateway] Placeholder: Would create subscription for $${amount} (plan: ${params.planId})`
    );

    // TODO: Replace with actual Airwallex/Stripe subscription creation
    // When implemented, this should return a redirectUrl to the checkout page

    return {
      subscriptionId: txnid,
      status: "pending",
      provider: "usd_gateway",
      redirectUrl: undefined, // Will be the checkout URL when gateway is configured
      raw: { placeholder: true },
    };
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    // TODO: Replace with actual gateway cancellation
    console.log(`[usd-gateway] Placeholder: Would cancel subscription ${subscriptionId}`);
  },
};
