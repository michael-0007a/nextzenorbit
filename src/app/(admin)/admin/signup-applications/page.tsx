import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApplicationReview } from "./review";

export const dynamic = "force-dynamic";
export default async function SignupApplicationsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const auth = await requireAdmin();
  if (isAuthError(auth) || auth.role === "admin") redirect("/admin");
  const params = await searchParams;
  const status = params.status === "approved" || params.status === "rejected" ? params.status : "pending";
  const page = Math.max(1, Math.min(10000, Math.floor(Number(params.page)) || 1));
  const { data, error, count } = await createAdminClient().from("signup_applications").select("*", { count: "exact" })
    .eq("status", status).eq("legacy_account", false).order("submitted_at", { ascending: false }).range((page - 1) * 25, page * 25 - 1);
  if (error) throw new Error("Unable to load signup applications. Please retry.");
  const counts = await Promise.all((["pending", "approved", "rejected"] as const).map(async value => {
    const { count, error } = await createAdminClient().from("signup_applications").select("user_id", { count: "exact", head: true }).eq("status", value).eq("legacy_account", false);
    if (error) throw new Error("Unable to load application counts.");
    return count || 0;
  }));
  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Candidate admissions</p><h1 className="mt-2 text-3xl font-bold">Signup applications</h1><p className="mt-3 max-w-2xl text-text-secondary">Review each candidate’s profile and original resume. Approval invites them to choose a plan; services remain locked until payment is confirmed.</p><div className="mt-6 flex flex-wrap gap-2 text-xs font-medium">{["1 · Profile & resume", "2 · Team review", "3 · Plan & payment", "4 · Service access"].map(step => <span className="rounded-full border border-border bg-background/60 px-3 py-2" key={step}>{step}</span>)}</div></header>
    <nav aria-label="Application status" className="grid grid-cols-3 gap-3">{["pending", "approved", "rejected"].map((value, index) => <Link key={value} href={`?status=${value}`} aria-current={status === value ? "page" : undefined} className={`rounded-xl border p-4 transition-colors ${status === value ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}><span className="block text-sm capitalize">{value}</span><span className="mt-2 block text-2xl font-bold">{counts[index]}</span><span className="mt-1 hidden text-xs text-text-secondary sm:block">{index === 0 ? "Awaiting review" : index === 1 ? "Eligible for payment" : "Registration blocked"}</span></Link>)}</nav>
    <p className="text-sm text-text-secondary">{count || 0} {status} applications · Page {page}</p>
    {!data?.length && <div className="rounded-2xl border border-dashed border-border p-12 text-center"><h2 className="font-semibold">No {status} applications</h2><p className="mt-2 text-sm text-text-secondary">Applications will appear here when their status matches this view.</p></div>}
    {data?.map(application => <ApplicationReview key={application.user_id} application={application} />)}
    <div className="flex gap-4 text-sm">{page > 1 && <Link href={`?status=${status}&page=${page - 1}`}>Previous</Link>}{page * 25 < (count || 0) && <Link href={`?status=${status}&page=${page + 1}`}>Next</Link>}</div>
  </div>;
}
