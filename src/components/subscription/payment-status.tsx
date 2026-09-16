"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
export function PaymentStatus() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function check() {
    setBusy(true);
    try {
      const response = await fetch("/api/payments/reconcile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ txnid: reference.trim() || undefined }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Could not confirm payment.");
      setMessage(result.active ? "Payment confirmed. Your services are unlocked." : "No completed payment confirmed yet. If you were charged, check again shortly before paying again.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not confirm payment."); }
    finally { setBusy(false); }
  }
  return <section className="rounded-xl border border-border p-5 space-y-3"><h2 className="font-semibold">Already paid?</h2><p className="text-sm text-text-secondary">If checkout closed or your plan has not updated, check your payment here before trying another payment.</p><label className="block text-sm">Transaction reference (optional)<input className="mt-2 block w-full rounded-lg border border-border bg-background p-2" value={reference} onChange={event => setReference(event.target.value)} placeholder="Enter a reference to check an older payment" maxLength={100} disabled={busy} /></label><Button variant="secondary" disabled={busy} onClick={check}>{busy ? "Checking payment…" : "Check payment status"}</Button><p role="status" className="text-sm">{message}</p></section>;
}
