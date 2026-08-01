/**
 * Payment Types & Interfaces
 *
 * Unified payment abstraction for Razorpay + Cashfree.
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
  provider: "payu";
  payu: Record<string, string>; // PayU specific redirect data is mandatory for PayU
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
  provider: "payu";
  payu: Record<string, string>; // PayU specific redirect data is mandatory for PayU
  raw: unknown;
}

// ── Pricing Plans ──

export const PLAN_PRICING = {
  free: {
    name: "Plan 1",
    monthly: { INR: 10999, USD: 130, EUR: 120, GBP: 100, CAD: 180, AUD: 200 },
    annual: { INR: 131988, USD: 1560, EUR: 1440, GBP: 1200, CAD: 2160, AUD: 2400 },
  },
  pro: {
    name: "Plan 2",
    monthly: { INR: 16999, USD: 200, EUR: 190, GBP: 160, CAD: 280, AUD: 310 },
    annual: { INR: 203988, USD: 2400, EUR: 2280, GBP: 1920, CAD: 3360, AUD: 3720 },
  },
  elite: {
    name: "Plan 3",
    monthly: { INR: 22999, USD: 270, EUR: 260, GBP: 220, CAD: 380, AUD: 420 },
    annual: { INR: 275988, USD: 3240, EUR: 3120, GBP: 2640, CAD: 4560, AUD: 5040 },
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

