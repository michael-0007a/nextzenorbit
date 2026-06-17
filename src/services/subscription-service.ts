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
import { dbInsert, dbUpdate } from "@/lib/supabase/helpers";
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
    .maybeSingle();

  if (error) {
    console.error("[subscription-service] getSubscription error:", error.message);
    return null;
  }

  return data;
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
 * Create or update a subscription row when a new subscription is created.
 * Uses upsert semantics — if the user already has a subscription row, it's updated.
 */
export async function upsertSubscriptionCreated(
  admin: SupabaseClient<Database>,
  userId: string,
  data: {
    subscriptionId: string;
    planId: PlanId;
    provider?: "razorpay" | "payu";
    razorpayPlanId?: string;
  }
): Promise<void> {
  const existing = await getSubscription(admin, userId);
  const provider = data.provider || "razorpay";

  const updateData: any = {
    provider,
    plan_id: data.planId,
    status: "inactive", // Initially inactive until webhook/callback
  };

  if (provider === "razorpay") {
    updateData.razorpay_subscription_id = data.subscriptionId;
    updateData.razorpay_plan_id = data.razorpayPlanId;
  } else {
    updateData.payu_subscription_id = data.subscriptionId;
  }

  if (existing) {
    // Update existing row
    await dbUpdate(admin, "subscriptions", updateData).eq("user_id", userId);
  } else {
    // Insert new row
    await dbInsert(admin, "subscriptions", {
      user_id: userId,
      ...updateData,
    });
  }

  console.log(
    `[subscription-service] Subscription created for user=${userId} plan=${data.planId} sub=${data.subscriptionId} provider=${provider}`
  );
}

/**
 * Activate a subscription when payment is successful.
 * Marks the subscription as active.
 */
export async function activateSubscription(
  admin: SupabaseClient<Database>,
  subscriptionIdOrUserId: string,
  data: {
    planId?: PlanId;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    provider?: "razorpay" | "payu";
    status?: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
    subscriptionId?: string; // Optional if you want to use it instead of subscriptionIdOrUserId
  }
): Promise<void> {
  const updatePayload: Record<string, unknown> = {
    status: data.status || "active",
  };

  if (data.planId) updatePayload.plan_id = data.planId;
  if (data.currentPeriodStart) updatePayload.current_period_start = data.currentPeriodStart;
  if (data.currentPeriodEnd) updatePayload.current_period_end = data.currentPeriodEnd;

  const provider = data.provider || "razorpay";
  let query = dbUpdate(admin, "subscriptions", updatePayload as any);

  if (provider === "razorpay") {
    query = query.eq("razorpay_subscription_id", subscriptionIdOrUserId);
  } else if (provider === "payu") {
    // For PayU, we might activate by user_id if that's what we passed, or by payu_subscription_id
    if (data.subscriptionId) {
        query = query.eq("payu_subscription_id", data.subscriptionId);
    } else {
        query = query.eq("user_id", subscriptionIdOrUserId);
    }
  }

  const { error } = await query;
  if (error) {
    console.error(`[subscription-service] activateSubscription error:`, error);
    throw error;
  }

  console.log(
    `[subscription-service] Subscription activated: id=${subscriptionIdOrUserId} provider=${provider}`
  );
}

/**
 * Extend billing period when `subscription.charged` webhook fires.
 */
export async function extendBillingPeriod(
  admin: SupabaseClient<Database>,
  razorpaySubscriptionId: string,
  data: {
    currentPeriodStart: string;
    currentPeriodEnd: string;
  }
): Promise<void> {
  await dbUpdate(admin, "subscriptions", {
    status: "active",
    current_period_start: data.currentPeriodStart,
    current_period_end: data.currentPeriodEnd,
  }).eq("razorpay_subscription_id", razorpaySubscriptionId);

  console.log(
    `[subscription-service] Billing period extended: sub=${razorpaySubscriptionId}`
  );
}

/**
 * Mark subscription as past_due when `payment.failed` fires.
 */
export async function markPastDue(
  admin: SupabaseClient<Database>,
  razorpaySubscriptionId: string
): Promise<void> {
  await dbUpdate(admin, "subscriptions", {
    status: "past_due",
  }).eq("razorpay_subscription_id", razorpaySubscriptionId);

  console.log(
    `[subscription-service] Subscription marked past_due: sub=${razorpaySubscriptionId}`
  );
}

/**
 * Cancel subscription when `subscription.cancelled` or `subscription.completed` fires.
 * Reverts user to free plan.
 */
export async function cancelSubscription(
  admin: SupabaseClient<Database>,
  razorpaySubscriptionId: string
): Promise<void> {
  await dbUpdate(admin, "subscriptions", {
    status: "cancelled",
    plan_id: "free",
    cancelled_at: new Date().toISOString(),
  }).eq("razorpay_subscription_id", razorpaySubscriptionId);

  console.log(
    `[subscription-service] Subscription cancelled: sub=${razorpaySubscriptionId}`
  );
}
