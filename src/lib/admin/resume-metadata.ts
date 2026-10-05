import { createAdminClient } from '@/lib/supabase/admin';
import { hasResumeBody } from '@/lib/resume/export-content';
import type { ResumeRow } from '@/types/database';
export type ResumeMetadata=Pick<ResumeRow,'id'|'title'|'template_id'|'is_base'|'version'|'created_at'|'updated_at'>&{has_export_content:boolean};
export async function resumeMetadata(actorId:string,userId:string) {
 const admin=createAdminClient();
 const optimized=await admin.rpc('performance_resume_metadata',{p_actor_id:actorId,p_user_id:userId});
 if(!optimized.error)return {data:optimized.data as ResumeMetadata[],error:null};
 if(!['PGRST202','42883'].includes(optimized.error.code))return {data:null,error:optimized.error};
 const result=await admin.from('resumes').select('id,title,content,template_id,is_base,version,created_at,updated_at').eq('user_id',userId).is('deleted_at',null).order('is_base',{ascending:false}).order('updated_at',{ascending:false});
 return {data:result.data?.map(({content,...resume})=>({...resume,has_export_content:hasResumeBody(content)}))??null,error:result.error};
}
