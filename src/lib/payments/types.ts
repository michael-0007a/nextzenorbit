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
  provider: "razorpay" | "cashfree" | "payu";
  payu?: Record<string, string>; // Add PayU specific redirect data
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
}

export interface SubscriptionResult {
  subscriptionId: string;
  status: string;
  provider: "razorpay" | "cashfree" | "payu";
  payu?: Record<string, string>; // Add PayU specific redirect data
  raw: unknown;
}

// ── Pricing Plans ──

export const PLAN_PRICING = {
  free: {
    name: "Free",
    monthly_paise: 0,
    annual_paise: 0,
  },
  pro: {
    name: "Pro",
    monthly_paise: 49_900,      // ₹499
    annual_paise: 399_900,      // ₹3,999
  },
  elite: {
    name: "Elite",
    monthly_paise: 99_900,      // ₹999
    annual_paise: 799_900,      // ₹7,999
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

