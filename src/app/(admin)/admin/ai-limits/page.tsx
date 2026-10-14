"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { SkeletonList } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type QuotaRequest = {
  id: string; user_id: string; bucket: "rewrite" | "cover_letter" | "light"; day: string; reason: string;
  status: "pending" | "approved" | "denied"; extra: number; created_at: string;
  requester: { email: string; profile: { full_name: string | null } | { full_name: string | null }[] | null } | null;
};
const BUCKETS = { rewrite: "Resume generations", cover_letter: "Cover letters", light: "Uploads / other AI" };
const nameOf = (r: QuotaRequest) => {
  const profile = Array.isArray(r.requester?.profile) ? r.requester?.profile[0] : r.requester?.profile;
  return profile?.full_name || r.requester?.email || "Admin";
};

/** Supervisors approve or deny admins' requests for more of today's AI allowance. */
export default function AiLimitsPage() {
  const [requests, setRequests] = useState<QuotaRequest[] | null>(null);
  const [error, setError] = useState("");
  const [extra, setExtra] = useState<Record<string, number>>({});
  const [deciding, setDeciding] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/ai-quota/requests", { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error?.message || "Unable to load requests.");
        setRequests(result.data); setError("");
      })
      .catch((err: Error) => setError(err.message));
  }, []);
  useEffect(load, [load]);

  async function decide(id: string, decision: "approved" | "denied") {
    setDeciding(id);
    try {
      const response = await fetch(`/api/admin/ai-quota/requests/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, extra: extra[id] ?? 25 }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error?.message || "Decision could not be saved.");
      toast.success(decision === "approved" ? `Approved +${extra[id] ?? 25} for today.` : "Request denied.");
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Decision could not be saved."); }
    finally { setDeciding(null); }
  }

  const pending = requests?.filter(r => r.status === "pending") ?? [];
  const decided = requests?.filter(r => r.status !== "pending") ?? [];
  return <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">AI Limits</h1>
      <p className="text-sm text-text-secondary">Daily AI allowances reset at 00:00 GMT. Admins get 50 resume generations, 100 cover letters and 100 uploads a day; approve extra here when they need more today.</p>
    </div>
    {error && <p role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">{error}</p>}
    {!requests && !error && <SkeletonList />}
    {requests && <section className="space-y-3">
      <h2 className="font-semibold">Waiting for a decision ({pending.length})</h2>
      {pending.length === 0 && <p className="text-sm text-text-secondary">No pending requests.</p>}
      {pending.map(r => <div key={r.id} className="glass-card space-y-3 rounded-2xl p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-medium">{nameOf(r)} · {BUCKETS[r.bucket]}</p>
          <p className="text-xs text-text-secondary">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
        </div>
        <p className="text-sm text-text-secondary">&ldquo;{r.reason}&rdquo;</p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm">Extra for today
            <input type="number" min={1} max={200} value={extra[r.id] ?? 25} onChange={e => setExtra(prev => ({ ...prev, [r.id]: Math.max(1, Math.min(200, Number(e.target.value) || 1)) }))}
              className="ml-2 w-20 rounded-lg border border-border bg-background px-2 py-1" />
          </label>
          <Button size="sm" disabled={deciding !== null} onClick={() => decide(r.id, "approved")}>Approve</Button>
          <Button size="sm" variant="secondary" disabled={deciding !== null} onClick={() => decide(r.id, "denied")}>Deny</Button>
        </div>
      </div>)}
    </section>}
    {decided.length > 0 && <section className="space-y-2">
      <h2 className="font-semibold">Decided today</h2>
      {decided.map(r => <p key={r.id} className="text-sm text-text-secondary">{nameOf(r)} · {BUCKETS[r.bucket]} · {r.status === "approved" ? `approved +${r.extra}` : "denied"}</p>)}
    </section>}
  </div>;
}
