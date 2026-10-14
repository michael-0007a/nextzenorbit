import { after } from 'next/server';
import { z } from 'zod';
import { enqueueDocumentJob,runDocumentJob } from '@/lib/admin/documents/jobs';
import { parseDocument } from '@/lib/admin/documents/parse';
import { requireAdmin,isAuthError } from "@/lib/admin/guards";
import { rateLimit } from "@/lib/rate-limit";
import { extractText } from "@/lib/ai/parsers/resume-parser";
import { parseExportContent,hasResumeBody } from "@/lib/resume/export-content";
import { resumeFromExtractedText } from "@/lib/resume/text-fallback";
// Background document jobs run via after() in this function; their AI budget is 85s (lease is 90s).
export const maxDuration=120;
export async function POST(request:Request){
 const auth=await requireAdmin();if(isAuthError(auth))return auth;
 const limited=await rateLimit('admin-draft-upload',auth.userId,10,60);if(limited)return limited;
 try{
  const form=await request.formData();const file=form.get('file');
  // Multipart stays below Vercel's function payload limit. Nothing is uploaded to storage.
  if(!(file instanceof File)||file.size<=0||file.size>4*1024*1024||! /\.(pdf|docx)$/i.test(file.name))return Response.json({error:{message:'Choose a PDF or DOCX up to 4 MB.'}},{status:400});
  const buffer=Buffer.from(await file.arrayBuffer()),pdf=/\.pdf$/i.test(file.name);
  if(pdf?buffer.subarray(0,5).toString()!=='%PDF-':buffer.subarray(0,2).toString()!=='PK')return Response.json({error:{message:'Invalid document format.'}},{status:400});
  const text=await extractText(buffer,pdf?'application/pdf':'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  if(text.trim().length<30)return Response.json({error:{message:'No readable text found. Use a text-based PDF or Word document.'}},{status:422});
  const title=file.name.replace(/\.(pdf|docx)$/i,'').slice(0,200);
  if(text.length>200000)return Response.json({error:{message:'This document is too long. Choose a resume with fewer than 200,000 characters.'}},{status:422});
  if(request.headers.get('Prefer')==='respond-async'){
   const id=z.string().uuid().parse(request.headers.get('Idempotency-Key'));
   const job=await enqueueDocumentJob(auth.userId,id,'parse_resume',{text,title});
   if(job){after(()=>runDocumentJob(job.id).catch(()=>console.error('Document processing failed')));return Response.json({data:{jobId:job.id}},{status:202,headers:{'Cache-Control':'private, no-store'}});}
  }
  return Response.json({data:await parseDocument(text,title)},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return Response.json({error:{message:'Unable to read this document. Your current draft is unchanged.'}},{status:503});}
}
