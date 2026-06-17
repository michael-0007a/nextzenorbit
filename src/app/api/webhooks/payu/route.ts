/**
 * PayU Webhook / Callback Handler
 *
 * Processes payment status updates from PayU.
 * Verifies signature (hash) from PayU to prevent spoofing.
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

  if (!hash || !txnid) {
    console.warn("[webhook/payu] Missing hash or txnid");
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify Hash signature
  if (!verifyPayUWebhook(params)) {
    console.warn("[webhook/payu] Invalid signature hash");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  console.log(`[webhook/payu] Received status ${status} for txn ${txnid}`);

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
      // Find the subscription that matched this txn (receipt ID)
      // Usually stored in job_queue or a separate payments table.
      // For this implementation, we try to activate by orderId (which we used as receipt)
      
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("payu_subscription_id", txnid)
        .maybeSingle();

      // If we found a matching subscription record
      if (subData) {
        await activateSubscription(supabase, subData.user_id, {
          provider: "payu",
          subscriptionId: txnid,
          status: "active",
        });
      }
    }

    // PayU expects a redirect or a 200 OK. 
    // Since this is a callback, we can redirect the user back to the dashboard if it was a browser redirect
    const url = new URL(request.url);
    const dashboardUrl = `${url.origin}/dashboard?payment=${status}`;
    
    return NextResponse.redirect(dashboardUrl, { status: 303 });
  } catch (err) {
    console.error(`[webhook/payu] Processing error:`, err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
