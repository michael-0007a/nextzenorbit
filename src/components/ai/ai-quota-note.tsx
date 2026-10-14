"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AiAllowance, AiBucket } from "@/lib/ai/quota";

/**
 * "7 of 10 resume generations left today" under an AI button. Refetches when `refresh` changes
 * (pass the busy flag so the count updates after each run). Admins at zero can ask a supervisor for more.
 */
export function AiQuotaNote({ bucket, refresh, className = "" }: { bucket: AiBucket; refresh?: unknown; className?: string }) {
  const [allowance, setAllowance] = useState<AiAllowance | null>(null);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai-quota", { cache: "no-store" }).then(r => r.ok ? r.json() : null)
      .then(body => { if (!cancelled) setAllowance(body?.data?.[bucket] ?? null); }).catch(() => {});
    return () => { cancelled = true; };
  }, [bucket, refresh]);
  if (!allowance) return null;
  const labels: Record<AiBucket, string> = { rewrite: "resume generations", cover_letter: "cover letters", light: "AI actions" };

  async function requestMore() {
    setSending(true);
    try {
      const response = await fetch("/api/admin/ai-quota/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bucket, reason }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || "Request could not be sent.");
      toast.success("Request sent. A supervisor will review it.");
      setAsking(false); setReason("");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Request could not be sent."); }
    finally { setSending(false); }
  }

  return <div className={`text-xs text-text-secondary ${className}`} aria-live="polite">
    <p className={allowance.remaining === 0 ? "font-medium text-error" : undefined}>
      {allowance.remaining} of {allowance.limit} {labels[bucket]} left today · resets 00:00 GMT
    </p>
    {allowance.remaining === 0 && allowance.canRequestMore && (asking
      ? <div className="mt-2 space-y-2">
          <textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={500} rows={2} placeholder="Why do you need more today?"
            className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground" />
          <div className="flex gap-2">
            <button type="button" disabled={sending || reason.trim().length < 3} onClick={requestMore} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">{sending ? "Sending…" : "Send to supervisor"}</button>
            <button type="button" onClick={() => setAsking(false)} className="rounded-lg px-3 py-1.5 text-xs">Cancel</button>
          </div>
        </div>
      : <button type="button" onClick={() => setAsking(true)} className="mt-1 text-xs font-medium text-primary underline">Request more from a supervisor</button>)}
  </div>;
}
