import { assignedClientIds, isAssignedToClient } from "@/lib/admin/assignments";
import { z } from "zod";
/**
 * Admin API: Apply Queue
 *
 * GET   /api/admin/apply-queue - List queue items grouped by user
 * PATCH /api/admin/apply-queue - Claim user, update job status, add notes
 * POST  /api/admin/apply-queue - Add a new job to the queue
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

// Required profile fields — matches the dashboard gate
const REQUIRED_PROFILE_FIELDS = ["full_name", "preferred_role", "phone", "headline"];

function checkProfileComplete(profile: Record<string, unknown> | null): boolean {
  if (!profile) return false;
  return REQUIRED_PROFILE_FIELDS.every((f) => {
    const v = profile[f as keyof typeof profile];
    return typeof v === "string" && v.trim().length > 0;
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status"); // optional

    const admin = createAdminClient();

    const clientIds = adminAuth.role === "admin" ? await assignedClientIds(adminAuth.userId) : null;
    // Fetch only accessible clients before loading their private details.
    let usersQuery = admin
      .from("users")
      .select(`
        id, email, role,
        profile:profiles!profiles_user_id_fkey(
          full_name, avatar_url, preferred_role, location, phone, headline, assigned_admin_id
        ),
        job_queue:job_queue!job_queue_user_id_fkey(
          id, title, company, job_url, status, source, created_at, applied_at, admin_notes, assigned_to,
          resume:resumes(id, title, target_role),
          generated_resume:admin_resumes(id, title)
        )
      `)
      .in("role", ["user", "sso_user"])
      .eq("is_suspended",false);
    if(clientIds) usersQuery=usersQuery.in("id",clientIds.concat("00000000-0000-0000-0000-000000000000"));
    const {data:usersData,error}=await usersQuery;

    if (error) {
      console.error("Admin Apply Queue GET Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch queue.");
    }

    const users = (usersData || [])
      .map((user) => {
        // Safely unwrap nested arrays
        const rawProfile = user.profile;
        const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
        
        const rawQueue = (user.job_queue || []).filter(job=>!statusFilter||job.status===statusFilter);
        
        // Fix resume unwrapping from array if it is an array
        const jobQueue = rawQueue.map((job) => ({
          ...job,
          resume: (Array.isArray(job.resume) ? job.resume[0] : job.resume) || (Array.isArray(job.generated_resume) ? job.generated_resume[0] : job.generated_resume)
        }));
        
        const jobCounts = { pending: 0, processing: 0, applied: 0, failed: 0, skipped: 0 };
        for (const job of jobQueue) {
          const st = job.status as string;
          if (st in jobCounts) {
            jobCounts[st as keyof typeof jobCounts]++;
          }
        }
        
        return {
          user_id: user.id,
          full_name: profile?.full_name || "Unknown",
          email: user.email || "",
          avatar_url: profile?.avatar_url || null,
          preferred_role: profile?.preferred_role || null,
          profile_complete: checkProfileComplete(profile),
          is_assigned: clientIds ? clientIds.includes(user.id) : false,
          claimed_by: profile?.assigned_admin_id || null, // Legacy display only
          claimed_at: null, // no longer tracked at user level
          jobs: jobQueue.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
          job_counts: jobCounts
        };
      })
      .sort((a, b) => b.job_counts.pending - a.job_counts.pending);

    return NextResponse.json(apiSuccess({ users }));
  } catch (err) {
    console.error("Admin Apply Queue error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const parsed=z.object({id:z.string().uuid(),status:z.enum(["pending","processing","applied","failed","skipped"]).optional(),action:z.enum(["claim","unclaim"]).optional(),notes:z.string().max(10000).optional()}).refine(v=>v.status||v.action||v.notes!==undefined).safeParse(await request.json());
    if(!parsed.success) return apiError(ERROR_CODES.VALIDATION_ERROR,"Choose a valid job and update.",400);
    const {id,status,action,notes}=parsed.data;
    const {data,error}=await createAdminClient().rpc("update_team_queue_job",{p_actor_id:adminAuth.userId,p_id:id,p_status:status||null,p_action:action||null,p_notes:notes??null});

    if (error) {
      console.error("Admin Apply Queue PATCH Error:", error);
      return apiError(ERROR_CODES.FORBIDDEN, "Unable to update this job. Check client assignment and job ownership; completed applications cannot be reopened.",409);
    }

    return NextResponse.json(apiSuccess(data));
  } catch (err) {
    console.error("Admin Apply Queue PATCH error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const adminAuth = await requireAdmin();
    if (isAuthError(adminAuth)) return adminAuth;

    const body = await request.json();
    const { user_id, title, company, job_url, description, admin_notes, resume_id } = body;

    if (!user_id || !title || !company || !job_url) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "user_id, title, company, and job_url are required.");
    }

    if(adminAuth.role==="admin"&&!await isAssignedToClient(adminAuth.userId,user_id)) return apiError(ERROR_CODES.FORBIDDEN,"This client is not assigned to you.",403);
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("job_queue")
      .insert({
        user_id,
        title,
        company,
        job_url,
        description: description || null,
        source: "manual",
        status: "pending",
        assigned_to: adminAuth.userId,
        assigned_at: new Date().toISOString(),
        admin_notes: admin_notes || null,
        resume_id: resume_id || null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Admin Apply Queue POST Error:", error);
      return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to add job to queue.");
    }

    return NextResponse.json(apiSuccess(data), { status: 201 });
  } catch (err) {
    console.error("Admin Apply Queue POST error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Something went wrong.", 500);
  }
}
