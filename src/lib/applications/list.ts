import { createAdminClient } from '@/lib/supabase/admin';
import type { ApplicationRow } from '@/types/database';
import type { PaginationMeta } from '@/types/api';
export type ApplicationsPageData={applications:ApplicationRow[];counts:{total:number;interviews:number;offers:number;followUps:number};pagination:PaginationMeta};
export async function listApplicationPage(userId:string,page=1,limit=50,status:string|null=null,search=''):Promise<ApplicationsPageData> {
 const admin=createAdminClient();
 const {data,error}=await admin.rpc('performance_applications',{p_user_id:userId,p_page:page,p_limit:limit,p_status:status,p_search:search.slice(0,200)});
 if(!error)return data as ApplicationsPageData;
 if(!['PGRST202','42883'].includes(error.code))throw error;
 // Compatibility during migration rollout; the read model removes the legacy row cap.
 const [apps,queue]=await Promise.all([admin.from('applications').select('*').eq('user_id',userId).order('applied_at',{ascending:false}),admin.from('job_queue').select('*').eq('user_id',userId).in('status',['pending','processing','applied']).order('created_at',{ascending:false})]);
 if(apps.error||queue.error)throw apps.error||queue.error;
 const existing=new Set((apps.data||[]).map(a=>a.job_url).filter(Boolean));
 const mapped=(queue.data||[]).filter(q=>!q.job_url||!existing.has(q.job_url)).map(q=>({id:q.id,user_id:q.user_id,resume_id:q.resume_id,company:q.company,position:q.title,role:q.title,job_url:q.job_url,status:'applied',applied_at:q.applied_at||q.created_at,salary_range:q.salary_text,location:q.location,work_type:'any',notes:[q.status==='pending'?'⏳ In Queue to be applied':q.status==='processing'?'🔄 Currently applying...':'✅ Applied via Admin/AI',q.admin_notes?`Admin Note: ${q.admin_notes}`:null,q.description].filter(Boolean).join('\n\n'),follow_up_at:null,created_at:q.created_at,updated_at:q.updated_at||q.created_at})) as ApplicationRow[];
 const all=[...(apps.data||[]),...mapped].sort((a,b)=>Date.parse(b.applied_at||b.created_at)-Date.parse(a.applied_at||a.created_at)||a.id.localeCompare(b.id));
 const filtered=all.filter(a=>(!status||a.status===status)&&(!search||(a.company+' '+a.position).toLowerCase().includes(search.toLowerCase())));
 return {applications:filtered.slice((page-1)*limit,page*limit),counts:{total:all.length,interviews:all.filter(a=>a.status==='interview').length,offers:all.filter(a=>a.status==='offer').length,followUps:all.filter(a=>a.follow_up_at&&Date.parse(a.follow_up_at)>Date.now()).length},pagination:{page,perPage:limit,total:filtered.length,totalPages:Math.ceil(filtered.length/limit)}};
}
