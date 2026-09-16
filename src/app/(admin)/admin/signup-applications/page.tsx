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
  const page = Math.max(1, Math.min(10000, Number(params.page) || 1));
  const { data, error, count } = await createAdminClient().from("signup_applications").select("*", { count: "exact" })
    .eq("status", status).eq("legacy_account", false).order("submitted_at", { ascending: false }).range((page - 1) * 25, page * 25 - 1);
  if (error) throw new Error("Unable to load signup applications. Please retry.");
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Signup applications</h1><p className="text-text-secondary">Review the profile and uploaded resume. Approval unlocks payment.</p></div>
    <nav className="flex gap-4">{["pending", "approved", "rejected"].map(value => <Link key={value} href={`?status=${value}`} className={status === value ? "font-semibold text-primary underline" : "text-text-secondary"}>{value[0].toUpperCase() + value.slice(1)}</Link>)}</nav>
    {!data?.length && <p>No {status} applications.</p>}
    {data?.map(application => <ApplicationReview key={application.user_id} application={application} />)}
    <div className="flex gap-4 text-sm">{page > 1 && <Link href={`?status=${status}&page=${page - 1}`}>Previous</Link>}{page * 25 < (count || 0) && <Link href={`?status=${status}&page=${page + 1}`}>Next</Link>}</div>
  </div>;
}
