import { requireAdmin,isAuthError } from "@/lib/admin/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildTargetReport,type TargetSource } from "@/lib/admin/targets";
export const dynamic="force-dynamic";
export async function GET() {
 const auth=await requireAdmin();if(isAuthError(auth))return auth;
 const {data,error}=await createAdminClient().rpc("client_target_report",{p_actor_id:auth.userId});
 if(error)return Response.json({error:{message:"Unable to load application targets. Please retry."}},{status:503});
 const report=buildTargetReport(data as TargetSource);
 return Response.json({data:report,adminId:auth.userId,supervisor:auth.role!=="admin"},{headers:{"Cache-Control":"private, no-store"}});
}
