"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ProfileRow } from "@/types/database";
import { ResumeFileUpload } from "@/components/forms/resume-file-upload";
import { onboardingProfileSchema } from "@/lib/validations/onboarding";

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground";
export function OnboardingForm({ profile, email }: { profile: ProfileRow | null; email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const fieldError = (name: string) => fieldErrors[name]?.[0] ? <p className="text-xs text-error" role="alert">{fieldErrors[name][0]}</p> : null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const parsed = onboardingProfileSchema.safeParse({ ...Object.fromEntries(fields), preferred_portals: fields.getAll("preferred_portals"), consent: fields.get("consent") === "on" });
    const errors = parsed.success ? {} : parsed.error.flatten().fieldErrors;
    if (!parsed.success || !file) {
      setFieldErrors({ ...errors, ...(!file ? { file: ["Choose your resume to continue."] } : {}) });
      setError("Please check the highlighted fields before submitting.");
      const first = event.currentTarget.elements.namedItem(Object.keys(errors)[0] || "file");
      if (first instanceof HTMLElement) first.focus();
      return;
    }
    const payload = new FormData();
    payload.set("file", file);
    payload.set("profile", JSON.stringify(parsed.data));
    setBusy(true); setError(""); setFieldErrors({});
    try {
      const response = await fetch("/api/onboarding", { method: "POST", body: payload });
      const result = await response.json();
      if (!response.ok) { setFieldErrors(result.error?.fields || {}); throw new Error(result.error?.message || "Unable to submit."); }
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }

  const fields = [
    ["full_name", "Full name", profile?.full_name], ["headline", "Professional headline", profile?.headline],
    ["location", "Current city and country", profile?.location], ["preferred_role", "Preferred job role", profile?.preferred_role],
    ["preferred_location", "Preferred work location", profile?.preferred_location],
  ] as const;

  return <form onSubmit={submit} noValidate className="space-y-6" aria-busy={busy}>
    <p className="text-sm text-text-secondary">Account: {email}</p>
    <fieldset disabled={busy} className="space-y-4">
      <legend className="mb-3 font-semibold">1. Profile and job preferences</legend>
      {fields.map(([name, label, value]) => <label key={name} className="block space-y-1 text-sm"><span>{label} *</span><input name={name} required aria-invalid={Boolean(fieldErrors[name])} minLength={name === "headline" ? 3 : 2} maxLength={name === "headline" ? 200 : name === "preferred_role" ? 150 : 100} defaultValue={value || ""} className={`${inputClass} ${fieldErrors[name] ? "border-error" : ""}`} />{fieldError(name)}</label>)}
      <label className="block space-y-1 text-sm"><span>Years of experience *</span><input name="years_of_experience" type="number" min="0" max="50" required defaultValue={profile?.years_of_experience ?? 0} className={inputClass} /></label>
      {fieldError("years_of_experience")}
      <label className="block space-y-1 text-sm"><span>Work arrangement *</span><select name="preferred_work_type" defaultValue={profile?.preferred_work_type || "any"} className={inputClass}><option value="any">Any</option><option value="remote">Remote</option><option value="onsite">On site</option><option value="hybrid">Hybrid</option></select></label>
      <label className="block space-y-1 text-sm"><span>LinkedIn URL (optional)</span><input name="linkedin_url" type="url" maxLength={250} defaultValue={profile?.linkedin_url || ""} className={inputClass} /></label>
      {fieldError("linkedin_url")}
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm space-y-1"><span>Min salary (₹/month)</span><input name="preferred_salary_min" type="number" min="0" max="100000000" defaultValue={profile?.preferred_salary_min ?? ""} className={inputClass} /></label>
        <label className="block text-sm space-y-1"><span>Max salary (₹/month)</span><input name="preferred_salary_max" type="number" min="0" max="100000000" defaultValue={profile?.preferred_salary_max ?? ""} className={inputClass} /></label>
      </div>
      {fieldError("preferred_salary_min")}{fieldError("preferred_salary_max")}
      <fieldset><legend className="text-sm mb-2">Preferred job portals (optional)</legend><div className="flex flex-wrap gap-3">{["indeed", "linkedin", "naukri", "internshala", "glassdoor"].map(portal => <label key={portal} className="text-sm capitalize flex gap-1"><input name="preferred_portals" type="checkbox" value={portal} defaultChecked={profile?.preferred_portals?.includes(portal)} />{portal}</label>)}</div></fieldset>
    </fieldset>
    <fieldset disabled={busy} className="space-y-3">
      <legend className="mb-3 font-semibold">2. Contact details</legend>
      <label className="block space-y-1 text-sm"><span>Phone with country code *</span><input name="phone" type="tel" autoComplete="tel" required maxLength={20} defaultValue={profile?.phone || ""} placeholder="+919876543210" className={inputClass} /></label>
      <p className="text-xs text-text-secondary">Include + and your country code, for example +91 for India.</p>{fieldError("phone")}
    </fieldset>
    <fieldset disabled={busy} className="space-y-3">
      <legend className="mb-3 font-semibold">3. Resume and consent</legend>
      <ResumeFileUpload file={file} onChange={selected => { setFile(selected); setFieldErrors(previous => ({ ...previous, file: [] })); }} disabled={busy} error={fieldErrors.file?.[0]} />
      <label className="flex gap-2 text-sm"><input type="checkbox" name="consent" required className="mt-1" /><span>I agree to the <a href="/terms" target="_blank" rel="noreferrer" className="text-primary underline">Terms of Service</a>, acknowledge the <a href="/privacy" target="_blank" rel="noreferrer" className="text-primary underline">Privacy Policy</a>, and consent to my profile and resume being processed for application review.</span></label>
      {fieldError("consent")}
    </fieldset>
    {error && <p role="alert" className="text-sm text-error">{error}</p>}
    <Button type="submit" disabled={busy} isLoading={busy} className="w-full">{busy ? "Uploading and submitting…" : "Submit for review"}</Button>
    {busy && <p role="status" className="text-center text-xs text-text-secondary">Keep this page open while we save your profile and resume.</p>}
  </form>;
}
