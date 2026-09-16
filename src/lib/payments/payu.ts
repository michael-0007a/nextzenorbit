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
  : "https://test.payu.in")).replace(/\/+$/, "").replace(/\/_payment$/, "") + "/_payment";

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
    
    return { verified: false, paymentId: params.paymentId };
  },

  async createSubscription(params: SubscriptionParams): Promise<SubscriptionResult> {
    if (!PAYU_KEY || !PAYU_SALT || !process.env.NEXT_PUBLIC_APP_URL) throw new Error("PayU is not configured.");
    const txnid = `txn_${crypto.randomBytes(12).toString("hex")}`;
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
      status: "pending",
      provider: "payu",
      payu: payuData,
      raw: payuData,
    };
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    // Placeholder
  },
};

export function verifyPayUWebhook(params: Record<string, string>): boolean {
  if (!PAYU_KEY || !PAYU_SALT || params.key !== PAYU_KEY || !/^[a-f0-9]{128}$/i.test(params.hash || "") || params.splitInfo) return false;
  const fields = [PAYU_SALT, params.status, "", "", "", "", "", params.udf5 || "", params.udf4 || "", params.udf3 || "", params.udf2 || "", params.udf1 || "", params.email, params.firstname, params.productinfo, params.amount, params.txnid, params.key];
  const charges = params.additionalCharges || params.additional_charges;
  if (charges) fields.unshift(charges);
  const expected = crypto.createHash("sha512").update(fields.join("|")).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(params.hash, "hex"));
}

export async function verifyPayUTransaction(txnid: string) {
  if (!PAYU_KEY || !PAYU_SALT) throw new Error("PayU is not configured.");
  const command = "verify_payment";
  const hash = crypto.createHash("sha512").update(`${PAYU_KEY}|${command}|${txnid}|${PAYU_SALT}`).digest("hex");
  const test = PAYU_ACTION_URL.includes("test.payu.in");
  const response = await fetch(test ? "https://test.payu.in/merchant/postservice?form=2" : "https://info.payu.in/merchant/postservice.php?form=2", {
    method: "POST", body: new URLSearchParams({ key: PAYU_KEY, command, var1: txnid, hash }), signal: AbortSignal.timeout(10000), cache: "no-store",
  });
  if (!response.ok) throw new Error("Payment verification unavailable.");
  const result = await response.json();
  return result.transaction_details?.[txnid] as { status?: string; unmappedstatus?: string; amt?: string; mihpayid?: string } | undefined;
}
