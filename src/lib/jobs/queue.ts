import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceAccess } from "@/lib/service-access";
import { requireApprovedAccount } from "@/lib/onboarding";
import { rateLimit } from "@/lib/rate-limit";

export const queueSearchSchema = z.object({
  user_id: z.string().uuid().optional(), resume_id: z.string().uuid().nullable().optional(), admin_resume_id: z.string().uuid().nullable().optional(),
  jobs: z.array(z.object({ catalog_id: z.string().uuid(), job_url: z.string().url().optional() })).min(1).max(50),
}).refine(value=>!value.resume_id || !value.admin_resume_id,"Choose one resume.");

export async function queueSearchJobs(request: Request, actor: { userId: string; role?: string }, adminMode = false) {
  const parsed = queueSearchSchema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return Response.json({error:{message:"Select jobs from a refreshed search and choose one resume."}},{status:400});
  const userId = adminMode ? parsed.data.user_id : actor.userId;
  if (!userId) return Response.json({error:{message:"Choose a client."}},{status:400});
  const admin = createAdminClient();
  if (adminMode && actor.role === "admin") {
    const {data,error} = await admin.from("profiles").select("assigned_admin_id").eq("user_id",userId).maybeSingle();
    if (error || data?.assigned_admin_id !== actor.userId) return Response.json({error:{message:"This client is not assigned to you."}},{status:403});
  }
  const limited = await rateLimit("search-queue",actor.userId,30,60);
  if (limited) return limited;
  const approval = await requireApprovedAccount(userId);
  if (approval) return approval;
  if (!await hasServiceAccess(userId)) return Response.json({error:{message:"The client needs an active plan before jobs can be queued."}},{status:402});
  const ids = [...new Set(parsed.data.jobs.map(job=>job.catalog_id))];
  const {data: jobs,error} = await admin.from("jobs").select("*").in("id",ids);
  if (error) return Response.json({error:{message:"Unable to verify listings. Please retry."}},{status:503});
  if (!jobs || jobs.length !== ids.length || jobs.some(job=>job.closed_at || !job.last_checked_at || !Number.isFinite(Date.parse(job.last_checked_at)) || Date.now()-Date.parse(job.last_checked_at)>86400000)) return Response.json({error:{message:"Some listings are missing or need a fresh availability check. Search again before queuing."}},{status:409});
  const {data,error: queueError} = await admin.rpc("enqueue_search_jobs",{p_user_id:userId,p_actor_id:actor.userId,p_resume_id:parsed.data.resume_id || null,p_admin_resume_id:parsed.data.admin_resume_id || null,
    p_jobs:jobs.map(job=>({title:job.title,company:job.company,job_url:job.apply_url,location:job.location,description:job.description,salary_text:job.details?.salary_text || "Not specified",catalog_id:job.id}))});
  if (queueError) return Response.json({error:{message:"Queueing failed. Check client access and the selected resume, then retry. Existing queue entries are preserved."}},{status:409});
  return Response.json({success:true,data});
}
