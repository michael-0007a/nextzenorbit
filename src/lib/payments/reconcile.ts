import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayUTransaction } from "@/lib/payments/payu";

export async function reconcileUserPayments(userId: string, txnid?: string): Promise<number> {
  const admin = createAdminClient();
  let query = admin.from("payment_orders").select("txnid, amount_paise").eq("user_id", userId);
  query = txnid ? query.eq("txnid", txnid) : query.eq("status", "pending");
  const { data: orders, error } = await query.order("created_at", { ascending: false }).limit(5);
  if (error) throw error;
  let confirmed = 0;
  for (const order of orders || []) {
    const payment = await verifyPayUTransaction(order.txnid);
    if (payment?.status !== "success" || payment.unmappedstatus !== "captured") continue;
    if (!payment.amt || !payment.mihpayid || Math.round(Number(payment.amt) * 100) !== order.amount_paise) throw new Error("Payment amount mismatch.");
    const { error: activationError } = await admin.rpc("complete_payu_payment", {
      p_txnid: order.txnid, p_amount_paise: order.amount_paise, p_payment_id: String(payment.mihpayid),
    });
    if (activationError) throw activationError;
    confirmed++;
  }
  return confirmed;
}
