/**
 * Subscription Service
 *
 * Server-side operations for managing user subscriptions.
 * Used by API routes and webhook handlers.
 *
 * All DB writes use the admin client (service role) to bypass RLS.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SubscriptionRow, PlanId } from "@/types/database";
import { dbUpdate } from "@/lib/supabase/helpers";
import { isSubscriptionActive } from "@/lib/subscription";

// ── Query helpers ──

/**
 * Fetch a user's subscription row.
 * Returns null if no subscription exists.
 */
export async function getSubscription(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<SubscriptionRow | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("[subscription-service] getSubscription error:", error.message);
    return null;
  }

  return data && data.length > 0 ? (data[0] as SubscriptionRow) : null;
}

/**
 * Check if a user has an active subscription.
 *
 * Returns true ONLY when subscription_status = 'active'
 * (or 'trialing' with a valid trial_ends_at).
 */
export async function hasActiveSubscription(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const sub = await getSubscription(supabase, userId);
  return isSubscriptionActive(sub);
}

// ── Mutation helpers (use admin/service-role client) ──

/**
 * Persist a separate checkout transaction before redirecting to PayU.
 * Existing subscriptions are unchanged until payment is verified.
 */
export async function createPaymentOrder(
  admin: SupabaseClient<Database>,
  userId: string,
  data: {
    subscriptionId: string;
    planId: PlanId;
    provider?: "payu";
    currency?: string;
    amountPaise?: number;
  }
): Promise<void> {
  const { error } = await admin.from("payment_orders").insert({
    txnid: data.subscriptionId, user_id: userId, plan_id: data.planId,
    currency: data.currency || "INR", amount_paise: data.amountPaise!,
  });
  if (error) throw error;
}

/**
 * Extend billing period when subscription renewal webhook fires.
 */
export async function extendBillingPeriod(
  admin: SupabaseClient<Database>,
  payuSubscriptionId: string,
  data: {
    currentPeriodStart: string;
    currentPeriodEnd: string;
  }
): Promise<void> {
  await dbUpdate(admin, "subscriptions", {
    status: "active",
    current_period_start: data.currentPeriodStart,
    current_period_end: data.currentPeriodEnd,
  }).eq("payu_subscription_id", payuSubscriptionId);

  console.log(
    `[subscription-service] Billing period extended: sub=${payuSubscriptionId}`
  );
}

/**
 * Mark subscription as past_due when payment fails.
 */
export async function markPastDue(
  admin: SupabaseClient<Database>,
  payuSubscriptionId: string
): Promise<void> {
  await dbUpdate(admin, "subscriptions", {
    status: "past_due",
  }).eq("payu_subscription_id", payuSubscriptionId);

  console.log(
    `[subscription-service] Subscription marked past_due: sub=${payuSubscriptionId}`
  );
}

/**
 * Cancel subscription.
 * Reverts user to free plan.
 */
export async function cancelSubscription(
  admin: SupabaseClient<Database>,
  payuSubscriptionId: string
): Promise<void> {
  await dbUpdate(admin, "subscriptions", {
    status: "cancelled",
    plan_id: "free",
    cancelled_at: new Date().toISOString(),
  }).eq("payu_subscription_id", payuSubscriptionId);

  console.log(
    `[subscription-service] Subscription cancelled: sub=${payuSubscriptionId}`
  );
}
