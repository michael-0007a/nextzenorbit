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
    name: "Free",
    monthly: { INR: 0, USD: 0, EUR: 0, GBP: 0, CAD: 0, AUD: 0 },
    annual: { INR: 0, USD: 0, EUR: 0, GBP: 0, CAD: 0, AUD: 0 },
  },
  pro: {
    name: "Pro",
    monthly: { INR: 499, USD: 99.99, EUR: 9, GBP: 8, CAD: 12, AUD: 14 },
    annual: { INR: 3999, USD: 79, EUR: 79, GBP: 69, CAD: 99, AUD: 119 },
  },
  elite: {
    name: "Elite",
    monthly: { INR: 999, USD: 179.99, EUR: 19, GBP: 15, CAD: 25, AUD: 29 },
    annual: { INR: 7999, USD: 149, EUR: 149, GBP: 119, CAD: 199, AUD: 229 },
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

