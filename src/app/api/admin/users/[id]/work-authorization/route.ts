import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth=await requireAdmin();if(isAuthError(auth))return auth;
  const {id}=await params;const admin=createAdminClient();
  if(auth.role === "admin"){
    const {data,error}=await admin.from("profiles").select("assigned_admin_id").eq("user_id",id).maybeSingle();
    if(error||data?.assigned_admin_id!==auth.userId)return Response.json({error:{message:"This client is not assigned to you."}},{status:403});
  }
  const {data,error}=await admin.from("candidate_work_authorization").select("country,answers,updated_at").eq("user_id",id).maybeSingle();
  if(error)return Response.json({error:{message:"Unable to load work authorization."}},{status:503});
  return Response.json({success:true,data},{headers:{"Cache-Control":"private, no-store"}});
}
