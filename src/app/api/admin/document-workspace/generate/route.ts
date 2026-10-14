import { checkAiQuota,recordAiUse } from '@/lib/ai/quota';
import { withStageStream } from '@/lib/ai/progress-stream';
import type { AiStage } from '@/lib/ai/progress';
import { after } from 'next/server';
import { generateDocument } from '@/lib/admin/documents/generate';
import { enqueueDocumentJob,runDocumentJob } from '@/lib/admin/documents/jobs';
import { requireAdmin,isAuthError } from '@/lib/admin/guards';
import { rateLimit } from '@/lib/rate-limit';
import { documentPayloadSchema } from '@/lib/admin/documents/schema';
import { parseExportContent,hasResumeBody } from '@/lib/resume/export-content';
import { z } from 'zod';
const schema=z.object({kind:z.enum(['resume','cover_letter']),payload:documentPayloadSchema});
// Background document jobs run via after() in this function; their AI budget is 85s (lease is 90s).
export const maxDuration=120;
// Streams stage progress to clients that ask for it (see withStageStream).
export function POST(request:Request){return withStageStream(request,onStage=>handle(request,onStage));}
async function handle(request:Request,onStage:(stage:AiStage)=>void){
 const auth=await requireAdmin();if(isAuthError(auth))return auth;
 const limited=await rateLimit('admin-draft-generate',auth.userId,10,60);if(limited)return limited;
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:{message:'Check the resume and job details.'}},{status:400});
 const {kind,payload}=parsed.data,source=payload.resume;
 if(!hasResumeBody(source))return Response.json({error:{message:'Upload or enter your actual experience before generating.'}},{status:400});
 if(kind==='cover_letter'&&(!payload.company.trim()||!payload.jobTitle.trim()))return Response.json({error:{message:'Enter the company and target job title.'}},{status:400});
 const quotaLimited=await checkAiQuota(auth.userId,kind==='resume'?'rewrite':'cover_letter');if(quotaLimited)return quotaLimited;
 try{
  if(request.headers.get('Prefer')==='respond-async'){
   const id=z.string().uuid().parse(request.headers.get('Idempotency-Key'));
   const job=await enqueueDocumentJob(auth.userId,id,kind==='resume'?'generate_resume':'generate_cover_letter',payload);
   if(job){after(()=>runDocumentJob(job.id).catch(()=>console.error('Document processing failed')));return Response.json({data:{jobId:job.id}},{status:202,headers:{'Cache-Control':'private, no-store'}});}
  }
  const result=await generateDocument(kind,payload,{onStage});
  await recordAiUse(auth.userId,kind==='resume'?'rewrite':'cover_letter');
  return Response.json({data:result.data},{headers:{...result.headers,'Cache-Control':'private, no-store'}});
 }catch{return Response.json({error:{message:'Generation failed. Your draft is unchanged; please retry.'}},{status:503});}
}
