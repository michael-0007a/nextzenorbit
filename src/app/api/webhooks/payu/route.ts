import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayUWebhook } from "@/lib/payments/payu";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const params: Record<string, string> = {};
    form.forEach((value, key) => { params[key] = String(value); });
    if (!params.txnid || !verifyPayUWebhook(params)) return Response.json({ error: "Invalid payment signature." }, { status: 400 });
    if (params.status === "success") {
      if (!/^\d+(\.\d{1,2})?$/.test(params.amount || "") || !params.mihpayid) return Response.json({ error: "Invalid payment details." }, { status: 400 });
      const { error } = await createAdminClient().rpc("complete_payu_payment", {
        p_txnid: params.txnid, p_amount_paise: Math.round(Number(params.amount) * 100), p_payment_id: params.mihpayid,
      });
      if (error) throw error;
    }
    return NextResponse.redirect(new URL(`/subscription?payment=${params.status === "success" ? "confirmed" : "incomplete"}`, request.url), 303);
  } catch (error) {
    console.error("PayU callback could not be committed:", error);
    return Response.json({ error: "Unable to confirm payment. Return to your plan page and check payment status. Do not pay again." }, { status: 503 });
  }
}
