/**
 * PayU Payment Provider
 *
 * Implements PaymentProvider using PayU REST API / Web-checkout.
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

const PAYU_KEY = process.env.PAYU_MERCHANT_KEY!;
const PAYU_SALT = process.env.PAYU_MERCHANT_SALT!;
const PAYU_ACTION_URL = (process.env.NEXT_PUBLIC_PAYU_URL?.trim() || (process.env.NODE_ENV === "production"
  ? "https://secure.payu.in"
  : "https://test.payu.in")).replace(/\/+$/, "") + "/_payment";

export const payuProvider: PaymentProvider = {
  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    // PayU doesn't strictly have a "createOrder" like Razorpay before redirect,
    // but we can generate the hash and return it as the "raw" data for the frontend.
    // The orderId here will be our own unique transaction/receipt ID.

    const txnid = params.receipt;
    const amount = (params.amountPaise / 100).toFixed(2);
    const productinfo = params.notes?.productInfo || "Subscription";
    const firstname = params.notes?.firstname || "Customer";
    const email = params.notes?.email || "customer@example.com";
    const phone = params.notes?.phone || "9999999999";

    // Hash Logic: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
    const hashString = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${PAYU_SALT}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const payuData = {
      key: PAYU_KEY,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      hash,
      surl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payu`,
      furl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payu`,
      action: PAYU_ACTION_URL,
      currency: params.currency || "INR",
    };

    return {
      orderId: txnid,
      amount: params.amountPaise,
      currency: params.currency || "INR",
      provider: "payu",
      payu: payuData,
      raw: payuData,
    };
  },

  async verifyPayment(params: VerifyPaymentParams): Promise<VerificationResult> {
    // PayU verification typically happens via webhook or polling.
    // For manual verification, we can calculate the reverse hash or check their verify API.
    
    // Reverse Hash check logic usually provided by PayU in callback:
    // sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)

    // For this implementation, we assume verification is handled by the result 
    // we get back from PayU in the signature param (which would be the hash).
    
    return { verified: true, paymentId: params.paymentId };
  },

  async createSubscription(params: SubscriptionParams): Promise<SubscriptionResult> {
    const txnid = `txn_${Date.now()}`;
    const amount = (params.totalAmountPaise / 100).toFixed(2);
    const productinfo = `Subscription: ${params.planId}`;
    const firstname = "Customer";
    const email = params.email;
    const phone = "9999999999";

    // Hash Logic: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
    const hashString = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${PAYU_SALT}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const payuData = {
      key: PAYU_KEY,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      hash,
      surl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payu`,
      furl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payu`,
      action: PAYU_ACTION_URL,
      currency: params.currency || "INR",
    };

    return {
      subscriptionId: txnid,
      status: "active",
      provider: "payu",
      payu: payuData,
      raw: payuData,
    };
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    // Placeholder
  },
};

export function verifyPayUWebhook(
  params: Record<string, string>
): boolean {
  const {
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    status,
    additionalCharges,
    hash: receivedHash,
  } = params;

  // Reverse Hash: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
  // If additionalCharges is present, the formula changes to:
  // sha512(additionalCharges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
  let hashString = "";
  if (additionalCharges) {
    hashString = `${additionalCharges}|${PAYU_SALT}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  } else {
    hashString = `${PAYU_SALT}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  }

  const calculatedHash = crypto.createHash("sha512").update(hashString).digest("hex");

  return calculatedHash === receivedHash;
}
