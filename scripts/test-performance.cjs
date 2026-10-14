const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
const {loadSource}=require('./test-admin-resume-exports.cjs');
const ids=Array.from({length:6},(_,i)=>`${i+1}1111111-1111-4111-8111-111111111111`),[supervisor,a,b,client,other,suspended]=ids;
test('Consolidated access retains approval, paid expiry, blocks, suspension, privileged roles and fail-closed errors',async()=>{
 const active={status:'active',current_period_end:'2099-01-01'};
 for(const fixture of [
  {role:'user',status:'approved',sub:active,expected:true},
  ...['draft','pending','rejected'].map(status=>({role:'user',status,sub:active,expected:false})),
  ...[null,{status:'active',current_period_end:'2020-01-01'},{status:'trialing',trial_ends_at:'2099-01-01'}].map(sub=>({role:'user',status:'approved',sub,expected:false})),
  {role:'user',status:'approved',sub:active,blocked:true,expected:false},
  ...['admin','supervisor_admin','super_admin','sso_user'].flatMap(role=>[{role,status:'draft',sub:null,expected:true},{role,status:'approved',sub:active,suspended:true,expected:false}]),
 ]){
  let reads=0;
  const {getAccountAccess}=loadSource('src/lib/account-access.ts',{react:{cache:f=>f},'@/lib/supabase/admin':{createAdminClient:()=>({from:table=>{reads++;const q={select:()=>q,eq:()=>q,in:()=>q,limit:async()=>({data:fixture.blocked?[{kind:'email'}]:[]}),maybeSingle:async()=>({data:{role:fixture.role,email:'client@test',is_suspended:!!fixture.suspended,application:{status:fixture.status,phone:'123'},subscription:fixture.sub}})};return q;}})}});
  const result=await getAccountAccess(client);assert.equal(result.service,fixture.expected,JSON.stringify(fixture));assert.ok(reads<=2);
 }
 const {getAccountAccess}=loadSource('src/lib/account-access.ts',{react:{cache:f=>f},'@/lib/supabase/admin':{createAdminClient:()=>({from:()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({error:new Error('Database unavailable')})})})}});
 await assert.rejects(getAccountAccess(client),/Database unavailable/);
});
test('Performance read models preserve membership, aggregate beyond 1000 jobs, page after filtering, and deny direct access',async()=>{
 const db=new PGlite();try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
 CREATE TABLE users(id uuid PRIMARY KEY,role text,is_suspended boolean DEFAULT false,email text,created_at timestamptz DEFAULT now());
 CREATE TABLE profiles(user_id uuid PRIMARY KEY,assigned_admin_id uuid,full_name text,avatar_url text,preferred_role text,location text,phone text,headline text);
 CREATE TABLE subscriptions(user_id uuid UNIQUE,plan_id text,status text,created_at timestamptz DEFAULT now());
 CREATE TABLE client_admin_assignments(user_id uuid,admin_id uuid,PRIMARY KEY(user_id,admin_id));
 CREATE TABLE resumes(id uuid PRIMARY KEY,user_id uuid,deleted_at timestamptz,updated_at timestamptz,title text,template_id text,is_base boolean,version integer,created_at timestamptz,content jsonb);
 CREATE TABLE job_queue(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,title text,company text,job_url text,location text,salary_text text,description text,status text,resume_id uuid,assigned_to uuid,applied_by uuid,applied_at timestamptz,admin_notes text,created_at timestamptz DEFAULT now(),updated_at timestamptz);
 CREATE TABLE applications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,resume_id uuid,company text,position text,job_url text,status text,applied_at timestamptz,follow_up_at timestamptz,created_at timestamptz DEFAULT now(),updated_at timestamptz);
 INSERT INTO users(id,role,email) VALUES('${supervisor}','supervisor_admin','s@test'),('${a}','admin','a@test'),('${b}','admin','b@test'),('${client}','user','client@test'),('${other}','user','other@test'),('${suspended}','admin','suspended@test');
 UPDATE users SET is_suspended=true WHERE id='${suspended}';
 INSERT INTO profiles(user_id,full_name,preferred_role,phone,headline,assigned_admin_id) VALUES('${client}','Needle Client','Engineer','123','Engineer','${a}'),('${other}','Other','Engineer','123','Engineer','${b}');
 INSERT INTO subscriptions(user_id,plan_id,status) VALUES('${client}','pro','active'),('${other}','free','active');
 INSERT INTO client_admin_assignments VALUES('${client}','${a}'),('${client}','${b}'),('${other}','${b}');
 INSERT INTO job_queue(user_id,title,company,job_url,status,assigned_to,applied_by,applied_at) SELECT '${client}','Bulk '||g,'Acme','https://jobs.test/'||g,'applied','${b}','${a}',now() FROM generate_series(1,1005) g;
 INSERT INTO job_queue(user_id,title,company,job_url,status,assigned_to) VALUES('${other}','Private','Other','https://jobs.test/private','pending','${b}');
 INSERT INTO applications(user_id,company,position,job_url,status,applied_at) VALUES('${client}','Acme','Duplicate','https://jobs.test/1','interview',now());`);
 await db.exec(`CREATE FUNCTION public.has_paid_service_access() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('test.paid',true),'false')='true' $$;
 ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;GRANT SELECT ON resumes TO authenticated;
 CREATE POLICY owner_read ON resumes FOR SELECT TO authenticated USING(user_id='${client}');
 CREATE POLICY paid_service_access ON resumes AS RESTRICTIVE FOR ALL TO authenticated USING(public.has_paid_service_access()) WITH CHECK(public.has_paid_service_access());`);
 await db.exec(fs.readFileSync('supabase/migrations/040_performance_read_models.sql','utf8'));
 const call=async(name,args)=>(await db.query(`SELECT ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args)).rows[0].result;
 const users=await call('performance_admin_users',[a,1,1,'needle']);assert.equal(users.pagination.total,1);assert.equal(users.users[0].assignedAdmins.length,2);assert.equal(users.users[0].jobCounts.applied,1005);assert.equal(users.users[0].profileComplete,true);
 const second=await call('performance_admin_users',[b,2,1,'']);assert.equal(second.users.length,1);assert.equal(second.pagination.total,2);
 const queue=await call('performance_queue_page',[a,1,20,'',false,null]);assert.equal(queue.users.length,1);assert.equal(queue.users[0].jobs_loaded,false);assert.equal(queue.users[0].job_counts.applied,1005);
 const complete=await call('performance_queue_page',[b,1,20,'',true,null]);assert.equal(complete.pagination.total,1);assert.equal(complete.users[0].user_id,client);
 const stats=await call('performance_admin_stats',[supervisor]);assert.equal(stats.adminPerformance.find(r=>r.id===a).jobsApplied,1005);assert.equal(stats.adminPerformance.find(r=>r.id===b).jobsApplied,0);
 const analytics=await call('performance_admin_analytics',[supervisor,a,2,10,'Bulk']);assert.equal(analytics.allJobs.length,10);assert.equal(analytics.pagination.total,1005);assert.equal(analytics.monthlyData[0].applied,1005);assert.equal(analytics.clientsData[0].applied,1005);
 await db.query("INSERT INTO resumes(id,user_id,title,is_base,content) VALUES(gen_random_uuid(),$1,'Source',true,$2)",[client,JSON.stringify({summary:{text:'Candidate supported work history'}})]);
 const metadata=await call('performance_resume_metadata',[a,client]);assert.equal(metadata.length,1);assert.equal(metadata[0].has_export_content,true);assert.equal('content' in metadata[0],false);await assert.rejects(call('performance_resume_metadata',[a,other]),/Client not assigned/);
 const apps=await call('performance_applications',[client,1,25,null,'']);assert.equal(apps.applications.length,25);assert.equal(apps.pagination.total,1005);assert.equal(apps.counts.interviews,1);
 const interviews=await call('performance_applications',[client,1,25,'interview','duplicate']);assert.equal(interviews.applications.length,1);assert.equal(interviews.pagination.total,1);
 assert.equal((await call('performance_applications',[other,1,25,null,''])).pagination.total,1);
 for(const actor of [client,suspended])await assert.rejects(call('performance_admin_users',[actor]),/Admin required/);
 await assert.rejects(call('performance_admin_stats',[a]),/Supervisor required/);
 await db.exec('SET ROLE authenticated');await assert.rejects(call('performance_admin_users',[a]),/permission denied/);await assert.rejects(call('performance_applications',[client]),/permission denied/);
 assert.equal((await db.query('SELECT id FROM resumes')).rows.length,0);await db.exec("SET test.paid='true'");assert.equal((await db.query('SELECT id FROM resumes')).rows.length,1);
 assert.match(JSON.stringify((await db.query('EXPLAIN (FORMAT JSON) SELECT id FROM resumes')).rows),/InitPlan/);
 }finally{await db.close();}
});
test('Durable jobs are claimed once, recover expired leases, stop at three attempts, and deny browsers',async()=>{
 const db=new PGlite();try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE TABLE users(id uuid PRIMARY KEY);INSERT INTO users VALUES('${a}');`);
 await db.exec(fs.readFileSync('supabase/migrations/041_document_jobs.sql','utf8'));
 const id=crypto.randomUUID();await db.query("INSERT INTO document_jobs(id,user_id,operation,payload) VALUES($1,$2,'generate_resume','{}')",[id,a]);
 const claim=()=>db.query('SELECT * FROM claim_document_job($1)',[id]);
 const first=(await claim()).rows[0];assert.equal(first.attempts,1);assert.equal((await claim()).rows.length,0);
 await db.query("UPDATE document_jobs SET lease_until=now()-interval '1 second' WHERE id=$1",[id]);const second=(await claim()).rows[0];assert.equal(second.attempts,2);assert.notEqual(first.lease_token,second.lease_token);
 const stale=await db.query("UPDATE document_jobs SET status='succeeded' WHERE id=$1 AND lease_token=$2 RETURNING id",[id,first.lease_token]);assert.equal(stale.rows.length,0);
 await db.query("UPDATE document_jobs SET lease_until=now()-interval '1 second' WHERE id=$1",[id]);assert.equal((await claim()).rows[0].attempts,3);
 await db.query("UPDATE document_jobs SET lease_until=now()-interval '1 second' WHERE id=$1",[id]);assert.equal((await claim()).rows.length,0);
 await db.exec('SET ROLE authenticated');await assert.rejects(claim(),/permission denied/);await assert.rejects(db.query('SELECT * FROM document_jobs'),/permission denied/);
 }finally{await db.close();}
});
test('Signed account envelopes reject forgery, wrong account/path, and expiry',async()=>{
 process.env.SUPABASE_SERVICE_ROLE_KEY='test-access-key';
 const {signAccess,verifyAccess}=loadSource('src/lib/access-envelope.ts',{});
 const access={application:'approved',service:true,role:'user',subscription:null};
 const signed=await signAccess(client,'/dashboard',access);assert.deepEqual(await verifyAccess(signed,client,'/dashboard'),access);
 assert.equal(await verifyAccess(signed,other,'/dashboard'),null);assert.equal(await verifyAccess(signed,client,'/resumes'),null);
 assert.equal(await verifyAccess(signed.slice(0,-1)+(signed.endsWith('0')?'1':'0'),client,'/dashboard'),null);
 const original=Date.now;Date.now=()=>original()+31000;try{assert.equal(await verifyAccess(signed,client,'/dashboard'),null);}finally{Date.now=original;}
});
test('Client display cache clears on account changes, invalidates after writes, and discards old in-flight responses',async()=>{
 const original=global.fetch;let reads=0,release;
 const cache=loadSource('src/lib/client-query-cache.ts',{});
 global.fetch=async()=>{reads++;return Response.json({success:true,data:reads});};
 try{
  cache.setClientQueryAccount(a);await cache.clientQuery('/list');await cache.clientQuery('/list');assert.equal(reads,1);
  cache.invalidateClientQueries();await cache.clientQuery('/list');assert.equal(reads,2);
  cache.setClientQueryAccount(b);await cache.clientQuery('/list');assert.equal(reads,3);
  global.fetch=()=>new Promise(resolve=>{release=resolve;});const pending=cache.clientQuery('/new');cache.setClientQueryAccount(null);release(Response.json({data:'old account'}));await assert.rejects(pending,{name:'AbortError'});
 }finally{global.fetch=original;}
});
test('Optimized wrapping and reused candidates produce exactly the legacy pagination plan',()=>{
 const ts=require('typescript'),Module=require('node:module'),path=require('node:path');
 const file='src/lib/resume/layout.ts',source=fs.readFileSync(file,'utf8');
 function legacyWrapText(text,font,size,width){const metrics=fontWidths[font],measure=value=>Array.from(value).reduce((sum,c)=>sum+(metrics[c]??1000),0)*size/1000;const lines=[];for(const paragraph of text.split(/\r?\n/)){let line='';for(const word of paragraph.trim().split(/\s+/).filter(Boolean)){if(line&&measure(`${line} ${word}`)>width){lines.push(line);line='';}for(const character of Array.from(word)){if(measure(line+character)>width){lines.push(line);line='';}line+=character;}line+=' ';}if(line.trim())lines.push(line.trimEnd());}return lines.length?lines:[''];}
 const from=source.indexOf('function wrapText('),to=source.indexOf('\nfunction makeLines(',from);
 let legacy=source.slice(0,from)+legacyWrapText.toString().replace('legacyWrapText','wrapText')+'\n'+source.slice(to);
 const start=legacy.indexOf('  const candidates ='),end=legacy.indexOf('  const minPages =',start);
 legacy=legacy.slice(0,start)+`  const candidates = [10.5,11,11.5,12].flatMap(size=>[1.15,1.2,1.3,1.4].flatMap(leading=>[0.6,1].map(spacing=>{const pages=paginate(makeLines(blocks,template,size,leading,spacing),capacity,content.layout?.target_pages??undefined);const fill=pages.reduce((sum,page)=>sum+page.reduce((h,line)=>h+line.height+line.before,0),0)/(pages.length*capacity);return {pages,fontSize:size,lineHeight:leading,fill};})));\n`+legacy.slice(end);
 const m=new Module(path.resolve(file),module);m.filename=path.resolve(file);m.paths=module.paths;m.require=name=>name==='./font-widths.json'?require('../src/lib/resume/font-widths.json'):require(name);
 m._compile(ts.transpileModule(legacy,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,m.filename);
 const current=loadSource(file,{}),{getTemplate}=loadSource('src/lib/resume/templates.ts',{}),{createEmptyResumeContent}=loadSource('src/lib/validations/resume.ts',{});
 const content=createEmptyResumeContent({full_name:'Synthetic Candidate',email:'candidate@example.com'});
 content.experience=Array.from({length:6},(_,i)=>({id:String(i),company:'Company',position:'Engineer',start_date:'2020',end_date:'2024',bullets:Array.from({length:6},()=> 'Validated data with SQL, Python and repeatable deployment checks. https://example.com/'+('long-url-part-'.repeat(8)))}));
 content.custom_sections=[{id:'extra',title:'Details',content:'First line\nSecond paragraph with unicode café and punctuation.'}];
 for(const id of ['classic','modern','creative','c2c-consultant'])for(const target of [undefined,3]){
  const fixture={...content,layout:target?{target_pages:target}:undefined};
  assert.deepEqual(current.layoutResume(fixture,getTemplate(id)),m.exports.layoutResume(fixture,getTemplate(id)));
 }
});
test('Private export caching coalesces identical work and separates account, source, template and format; failures retry',async()=>{
 const {cachedExport}=loadSource('src/lib/resume/export-cache.ts',{});let n=0;
 const render=async()=>{n++;await new Promise(r=>setTimeout(r,10));return Buffer.from('PDF');};
 await Promise.all([cachedExport(a,'pdf',{content:'one',template:'classic'},render),cachedExport(a,'pdf',{content:'one',template:'classic'},render)]);assert.equal(n,1);
 await cachedExport(a,'pdf',{content:'one',template:'classic'},render);assert.equal(n,1);
 for(const [owner,format,source] of [[b,'pdf',{content:'one',template:'classic'}],[a,'docx',{content:'one',template:'classic'}],[a,'pdf',{content:'two',template:'classic'}],[a,'pdf',{content:'one',template:'modern'}]])await cachedExport(owner,format,source,render);
 assert.equal(n,5);await assert.rejects(cachedExport(a,'pdf','failure',async()=>{throw Error('render');}));await cachedExport(a,'pdf','failure',render);assert.equal(n,6);
});
for(const format of ['pdf','docx'])test(`Cover letter ${format} renders locally with complete recovered text`,async()=>{
 const {renderCoverLetter}=loadSource('src/lib/resume/cover-letter-export.ts',{});
 const content='Dear Hiring Manager,\n\nI built reliable SQL reporting workflows and maintained deployment checks.\n\nSincerely,\nSample Candidate';
 const buffer=await renderCoverLetter(content,format);
 const extracted=format==='pdf'?(await require('unpdf').extractText(new Uint8Array(buffer),{mergePages:true})).text:(await require('mammoth').extractRawText({buffer})).value;
 for(const phrase of ['Dear Hiring Manager','SQL reporting workflows','Sample Candidate'])assert.ok(extracted.includes(phrase));
});

test('An ambiguous job save cannot requeue work that already completed',async()=>{
 const state={status:'running',lease_token:'lease'};
 const job={id:'job',user_id:a,operation:'generate_resume',payload:{},attempts:1,lease_token:'lease'};
 const db={rpc:async()=>({data:[job]}),from:table=>{
  if(table==='users')return {select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{role:'admin',is_suspended:false}})};
  const filters=[];let values;return {update(v){values=v;return this;},eq(k,v){filters.push([k,v]);return this;},then(resolve,reject){
   const matches=filters.every(([k,v])=>k==='id'||state[k]===v);
   if(matches)Object.assign(state,values);
   return Promise.resolve({error:values.status==='succeeded'?new Error('Response interrupted after save'):null}).then(resolve,reject);
  }};
 }};
 const {runDocumentJob}=loadSource('src/lib/admin/documents/jobs.ts',{
  '@/lib/ai/quota': { checkAiQuota: async () => null, recordAiUse: async () => {} },
  '@/lib/supabase/admin':{createAdminClient:()=>db},
  '@/lib/admin/documents/schema':{documentPayloadSchema:{parse:value=>value}},
  '@/lib/admin/documents/generate':{generateDocument:async()=>({data:{content:'draft'},headers:{'Server-Timing':'model;dur=1'}})},
  '@/lib/admin/documents/parse':{parseDocument:async()=>({})},
 });
 await runDocumentJob('job');assert.equal(state.status,'succeeded');assert.deepEqual(state.result,{content:'draft'});
});
