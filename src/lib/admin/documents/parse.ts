import { parseResumeWithAI } from '@/lib/ai/parsers/resume-parser';
import { parseExportContent,hasResumeBody } from '@/lib/resume/export-content';
import { resumeFromExtractedText } from '@/lib/resume/text-fallback';
export async function parseDocument(text:string,title:string) {
 const result=await parseResumeWithAI(text,{signal:AbortSignal.timeout(15000)}).catch(()=>null);
 const parsed=parseExportContent(result?.content);
 const ok=result?.parsedByAI&&parsed.success&&hasResumeBody(parsed.data);
 return {content:ok&&parsed.success?parsed.data:resumeFromExtractedText(text,{full_name:'',email:''}).content,title,
 warning:ok?'Review the imported details against your original before generating.':'AI parsing was unavailable. Extracted text is retained in Additional Information; review and organize it before generating.'};
}
