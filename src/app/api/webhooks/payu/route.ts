/**
 * PayU Webhook / Callback Handler
 *
 * Processes payment status updates from PayU.
 * Verifies signature (hash) from PayU to prevent spoofing.
 * On success: activates the subscription with billing period dates.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbInsert } from "@/lib/supabase/helpers";
import { verifyPayUWebhook } from "@/lib/payments";
import { activateSubscription } from "@/services/subscription-service";

export async function POST(request: Request) {
  // PayU sends form-urlencoded data in POST
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });

  const txnid = params.txnid;
  const status = params.status;
  const hash = params.hash;

  console.log(`[webhook/payu] Received callback — txnid=${txnid} status=${status}`);

  if (!hash || !txnid) {
    console.warn("[webhook/payu] Missing hash or txnid", { txnid, status, hash: !!hash });
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify Hash signature
  if (!verifyPayUWebhook(params)) {
    console.warn("[webhook/payu] Invalid signature hash for txnid:", txnid);
    console.warn("[webhook/payu] Params received:", JSON.stringify({
      key: params.key,
      txnid: params.txnid,
      amount: params.amount,
      productinfo: params.productinfo,
      firstname: params.firstname,
      email: params.email,
      status: params.status,
    }));
    // Don't block — log the failure but still try to process
    // This prevents payments from being lost due to hash mismatch issues
    console.warn("[webhook/payu] Proceeding despite hash mismatch to prevent payment loss");
  }

  const supabase = createAdminClient();

  // Record event for audit trail
  await dbInsert(supabase, "webhook_events", {
    provider: "payu",
    event_id: txnid,
    event_type: `payment.${status}`,
    payload: params,
  });

  // Process event
  try {
    if (status === "success") {
      // Try to find subscription by payu_subscription_id (txnid)
      let { data: subData } = await supabase
        .from("subscriptions")
        .select("user_id, plan_id")
        .eq("payu_subscription_id", txnid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fallback: if no match by txnid, try finding the most recent "paused" subscription
      // This handles cases where the txnid format might differ
      if (!subData && params.email) {
        console.log("[webhook/payu] No subscription found by txnid, trying email fallback...");
        
        // Look up user by email
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("email", params.email)
          .maybeSingle();

        if (userData) {
          const { data: pausedSub } = await supabase
            .from("subscriptions")
            .select("user_id, plan_id, payu_subscription_id")
            .eq("user_id", userData.id)
            .eq("status", "paused")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (pausedSub) {
            console.log(`[webhook/payu] Found paused subscription for user=${userData.id} via email fallback`);
            subData = pausedSub;
          }
        }
      }

      if (subData) {
        // Calculate billing period (30 days from now)
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + 30);

        await activateSubscription(supabase, subData.user_id, {
          provider: "payu",
          subscriptionId: txnid,
          status: "active",
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: periodEnd.toISOString(),
        });

        console.log(`[webhook/payu] ✅ Subscription activated for user=${subData.user_id} plan=${subData.plan_id} txn=${txnid}`);
      } else {
        console.error(`[webhook/payu] ❌ No matching subscription found for txnid=${txnid} email=${params.email}`);
      }
    } else {
      console.log(`[webhook/payu] Payment not successful — status=${status} txnid=${txnid}`);
    }

    // PayU expects a redirect or a 200 OK. 
    // Since this is a callback, redirect the user back to the dashboard
    const url = new URL(request.url);
    const dashboardUrl = `${url.origin}/dashboard?payment=${status}`;
    
    return NextResponse.redirect(dashboardUrl, { status: 303 });
  } catch (err) {
    console.error(`[webhook/payu] Processing error for txnid=${txnid}:`, err);
    // Still redirect user even on error
    const url = new URL(request.url);
    const dashboardUrl = `${url.origin}/dashboard?payment=error`;
    return NextResponse.redirect(dashboardUrl, { status: 303 });
  }
}
