/**
 * Payment Types & Interfaces
 *
 * Unified payment abstraction for PayU (INR) + USD Gateway (Airwallex/Stripe placeholder).
 * Both providers implement the PaymentProvider interface.
 */

// ── Provider Interface ──

export interface PaymentProvider {
  createOrder(params: CreateOrderParams): Promise<OrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerificationResult>;
  createSubscription(params: SubscriptionParams): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<void>;
}

// ── Order ──

export interface CreateOrderParams {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface OrderResult {
  orderId: string;
  amount: number;
  currency: string;
  provider: "payu" | "usd_gateway";
  payu?: Record<string, string>; // PayU specific redirect data
  redirectUrl?: string; // For USD gateway checkout redirect
  raw: unknown;
}

// ── Payment Verification ──

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface VerificationResult {
  verified: boolean;
  paymentId: string;
}

// ── Subscription ──

export interface SubscriptionParams {
  planId: string;
  customerId: string;
  email: string;
  totalAmountPaise: number;
  currency?: string;
}

export interface SubscriptionResult {
  subscriptionId: string;
  status: string;
  provider: "payu" | "usd_gateway";
  payu?: Record<string, string>; // PayU specific redirect data
  redirectUrl?: string; // For USD gateway checkout redirect
  raw: unknown;
}

// ── Pricing Plans ──

export const PLAN_PRICING = {
  free: {
    name: "Plan 1",
    monthly: { INR: 13999, USD: 149 },
    annual: { INR: 167988, USD: 1788 },
  },
  pro: {
    name: "Plan 2",
    monthly: { INR: 18999, USD: 199 },
    annual: { INR: 227988, USD: 2388 },
  },
  elite: {
    name: "Plan 3",
    monthly: { INR: 23999, USD: 249 },
    annual: { INR: 287988, USD: 2988 },
  },
} as const;

// ── GST ──

export const GST_RATE = 0.18; // 18%

export function calculateGST(amountPaise: number): {
  base: number;
  gst: number;
  total: number;
} {
  const gst = Math.round(amountPaise * GST_RATE);
  return {
    base: amountPaise,
    gst,
    total: amountPaise + gst,
  };
}

