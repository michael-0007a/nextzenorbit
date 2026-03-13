/**
 * Cashfree Webhook Handler
 *
 * Processes payment events from Cashfree.
 * HMAC SHA256 + base64 signature verification.
 * Idempotent — checks webhook_events table before processing.
 *
 * Events handled:
 * - PAYMENT_SUCCESS → activate subscription
 * - PAYMENT_FAILED → mark past_due
 * - SUBSCRIPTION_STATUS_CHANGED → update subscription status
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbInsert, dbUpdate } from "@/lib/supabase/helpers";
import type { SubscriptionStatus } from "@/types/database";
import { verifyCashfreeWebhook } from "@/lib/payments";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-cashfree-signature");
  const timestamp = request.headers.get("x-cashfree-timestamp");

  if (!signature || !timestamp) {
    return NextResponse.json({ error: "Missing signature/timestamp" }, { status: 401 });
  }

  if (!verifyCashfreeWebhook(body, signature, timestamp)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const eventId = payload.data?.order?.order_id || `cf_${Date.now()}`;
  const eventType = payload.type || payload.event;

  const supabase = createAdminClient();

  // Idempotency check
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("provider", "cashfree")
    .eq("event_id", eventId)
    .single();

  if (existing) {
    return NextResponse.json({ ok: true, message: "Already processed" });
  }

  // Record event
  await dbInsert(supabase, "webhook_events", {
    provider: "cashfree",
    event_id: eventId,
    event_type: eventType,
    payload,
  });

  try {
    switch (eventType) {
      case "PAYMENT_SUCCESS": {
        const order = payload.data?.order;
        const userId = order?.order_tags?.user_id;
        if (!userId) break;

        await dbUpdate(supabase, "subscriptions", {
          status: "active",
          amount_paise: Math.round((order.order_amount || 0) * 100),
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }).eq("user_id", userId);
        break;
      }

      case "PAYMENT_FAILED": {
        const order = payload.data?.order;
        const userId = order?.order_tags?.user_id;
        if (!userId) break;

        await dbUpdate(supabase, "subscriptions", {
          status: "past_due",
        }).eq("user_id", userId);
        break;
      }

      case "SUBSCRIPTION_STATUS_CHANGED": {
        const sub = payload.data?.subscription;
        if (!sub) break;

        const statusMap: Record<string, SubscriptionStatus> = {
          ACTIVE: "active",
          CANCELLED: "cancelled",
          HALTED: "past_due",
          COMPLETED: "cancelled",
        };

        const newStatus: SubscriptionStatus = statusMap[sub.subscription_status] || "active";

        await dbUpdate(supabase, "subscriptions", {
          status: newStatus,
          ...(newStatus === "cancelled"
            ? { cancelled_at: new Date().toISOString() }
            : {}),
        }).eq("cashfree_subscription_id", sub.subscription_id);
        break;
      }

      default:
        console.log(`Unhandled Cashfree event: ${eventType}`);
    }
  } catch (error) {
    console.error("Cashfree webhook processing error:", error);
  }

  return NextResponse.json({ ok: true });
}

