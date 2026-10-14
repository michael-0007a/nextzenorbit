import { recordAiUse } from '@/lib/ai/quota';
import { createAdminClient } from '@/lib/supabase/admin';
import { documentPayloadSchema } from '@/lib/admin/documents/schema';
import { generateDocument } from '@/lib/admin/documents/generate';
import { parseDocument } from '@/lib/admin/documents/parse';
import { z } from 'zod';
import type { AiStage } from '@/lib/ai/progress';
export type JobOperation='generate_resume'|'generate_cover_letter'|'parse_resume';
export type DocumentJob={id:string;user_id:string;operation:JobOperation;payload:unknown;result:unknown;status:'queued'|'running'|'succeeded'|'failed';attempts:number;available_at:string;lease_until:string|null;lease_token:string|null;error:string|null;created_at:string;updated_at:string};
const missing=(code?:string)=>code==='42P01'||code==='PGRST205';
export async function enqueueDocumentJob(userId:string,id:string,operation:JobOperation,payload:unknown) {
 const admin=createAdminClient();
 const {error}=await admin.from('document_jobs').upsert({id,user_id:userId,operation,payload},{onConflict:'id',ignoreDuplicates:true});
 if(error){if(missing(error.code))return null;throw error;}
 const {data,error:readError}=await admin.from('document_jobs').select('*').eq('id',id).eq('user_id',userId).maybeSingle();
 if(readError||!data||data.operation!==operation)throw new Error('Job ID unavailable');
 return data;
}
export async function runDocumentJob(id:string) {
 const admin=createAdminClient();
 const {data,error}=await admin.rpc('claim_document_job',{p_id:id});
 if(error)throw error;
 const job=data?.[0];if(!job)return;
 const started=performance.now();
 try{
  const {data:user,error:authError}=await admin.from('users').select('role,is_suspended').eq('id',job.user_id).maybeSingle();
  if(authError)throw authError;
  if(!user||user.is_suspended||!['admin','supervisor_admin','super_admin'].includes(user.role)) {
   await admin.from('document_jobs').update({status:'failed',error:'Admin access is no longer available.',payload:{},updated_at:new Date().toISOString()}).eq('id',id).eq('status','running').eq('lease_token',job.lease_token!);
   return;
  }
  // Progress for the polling UI; best effort, never blocks or fails the job.
  const report=(stage:AiStage)=>{Promise.resolve(admin.from('document_jobs').update({result:{stage}}).eq('id',id).eq('status','running').eq('lease_token',job.lease_token!)).catch(()=>{});};
  const result=job.operation==='parse_resume'
   ? await (async()=>{const p=z.object({text:z.string().min(30).max(200000),title:z.string().max(200)}).parse(job.payload);report('parse');return parseDocument(p.text,p.title);})()
   : (await (async()=>{const generated=await generateDocument(job.operation==='generate_resume'?'resume':'cover_letter',documentPayloadSchema.parse(job.payload),{onStage:report});console.info('[document-job-timing]',{operation:job.operation,stages:generated.headers['Server-Timing']});return generated;})()).data;
  await recordAiUse(job.user_id,job.operation==='generate_resume'?'rewrite':job.operation==='generate_cover_letter'?'cover_letter':'light');
  const {error:saveError}=await admin.from('document_jobs').update({status:'succeeded',result,payload:{},error:null,lease_until:null,updated_at:new Date().toISOString()}).eq('id',id).eq('status','running').eq('lease_token',job.lease_token!);
  if(saveError)throw saveError;
 }catch{
  const final=job.attempts>=3;
  const {error:saveError}=await admin.from('document_jobs').update({status:final?'failed':'queued',error:final?'Processing failed. Your draft is unchanged; please retry.':null,
   ...(final?{payload:{}}:{}),available_at:new Date(Date.now()+job.attempts*5000).toISOString(),lease_until:null,updated_at:new Date().toISOString()}).eq('id',id).eq('status','running').eq('lease_token',job.lease_token!);
  if(saveError)throw saveError;
 }finally{
  console.info('[document-job-timing]',{operation:job.operation,attempt:job.attempts,durationMs:Math.round(performance.now()-started)});
 }
}
export async function resumeDocumentJobs() {
 const admin=createAdminClient(),now=new Date().toISOString();
 // A crash on the last attempt must also reach a terminal state.
 await admin.from('document_jobs').update({status:'failed',error:'Processing was interrupted. Please retry.',payload:{},lease_until:null,updated_at:now}).eq('status','running').gte('attempts',3).lt('lease_until',now);
 const {data,error}=await admin.from('document_jobs').select('id').or(`and(status.eq.queued,available_at.lte.${now}),and(status.eq.running,lease_until.lt.${now})`).lt('attempts',3).order('created_at').limit(2);
 if(error)throw error;
 await Promise.all((data||[]).map(job=>runDocumentJob(job.id)));
 await admin.from('document_jobs').delete().in('status',['succeeded','failed']).lt('updated_at',new Date(Date.now()-7*86400000).toISOString());
}
