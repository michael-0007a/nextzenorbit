/**
 * Unified Payment Abstraction Layer
 *
 * Routes payments to the correct gateway:
 * - PayU for INR payments
 * - USD Gateway (Airwallex/Stripe placeholder) for USD payments
 *
 * Usage:
 *   import { getPaymentProvider } from "@/lib/payments";
 *   const provider = getPaymentProvider("INR"); // Returns PayU
 *   const provider = getPaymentProvider("USD"); // Returns USD gateway
 */

import { payuProvider } from "./payu";
import { usdGatewayProvider } from "./usd-gateway";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(currency?: string): PaymentProvider {
  if (currency === "INR") {
    return payuProvider;
  }
  if (currency === "USD") {
    return usdGatewayProvider;
  }
  // Default to PayU for backward compatibility
  return payuProvider;
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
export { verifyPayUWebhook } from "./payu";
