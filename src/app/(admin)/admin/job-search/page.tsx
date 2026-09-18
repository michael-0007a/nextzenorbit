import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { JobSearchClient } from "@/components/dashboard/job-search-client";
import { resumeSkills } from "@/lib/jobs/match";

export const dynamic = "force-dynamic";

export default async function AdminJobSearchPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) redirect("/admin/login");
  const admin = createAdminClient();
  let query = admin.from("users").select("id,email,profile:profiles!profiles_user_id_fkey!inner(full_name,preferred_role,preferred_location,assigned_admin_id,preferred_work_type,application_details)").in("role", ["user", "sso_user"]).eq("is_suspended", false).order("email");
  if (auth.role === "admin") query = query.eq("profile.assigned_admin_id", auth.userId);
  const { data, error } = await query;
  if (error) return <p role="alert">Unable to load clients. Please refresh to retry.</p>;
  const clients = (data || []).map(client => ({ ...client, profile: Array.isArray(client.profile) ? client.profile[0] : client.profile }));
  const { client: selectedId } = await searchParams;
  const selected = clients.find(client => client.id === selectedId);
  const [resumes, queue, generated] = selected ? await Promise.all([
    admin.from("resumes").select("id,title,updated_at,content").eq("user_id", selected.id).is("deleted_at", null).order("updated_at", { ascending: false }),
    admin.from("job_queue").select("*").eq("user_id", selected.id).order("created_at", { ascending: false }).limit(100),
    admin.from("admin_resumes").select("id,title,created_at").eq("user_id",selected.id).gt("expires_at",new Date().toISOString()),
  ]) : [{ data: [], error: null }, { data: [], error: null }, {data:[],error:null}];
  return <div className="mx-auto max-w-6xl space-y-6">
    <header><h1 className="text-3xl font-semibold">Job search</h1><p className="mt-2 text-text-secondary">Find Adzuna jobs and add relevant opportunities to a client&apos;s application queue.</p></header>
    <form action="/admin/job-search" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      <label className="min-w-0 flex-1 text-sm font-medium">Client
        <select name="client" defaultValue={selected?.id || ""} required className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2">
          <option value="" disabled>Choose a client</option>
          {clients.map(client => <option key={client.id} value={client.id}>{client.profile?.full_name || client.email} · {client.email}</option>)}
        </select>
      </label>
      <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Load client</button>
    </form>
    {!clients.length && <p className="text-text-secondary">No clients are available. Recruiters need a client assignment before queuing jobs.</p>}
    {selectedId && !selected && <p role="alert">This client is unavailable or is not assigned to you.</p>}
    {selected && <>
      <p className="text-sm">Queuing for <strong>{selected.profile?.full_name || selected.email}</strong> · <Link href={`/admin/users/${selected.id}`} className="text-primary underline">View client</Link></p>
      {resumes.error || queue.error || generated.error ? <p role="alert">Unable to load this client&apos;s resumes or queue. Please refresh to retry.</p> : <JobSearchClient key={selected.id} clientUserId={selected.id} defaultRole={selected.profile?.preferred_role || ""} defaultLocation={selected.profile?.preferred_location || ""} defaultCountry={String(selected.profile?.application_details?.target_country || "us")} workType={selected.profile?.preferred_work_type || "any"} skills={resumeSkills(resumes.data?.[0]?.content)} resumes={[...(resumes.data || []).map(({id,title,updated_at})=>({id,title,updated_at})),...(generated.data || []).map(item=>({...item,updated_at:item.created_at,kind:"generated" as const}))]} queuedJobs={queue.data || []} />}
    </>}
  </div>;
}
