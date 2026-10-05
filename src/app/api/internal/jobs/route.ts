import { timingSafeEqual } from 'node:crypto';
import { resumeDocumentJobs } from '@/lib/admin/documents/jobs';
export const maxDuration=60;
export async function GET(request:Request) {
 const expected=process.env.CRON_SECRET;
 if(!expected)return new Response(null,{status:503});
 const received=Buffer.from(request.headers.get('authorization')||''),wanted=Buffer.from('Bearer '+expected);
 if(received.length!==wanted.length||!timingSafeEqual(received,wanted))return new Response(null,{status:401});
 try{await resumeDocumentJobs();return Response.json({success:true});}catch{return new Response(null,{status:503});}
}
