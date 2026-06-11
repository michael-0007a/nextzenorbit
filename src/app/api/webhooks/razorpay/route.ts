/**
 * Razorpay Webhook Handler
 *
 * Processes subscription and payment events from Razorpay.
 * HMAC SHA256 signature verification.
 * Idempotent — checks webhook_events table before processing.
 *
 * Events handled:
 * - subscription.authenticated → activate subscription (premium access)
 * - subscription.charged → extend billing period
 * - subscription.cancelled → cancel subscription, revert to free
 * - subscription.completed → cancel subscription, revert to free
 * - subscription.halted → mark past_due
 * - payment.captured → activate subscription (one-time order flow)
 * - payment.failed → mark past_due
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbInsert, dbUpdate } from "@/lib/supabase/helpers";
import { verifyRazorpayWebhook } from "@/lib/payments";
import { getPlanNameFromRazorpayId } from "@/lib/payments/razorpay-plans";
import {
  activateSubscription,
  extendBillingPeriod,
  markPastDue,
  cancelSubscription,
} from "@/services/subscription-service";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    console.warn("[webhook/razorpay] Missing x-razorpay-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  // Verify HMAC signature
  if (!verifyRazorpayWebhook(body, signature)) {
    console.warn("[webhook/razorpay] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const eventId = payload.event_id || payload.id || `rz_${Date.now()}`;
  const eventType = payload.event;

  console.log(`[webhook/razorpay] Received event: ${eventType} (${eventId})`);

  const supabase = createAdminClient();

  // Idempotency check
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("provider", "razorpay")
    .eq("event_id", eventId)
    .single();

  if (existing) {
    console.log(`[webhook/razorpay] Event already processed: ${eventId}`);
    return NextResponse.json({ ok: true, message: "Already processed" });
  }

  // Record event
  await dbInsert(supabase, "webhook_events", {
    provider: "razorpay",
    event_id: eventId,
    event_type: eventType,
    payload,
  });

  // Process event
  try {
    switch (eventType) {
      // ── Subscription authenticated ──
      // Fires when customer authorizes the subscription.
      // This is the primary trigger for activating premium access.
      case "subscription.authenticated": {
        const sub = payload.payload?.subscription?.entity;
        if (!sub) break;

        const razorpayPlanId = sub.plan_id;
        const planName = razorpayPlanId
          ? getPlanNameFromRazorpayId(razorpayPlanId)
          : undefined;

        await activateSubscription(supabase, sub.id, {
          planId: planName,
          currentPeriodStart: sub.current_start
            ? new Date(sub.current_start * 1000).toISOString()
            : new Date().toISOString(),
          currentPeriodEnd: sub.current_end
            ? new Date(sub.current_end * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        console.log(
          `[webhook/razorpay] Subscription authenticated: sub=${sub.id} plan=${planName || "unknown"}`
        );
        break;
      }

      // ── Subscription charged (recurring payment success) ──
      case "subscription.charged": {
        const sub = payload.payload?.subscription?.entity;
        if (!sub) break;

        await extendBillingPeriod(supabase, sub.id, {
          currentPeriodStart: sub.current_start
            ? new Date(sub.current_start * 1000).toISOString()
            : new Date().toISOString(),
          currentPeriodEnd: sub.current_end
            ? new Date(sub.current_end * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        console.log(`[webhook/razorpay] Subscription charged: sub=${sub.id}`);
        break;
      }

      // ── Subscription cancelled ──
      case "subscription.cancelled": {
        const sub = payload.payload?.subscription?.entity;
        if (!sub) break;

        await cancelSubscription(supabase, sub.id);
        console.log(`[webhook/razorpay] Subscription cancelled: sub=${sub.id}`);
        break;
      }

      // ── Subscription completed (all billing cycles done) ──
      case "subscription.completed": {
        const sub = payload.payload?.subscription?.entity;
        if (!sub) break;

        await cancelSubscription(supabase, sub.id);
        console.log(`[webhook/razorpay] Subscription completed: sub=${sub.id}`);
        break;
      }

      // ── Subscription halted (multiple payment failures) ──
      case "subscription.halted": {
        const sub = payload.payload?.subscription?.entity;
        if (!sub) break;

        await markPastDue(supabase, sub.id);
        console.log(`[webhook/razorpay] Subscription halted: sub=${sub.id}`);
        break;
      }

      // ── Payment captured (one-time order flow) ──
      case "payment.captured": {
        const payment = payload.payload?.payment?.entity;
        if (!payment) break;

        const notes = payment.notes || {};
        const userId = notes.user_id;
        if (!userId) break;

        await dbUpdate(supabase, "subscriptions", {
          status: "active",
          razorpay_customer_id: payment.customer_id || null,
          amount_paise: payment.amount,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }).eq("user_id", userId);

        console.log(
          `[webhook/razorpay] Payment captured for user=${userId}`
        );
        break;
      }

      // ── Payment failed ──
      case "payment.failed": {
        const payment = payload.payload?.payment?.entity;
        if (!payment) break;

        // Try to find subscription via notes or subscription_id on the payment
        const subscriptionId =
          payment.subscription_id ||
          payload.payload?.subscription?.entity?.id;

        if (subscriptionId) {
          await markPastDue(supabase, subscriptionId);
          console.log(
            `[webhook/razorpay] Payment failed for sub=${subscriptionId}`
          );
        } else {
          // Fallback: try user_id from notes
          const notes = payment.notes || {};
          const userId = notes.user_id;
          if (userId) {
            await dbUpdate(supabase, "subscriptions", {
              status: "past_due",
            }).eq("user_id", userId);
            console.log(
              `[webhook/razorpay] Payment failed for user=${userId}`
            );
          }
        }
        break;
      }

      default:
        console.log(`[webhook/razorpay] Unhandled event: ${eventType}`);
    }
  } catch (error) {
    console.error("[webhook/razorpay] Processing error:", error);
    // Still return 200 to prevent Razorpay retries — event is already recorded
  }

  return NextResponse.json({ ok: true });
}
