"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ProfileRow } from "@/types/database";
import { ResumeFileUpload } from "@/components/forms/resume-file-upload";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES, EXPERIENCE_RANGES, VISA_STATUSES, GENDERS, ETHNICITIES, REFERRAL_SOURCES, onboardingBasicSchema, onboardingProfileSchema, immigrationSchema, workAuthorizationSchema } from "@/lib/validations/onboarding";

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground";
export function OnboardingForm({ profile, email }: { profile: ProfileRow | null; email: string }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string,string>>({ full_name: profile?.full_name || "", email, phone: profile?.phone || "", location: profile?.location || "", preferred_role: profile?.preferred_role || "", preferred_location: profile?.preferred_location || "", preferred_work_type: profile?.preferred_work_type || "any", linkedin_url: profile?.linkedin_url || "", target_country: "" });
  const [ethnicity, setEthnicity] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const country = values.target_country;
  const isUS = country === "us";
  const steps = country === "in" ? ["Basic & professional information", "Voluntary self-identification"] : ["Basic & professional information", isUS ? "US immigration & work authorization" : "Work authorization", "Voluntary self-identification"];
  const last = step === steps.length - 1;
  const put = (name: string, value: string) => setValues(prev => ({ ...prev, [name]: value }));
  const fieldError = (name: string) => errors[name] && <p role="alert" className="text-xs text-error">{errors[name]}</p>;
  function input(name: string, label: string, type = "text", required = false) { return <label className="block space-y-1 text-sm" key={name}><span>{label}{required ? " *" : " (optional)"}</span><input name={name} type={type} value={values[name] || ""} onChange={e => put(name,e.target.value)} readOnly={name === "email"} required={required} aria-invalid={!!errors[name]} className={inputClass} min={type === "number" ? 0 : undefined} />{fieldError(name)}</label>; }
  function select(name: string, label: string, options: readonly string[], required = false) { return <label className="block space-y-1 text-sm" key={name}><span>{label}{required ? " *" : " (optional)"}</span><select name={name} value={values[name] || ""} onChange={e => put(name,e.target.value)} required={required} aria-invalid={!!errors[name]} className={inputClass}><option value="">Choose an answer</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select>{fieldError(name)}</label>; }
  const yesNo = (name: string,label: string) => select(name,label,["yes","no"],true);
  const check = (name: string,label: string) => <label className="flex gap-2 text-sm"><input type="checkbox" name={name} checked={values[name] === "yes"} onChange={e => put(name,e.target.checked ? "yes" : "")} /><span>{label} *{fieldError(name)}</span></label>;
  function data() {
    const immigration = { authorized: values.authorized, sponsorship: values.sponsorship, status: values.visa_status, other_status: values.other_status || "", cpt_required: values.cpt_required || undefined, stem_degree: values.stem_degree || undefined, ead_expiration: values.ead_expiration || "", held_h1b: values.held_h1b, held_j1: values.held_j1, j1_residency_requirement: values.j1_residency_requirement || undefined, i140_filed: values.i140_filed, future_sponsorship: values.future_sponsorship, certified: values.certified === "yes" };
    return { ...values, immigration, work_authorization: { authorized: values.authorized, sponsorship: values.sponsorship, restrictions: values.restrictions || "", permit_expiration: values.permit_expiration || "", certified: values.certified === "yes" }, eeo: { gender: values.gender || "", gender_description: values.gender_description || "", ethnicity, disability: values.disability || "", veteran: values.veteran || "", acknowledged: values.acknowledged === "yes" }, consent: values.consent === "yes" };
  }
  function showIssues(issues: { path: PropertyKey[]; message: string }[]) {
    const next: Record<string,string> = {};
    for (const issue of issues) { const key = String(issue.path.at(-1)); next[key === "status" ? "visa_status" : key] = issue.message; }
    setErrors(next); setError("Please check the highlighted answers.");
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    const payload = data();
    const result = last ? onboardingProfileSchema.safeParse(payload) : step === 0 ? onboardingBasicSchema.safeParse(payload) : isUS ? immigrationSchema.safeParse(payload.immigration) : workAuthorizationSchema.safeParse(payload.work_authorization);
    if (!result.success) { showIssues(result.error.issues); return; }
    if (!file) { setErrors({file:"Choose your resume to continue."});setError("A resume is required.");setStep(0);return; }
    setErrors({});setError("");
    if (!last) { setStep(value=>value+1);return; }
    const parsed = onboardingProfileSchema.parse(payload);
    setBusy(true);
    try {
      const ticketResponse = await fetch("/api/onboarding/upload", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name:file.name,size:file.size}) });
      const ticket = await ticketResponse.json();
      if (!ticketResponse.ok) throw new Error(ticket.error?.message || "Unable to prepare upload.");
      const extension = file.name.split(".").pop()?.toLowerCase();
      const contentType = extension === "pdf" ? "application/pdf" : extension === "doc" ? "application/msword" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const upload = await createClient().storage.from("signup-resumes").uploadToSignedUrl(ticket.path,ticket.token,file,{contentType});
      if (upload.error) throw new Error("Upload failed. Your answers are preserved; please retry.");
      const response = await fetch("/api/onboarding",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({profile:parsed,path:ticket.path,name:file.name})});
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error?.message || "Unable to submit. Please retry.");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to submit."); }
    finally {setBusy(false);}
  }
  return <form onSubmit={submit} noValidate className="space-y-6" aria-busy={busy}>
    <p className="text-sm text-text-secondary">Step {step+1} of {steps.length} · {steps[step]}</p>
    <fieldset disabled={busy} className="space-y-4">
      {step === 0 && <>
        <label className="block space-y-1 text-sm">Country where you want to work *<select name="target_country" value={country} onChange={e=>setValues(prev=>({...prev,target_country:e.target.value,authorized:"",sponsorship:"",certified:"",expected_annual_salary:""}))} className={inputClass}><option value="">Choose a country</option>{Object.entries(COUNTRIES).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>{fieldError("target_country")}</label>
        {country === "other" && input("other_country","Target country","text",true)}
        <h2 className="font-semibold">Personal information</h2>
        {input("full_name","Full name","text",true)}{input("email","Email address","email",true)}{input("phone","Phone with country code","tel",true)}{input("location","Current location — city, state/country")}
        <h2 className="font-semibold">Professional experience & preferences</h2>
        {input("current_company","Current company")}{input("current_job_title","Current job title")}
        {select("experience_range","Years of experience",EXPERIENCE_RANGES,true)}
        {input("preferred_role","Target job role","text",true)}{input("preferred_location","Preferred work location")}
        {select("preferred_work_type","Work arrangement",["any","remote","hybrid","onsite"])}
        {select("notice_period","Notice period",["Immediately available","1 week","2 weeks","1 month","2 months","3 months"])}
        {input("expected_annual_salary",`Expected annual salary (${({us:"USD",in:"INR",gb:"GBP",ca:"CAD",au:"AUD",nz:"NZD",sg:"SGD",za:"ZAR"} as Record<string,string>)[country] || "target country's currency"})`,"number")}
        {country === "other" && input("other_currency","Salary currency code (for example EUR)","text",!!values.expected_annual_salary)}
        {values.expected_annual_salary && country !== "other" && <p className="text-xs text-text-secondary">{new Intl.NumberFormat("en",{style:"currency",currency:({us:"USD",in:"INR",gb:"GBP",ca:"CAD",au:"AUD",nz:"NZD",sg:"SGD",za:"ZAR"} as Record<string,string>)[country] || "USD",maximumFractionDigits:0}).format(Number(values.expected_annual_salary))} per year</p>}
        {input("preferred_start_date","Preferred start date","date")}
        <h2 className="font-semibold">Online presence</h2>
        {input("linkedin_url","LinkedIn profile URL","url")}{input("github_url","GitHub profile URL","url")}{input("portfolio_url","Portfolio / website URL","url")}
        <h2 className="font-semibold">Resume & documents</h2>
        <ResumeFileUpload file={file} onChange={setFile} disabled={busy} maxMB={10} allowDoc error={errors.file}/>
        <label className="block text-sm space-y-1">Cover letter (optional)<textarea value={values.cover_letter || ""} onChange={e=>put("cover_letter",e.target.value)} maxLength={10000} rows={5} className={inputClass}/></label>
        {select("referral_source","How did you hear about us?",REFERRAL_SOURCES)}
      </>}
      {step === 1 && !last && <>
        <p className="text-sm text-text-secondary">Answer for jobs in {country === "other" ? values.other_country : COUNTRIES[country as keyof typeof COUNTRIES]}. These answers do not replace an employer&apos;s right-to-work checks.</p>
        {yesNo("authorized",`Are you legally authorized to work in ${isUS ? "the United States" : "this country"}?`)}
        {yesNo("sponsorship",isUS ? "Do you require employment-based immigration sponsorship (e.g. H-1B, O-1)?" : "Will you require employer sponsorship to work in this country?")}
        {isUS ? <>
          {select("visa_status","Current US immigration status",VISA_STATUSES,true)}
          {values.visa_status === "Other" && input("other_status","Specify visa status","text",true)}
          {["F-1 OPT","F-1 STEM OPT"].includes(values.visa_status) && <>{yesNo("cpt_required","Do you require CPT authorization?")}{yesNo("stem_degree","Is your degree classified as a STEM degree?")}{input("ead_expiration","OPT / STEM OPT EAD expiration date","date")}</>}
          {yesNo("held_h1b","Have you held H-1B status in the last 6 years?")}{yesNo("held_j1","Have you ever held J-1 status?")}
          {values.held_j1 === "yes" && yesNo("j1_residency_requirement","Are you subject to the two-year home residency requirement (212(e))?")}
          {yesNo("i140_filed","Has an I-140 immigrant petition ever been filed on your behalf?")}{yesNo("future_sponsorship","Will you require visa sponsorship at any point in the future?")}
        </> : <>{input("restrictions","Work-permit restrictions relevant to your target role")}{input("permit_expiration","Work-permit expiration date","date")}</>}
        {check("certified","I certify that this immigration and work-authorization information is accurate.")}
      </>}
      {last && <>
        <h2 className="font-semibold">Voluntary self-identification</h2>
        <p className="text-sm text-text-secondary">You may leave every demographic question unanswered. Responses are stored separately and excluded from recruiter review and job matching. Race and protected veteran categories below use US reporting terminology.</p>
        {select("gender","Gender",GENDERS)}{values.gender === "Prefer to self-describe" && input("gender_description","Gender description")}
        <fieldset><legend className="text-sm mb-2">Race / ethnicity (optional, select all that apply)</legend><div className="space-y-2">{ETHNICITIES.map(value=><label key={value} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={ethnicity.includes(value)} onChange={e=>setEthnicity(prev=>e.target.checked ? value === "Prefer not to say" ? [value] : [...prev.filter(item=>item!=="Prefer not to say"),value] : prev.filter(item=>item!==value))}/>{value}</label>)}</div>{fieldError("ethnicity")}</fieldset>
        {select("disability","Disability status",["Yes","No","Prefer not to answer"])}{select("veteran","Protected veteran status",["Yes","No","Prefer not to say"])}
        {check("acknowledged","I understand that providing this information is voluntary and confidential.")}
        {check("consent","I agree to the Terms of Service, acknowledge the Privacy Policy, and consent to my profile and resume being processed for application review.")}
        <p className="text-xs"><a href="/terms" target="_blank" rel="noreferrer" className="underline">Terms of Service</a> · <a href="/privacy" target="_blank" rel="noreferrer" className="underline">Privacy Policy</a></p>
      </>}
    </fieldset>
    {error && <p role="alert" className="text-sm text-error">{error}</p>}
    <div className="flex gap-3">{step>0 && <Button type="button" variant="secondary" disabled={busy} onClick={()=>{setStep(s=>s-1);setErrors({});setError("");}}>Back</Button>}<Button type="submit" disabled={busy} isLoading={busy}>{busy ? "Uploading and submitting…" : last ? "Submit for review" : "Continue"}</Button></div>
    {busy && <p role="status" className="text-xs text-text-secondary">Keep this page open while we save your application.</p>}
  </form>;
}
