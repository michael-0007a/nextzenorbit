/**
 * Unified Payment Abstraction Layer
 *
 * Switch between Razorpay (primary) and Cashfree (fallback)
 * using the PAYMENT_PROVIDER environment variable.
 *
 * Usage:
 *   import { getPaymentProvider, calculateGST, PLAN_PRICING } from "@/lib/payments";
 *   const provider = getPaymentProvider();
 *   const order = await provider.createOrder({ ... });
 */

import { razorpayProvider } from "./razorpay";
import { cashfreeProvider } from "./cashfree";
import { payuProvider } from "./payu";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER || "payu";

  switch (provider) {
    case "cashfree":
      return cashfreeProvider;
    case "razorpay":
      return razorpayProvider;
    case "payu":
    default:
      return payuProvider;
  }
}

// Re-export types and utilities
export { calculateGST, GST_RATE, PLAN_PRICING } from "./types";
export type {
  PaymentProvider,
  CreateOrderParams,
  OrderResult,
  VerifyPaymentParams,
  VerificationResult,
  SubscriptionParams,
  SubscriptionResult,
} from "./types";
export { verifyRazorpayWebhook } from "./razorpay";
export { verifyCashfreeWebhook } from "./cashfree";
export { verifyPayUWebhook } from "./payu";

