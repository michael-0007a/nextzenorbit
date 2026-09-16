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
  return <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">{String(application.profile.full_name || application.email)}</h2><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">{application.status}</span></div>
    <p className="text-sm">{application.email} · Phone: +{application.phone}</p>
    <details className="rounded-xl border border-border p-4" open={application.status === "pending"}><summary className="cursor-pointer text-sm font-semibold mb-3">Candidate profile</summary><dl className="grid gap-3 sm:grid-cols-2 text-sm">{Object.entries(application.profile).filter(([key]) => !["consent", "full_name", "phone"].includes(key)).map(([key, value]) => <div key={key}><dt className="text-text-secondary capitalize">{key.replaceAll("_", " ")}</dt><dd>{String(value || "—")}</dd></div>)}</dl></details>
    <p className="text-xs text-text-secondary">Submitted {new Date(application.submitted_at).toLocaleString()} · Consent {application.consent_version}</p>
    <div className="flex flex-wrap gap-3 text-sm font-medium text-primary"><a href={`/api/admin/signup-applications/${application.user_id}/resume`} className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2" target="_blank" rel="noreferrer">Download original resume</a><Link className="rounded-lg border border-border px-4 py-2" href={`/admin/users/${application.user_id}`}>Client details</Link></div>
    {application.status === "pending" ? <>
      <label className="block text-sm space-y-1"><span>Reason (required to reject)</span><textarea value={reason} onChange={e => setReason(e.target.value)} disabled={busy} maxLength={2000} className="w-full p-2 rounded-lg bg-background border border-border" /></label>
      <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => review("approved")}>Approve and unlock payment</Button><Button variant="secondary" disabled={busy || reason.trim().length < 3} onClick={() => review("rejected")}>Reject application</Button></div>
    </> : <p className="text-sm">{application.status === "approved" ? "Approved — payment is required before services unlock" : `Rejected: ${application.rejection_reason}`} · {application.reviewed_at ? new Date(application.reviewed_at).toLocaleString() : ""}</p>}
    {error && <p role="alert" className="text-error text-sm">{error}</p>}
  </section>;
}
