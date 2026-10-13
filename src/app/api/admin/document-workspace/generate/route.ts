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
export async function POST(request:Request){
 const auth=await requireAdmin();if(isAuthError(auth))return auth;
 const limited=await rateLimit('admin-draft-generate',auth.userId,10,60);if(limited)return limited;
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:{message:'Check the resume and job details.'}},{status:400});
 const {kind,payload}=parsed.data,source=payload.resume;
 if(!hasResumeBody(source))return Response.json({error:{message:'Upload or enter your actual experience before generating.'}},{status:400});
 if(kind==='cover_letter'&&(!payload.company.trim()||!payload.jobTitle.trim()))return Response.json({error:{message:'Enter the company and target job title.'}},{status:400});
 try{
  if(request.headers.get('Prefer')==='respond-async'){
   const id=z.string().uuid().parse(request.headers.get('Idempotency-Key'));
   const job=await enqueueDocumentJob(auth.userId,id,kind==='resume'?'generate_resume':'generate_cover_letter',payload);
   if(job){after(()=>runDocumentJob(job.id).catch(()=>console.error('Document processing failed')));return Response.json({data:{jobId:job.id}},{status:202,headers:{'Cache-Control':'private, no-store'}});}
  }
  const result=await generateDocument(kind,payload);
  return Response.json({data:result.data},{headers:{...result.headers,'Cache-Control':'private, no-store'}});
 }catch{return Response.json({error:{message:'Generation failed. Your draft is unchanged; please retry.'}},{status:503});}
}
