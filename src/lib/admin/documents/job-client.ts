import type { ResumeContent } from '@/lib/validations/resume';
import type { AiStage } from '@/lib/ai/progress';
export type DocumentResult={content?:ResumeContent;letter?:string;warning?:string;title?:string};
export async function waitForDocumentJob(id:string,onProgress:(message:string,stage?:AiStage|null)=>void,signal:AbortSignal):Promise<DocumentResult> {
 const started=Date.now();
 while(!signal.aborted&&Date.now()-started<6*60_000) {
  const response=await fetch(`/api/admin/document-workspace/jobs/${id}`,{signal,cache:'no-store'});
  const body=await response.json();
  if(!response.ok)throw Error(body.error?.message||'Progress unavailable. Return here to resume this job.');
  onProgress(body.data.progress,body.data.stage);
  if(body.data.status==='succeeded')return body.data.result;
  if(body.data.status==='failed')throw Object.assign(Error(body.data.error||'Processing failed. Please retry.'),{terminal:true});
  await new Promise<void>((resolve,reject)=>{const abort=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},2000);signal.addEventListener('abort',abort,{once:true});});
 }
 throw Error('Processing is taking longer than expected. Return here to resume progress.');
}
