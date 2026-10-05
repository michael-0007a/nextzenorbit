// Read-only. Optional ORBIT_BENCH_COOKIE authenticates the supplied test account;
// credentials, response bodies, and query strings are never written to the report.
const fs=require('node:fs');
const base=new URL(process.argv[2]||'http://localhost:3000');
const count=Math.max(2,Math.min(20,Number(process.env.ORBIT_BENCH_SAMPLES)||5));
const paths=['/','/terms','/admin/login',...(process.env.ORBIT_BENCH_COOKIE?['/dashboard','/applications','/api/resumes','/api/admin/users','/api/admin/apply-queue']:[])];
const percentile=(values,p)=>values.slice().sort((a,b)=>a-b)[Math.ceil(values.length*p)-1];
(async()=>{
 const report={measuredAt:new Date().toISOString(),origin:base.origin,samples:count,authenticated:!!process.env.ORBIT_BENCH_COOKIE,routes:[]};
 for(const path of paths){const requests=[];for(let i=0;i<count;i++){
  const started=performance.now();
  const response=await fetch(new URL(path,base),{redirect:'manual',signal:AbortSignal.timeout(60000),headers:process.env.ORBIT_BENCH_COOKIE?{Cookie:process.env.ORBIT_BENCH_COOKIE}:undefined});
  const firstByte=performance.now()-started,bytes=(await response.arrayBuffer()).byteLength;
  requests.push({sample:i+1,ttfbMs:Math.round(firstByte),totalMs:Math.round(performance.now()-started),bytes,status:response.status,cache:response.headers.get('x-vercel-cache'),placement:response.headers.get('x-vercel-id')?.split('::').map(s=>s.slice(0,4)).join('::')||null,serverTiming:response.headers.get('server-timing')});
 }
 report.routes.push({path,p50TtfbMs:percentile(requests.map(r=>r.ttfbMs),.5),p95TtfbMs:percentile(requests.map(r=>r.ttfbMs),.95),requests});
 }
 const output=process.argv[3];if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error('Benchmark failed:',error.name);process.exitCode=1;});
