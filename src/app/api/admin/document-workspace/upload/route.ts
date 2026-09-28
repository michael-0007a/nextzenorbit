import { requireAdmin,isAuthError } from "@/lib/admin/guards";
import { rateLimit } from "@/lib/rate-limit";
import { extractText,parseResumeWithAI } from "@/lib/ai/parsers/resume-parser";
import { parseExportContent,hasResumeBody } from "@/lib/resume/export-content";
import { resumeFromExtractedText } from "@/lib/resume/text-fallback";
export const maxDuration=60;
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
  const result=await parseResumeWithAI(text,{signal:AbortSignal.timeout(15000)}).catch(()=>null);
  const parsed=parseExportContent(result?.content);const ok=result?.parsedByAI&&parsed.success&&hasResumeBody(parsed.data);
  const fallback=resumeFromExtractedText(text,{full_name:'',email:''});
  return Response.json({data:{content:ok&&parsed.success?parsed.data:fallback.content,title:file.name.replace(/\.(pdf|docx)$/i,''),warning:ok?'Review the imported details against your original before generating.':'AI parsing was unavailable. Extracted text is retained in Additional Information; review and organize it before generating.'}},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:{message:'Unable to read this document. Your current draft is unchanged.'}},{status:503});}
}
