import { after } from 'next/server';
import { requireAdmin,isAuthError } from '@/lib/admin/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { runDocumentJob } from '@/lib/admin/documents/jobs';
import { z } from 'zod';
// Background document jobs run via after() in this function; their AI budget is 85s (lease is 90s).
export const maxDuration=120;
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
 const auth=await requireAdmin();if(isAuthError(auth))return auth;
 const {id}=await params;if(!z.string().uuid().safeParse(id).success)return Response.json({error:{message:'Invalid job.'}},{status:400});
 const admin=createAdminClient();
 const {data:job,error}=await admin.from('document_jobs').select('id,status,operation,result,error,attempts,lease_until,available_at').eq('id',id).eq('user_id',auth.userId).maybeSingle();
 if(error)return Response.json({error:{message:'Progress is temporarily unavailable.'}},{status:503});
 if(!job)return Response.json({error:{message:'Job not found.'}},{status:404});
 if(job.status==='running'&&job.attempts>=3&&job.lease_until&&Date.parse(job.lease_until)<Date.now()) {
  await admin.from('document_jobs').update({status:'failed',payload:{},error:'Processing was interrupted. Please retry.'}).eq('id',id).eq('status','running').eq('lease_until',job.lease_until);
  job.status='failed';job.error='Processing was interrupted. Please retry.';
 }
 if((job.status==='queued'&&Date.parse(job.available_at)<=Date.now())||(job.status==='running'&&job.lease_until&&Date.parse(job.lease_until)<Date.now()))after(()=>runDocumentJob(id).catch(()=>console.error('Document job recovery failed')));
 return Response.json({data:{id:job.id,status:job.status,operation:job.operation,result:job.status==='succeeded'?job.result:null,error:job.error,
  progress:job.status==='succeeded'?'Ready to review':job.status==='running'?'Processing your document':job.status==='queued'?'Waiting to process':'Processing failed'}},{headers:{'Cache-Control':'private, no-store'}});
}
