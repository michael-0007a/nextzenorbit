/**
 * Razorpay Webhook Handler
 *
 * Processes payment events from Razorpay.
 * HMAC SHA256 signature verification.
 * Idempotent — checks webhook_events table before processing.
 *
 * Events handled:
 * - payment.captured → activate subscription
 * - subscription.charged → extend billing period
 * - subscription.cancelled → cancel subscription
 * - subscription.halted → mark past_due
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbInsert, dbUpdate } from "@/lib/supabase/helpers";
import { verifyRazorpayWebhook } from "@/lib/payments";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  // Verify HMAC signature
  if (!verifyRazorpayWebhook(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Return 200 immediately (process async below)
  const payload = JSON.parse(body);
  const eventId = payload.event_id || payload.id || `rz_${Date.now()}`;
  const eventType = payload.event;

  const supabase = createAdminClient();

  // Idempotency check
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("provider", "razorpay")
    .eq("event_id", eventId)
    .single();

  if (existing) {
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
        break;
      }

      case "subscription.charged": {
        const sub = payload.payload?.subscription?.entity;
        if (!sub) break;

        await dbUpdate(supabase, "subscriptions", {
          status: "active",
          current_period_start: sub.current_start
            ? new Date(sub.current_start * 1000).toISOString()
            : new Date().toISOString(),
          current_period_end: sub.current_end
            ? new Date(sub.current_end * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq("razorpay_subscription_id", sub.id);
        break;
      }

      case "subscription.cancelled": {
        const sub = payload.payload?.subscription?.entity;
        if (!sub) break;

        await dbUpdate(supabase, "subscriptions", {
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        }).eq("razorpay_subscription_id", sub.id);
        break;
      }

      case "subscription.halted": {
        const sub = payload.payload?.subscription?.entity;
        if (!sub) break;

        await dbUpdate(supabase, "subscriptions", {
          status: "past_due",
        }).eq("razorpay_subscription_id", sub.id);
        break;
      }

      default:
        // Unhandled event type — log and ignore
        console.log(`Unhandled Razorpay event: ${eventType}`);
    }
  } catch (error) {
    console.error("Razorpay webhook processing error:", error);
    // Still return 200 to prevent retries — we logged the event
  }

  return NextResponse.json({ ok: true });
}
