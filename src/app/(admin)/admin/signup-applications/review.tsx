"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SignupApplicationRow } from "@/types/database";

export function ApplicationReview({ application }: { application: SignupApplicationRow }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function review(decision: "approved" | "rejected") {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/signup-applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: application.user_id, decision, reason }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Review failed.");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Review failed."); }
    finally { setBusy(false); }
  }
  return <section className="glass-card rounded-xl p-5 space-y-4">
    <h2 className="text-lg font-semibold">{String(application.profile.full_name || application.email)}</h2>
    <p className="text-sm">{application.email} · Phone: +{application.phone}</p>
    <dl className="grid gap-3 sm:grid-cols-2 text-sm">{Object.entries(application.profile).filter(([key]) => !["consent", "full_name", "phone"].includes(key)).map(([key, value]) => <div key={key}><dt className="text-text-secondary capitalize">{key.replaceAll("_", " ")}</dt><dd>{String(value || "—")}</dd></div>)}</dl>
    <p className="text-xs text-text-secondary">Submitted {new Date(application.submitted_at).toLocaleString()} · Consent {application.consent_version}</p>
    <div className="flex flex-wrap gap-4 text-sm text-primary"><a href={`/api/admin/signup-applications/${application.user_id}/resume`} target="_blank" rel="noreferrer">Open uploaded resume</a><Link href={`/admin/users/${application.user_id}`}>Client details</Link></div>
    {application.status === "pending" ? <>
      <label className="block text-sm space-y-1"><span>Reason (required to reject)</span><textarea value={reason} onChange={e => setReason(e.target.value)} disabled={busy} maxLength={2000} className="w-full p-2 rounded-lg bg-background border border-border" /></label>
      <div className="flex gap-3"><Button disabled={busy} onClick={() => review("approved")}>Approve and unlock payment</Button><Button variant="secondary" disabled={busy || reason.trim().length < 3} onClick={() => review("rejected")}>Reject application</Button></div>
    </> : <p className="text-sm">{application.status === "approved" ? "Approved" : `Rejected: ${application.rejection_reason}`} · {application.reviewed_at ? new Date(application.reviewed_at).toLocaleString() : ""}</p>}
    {error && <p role="alert" className="text-error text-sm">{error}</p>}
  </section>;
}
