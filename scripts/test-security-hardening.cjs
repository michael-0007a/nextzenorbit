const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const {PGlite}=require('@electric-sql/pglite');
let assigned=new Set(),lookups=0;
const stubs={'@/lib/supabase/admin':{createAdminClient:()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>{lookups++;return {data:assigned.has('c1')?{user_id:'c1'}:null,error:null};}};return {from:()=>q};}}};
function load(file){const filename=path.resolve(file);const m=new Module(filename,module);m.filename=filename;m.paths=module.paths;m.require=name=>stubs[name]||require(name);m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);return m.exports;}
const {denyUnassignedClient}=load('src/lib/admin/assignments.ts');

test('recruiter admins are denied unassigned clients; supervisors and super admins are not checked',async()=>{
  const denied=await denyUnassignedClient({userId:'a',role:'admin'},'c1');assert.equal(denied.status,403);
  assigned.add('c1');assert.equal(await denyUnassignedClient({userId:'a',role:'admin'},'c1'),null);
  lookups=0;assigned.clear();
  for(const role of ['supervisor_admin','super_admin'])assert.equal(await denyUnassignedClient({userId:'s',role},'c1'),null);
  assert.equal(lookups,0);
  assert.equal((await denyUnassignedClient({userId:'a',role:''},'c1')).status,403);
});

test('migration 042 closes resume_versions, job_queue, telemetry and saved search gaps',async()=>{
  const db=new PGlite();try{
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('app.uid',true),'')::uuid $$;
  CREATE FUNCTION public.has_paid_service_access() RETURNS boolean LANGUAGE sql AS $$ SELECT current_setting('app.paid',true)='1' $$;
  CREATE TABLE resumes(id uuid PRIMARY KEY,user_id uuid);
  CREATE TABLE resume_versions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),resume_id uuid,user_id uuid);
  CREATE TABLE job_queue(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,applied_by uuid);
  CREATE TABLE autofill_telemetry(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),portal text);
  CREATE TABLE saved_job_searches(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,filters jsonb NOT NULL);
  ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;ALTER TABLE autofill_telemetry ENABLE ROW LEVEL SECURITY;ALTER TABLE saved_job_searches ENABLE ROW LEVEL SECURITY;
  CREATE POLICY resume_versions_insert_own ON resume_versions FOR INSERT WITH CHECK (auth.uid()=user_id);
  CREATE POLICY job_queue_insert_own ON job_queue FOR INSERT WITH CHECK (auth.uid()=user_id);
  CREATE POLICY job_queue_update_own ON job_queue FOR UPDATE USING (auth.uid()=user_id);
  CREATE POLICY insert_telemetry ON autofill_telemetry FOR INSERT WITH CHECK (true);
  CREATE POLICY saved_search_owner ON saved_job_searches FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
  GRANT USAGE ON SCHEMA auth,public TO anon,authenticated;GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO anon,authenticated;
  INSERT INTO resumes VALUES('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),('22222222-2222-4222-8222-222222222222','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');`);
  await db.exec(fs.readFileSync('supabase/migrations/042_security_hardening.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/migrations/042_security_hardening.sql','utf8')); // idempotent
  const as=async(role,uid,sql,paid='1')=>{await db.exec(`SET ROLE ${role};SELECT set_config('app.uid','${uid}',false),set_config('app.paid','${paid}',false)`);try{return await db.exec(sql);}finally{await db.exec('RESET ROLE');}};
  const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  await as('authenticated',A,`INSERT INTO resume_versions(resume_id,user_id) VALUES('11111111-1111-4111-8111-111111111111','${A}')`);
  await assert.rejects(as('authenticated',A,`INSERT INTO resume_versions(resume_id,user_id) VALUES('22222222-2222-4222-8222-222222222222','${A}')`),/row-level security/);
  await assert.rejects(as('authenticated',A,`INSERT INTO job_queue(user_id,applied_by) VALUES('${A}','${A}')`),/permission denied/);
  await assert.rejects(as('authenticated',A,`UPDATE job_queue SET applied_by='${A}'`),/permission denied/);
  await assert.rejects(as('anon','',`INSERT INTO autofill_telemetry(portal) VALUES('x')`),/permission denied/);
  await as('authenticated',A,`INSERT INTO saved_job_searches(user_id,filters) VALUES('${A}','{"q":"dev"}')`);
  await assert.rejects(as('authenticated',A,`INSERT INTO saved_job_searches(user_id,filters) VALUES('${A}','{"q":"dev"}')`,'0'),/row-level security/);
  await assert.rejects(as('authenticated',A,`INSERT INTO saved_job_searches(user_id,filters) VALUES('${A}','${JSON.stringify({q:'x'.repeat(5000)})}')`),/saved_job_searches_filters_size/);
  }finally{await db.close();}
});

test('DOCX zip bombs and oversized archives are rejected before extraction',async()=>{
  const JSZip=require('jszip');
  const f=path.resolve('src/lib/ai/parsers/resume-parser.ts');const m=new Module(f,module);m.filename=f;m.paths=module.paths;m.require=n=>n.startsWith('@/')?{}:require(n);
  m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
  const logged=[];const orig=console.error;console.error=(...a)=>logged.push(a.join(' '));
  try{
  const bomb=new JSZip();bomb.file('word/document.xml','a'.repeat(60*1024*1024));
  const bombBuf=await bomb.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
  assert.ok(bombBuf.length<1024*1024);
  assert.equal(await m.exports.extractTextFromDOCX(bombBuf),'');
  const many=new JSZip();for(let i=0;i<501;i++)many.file(`word/f${i}.xml`,'x');
  assert.equal(await m.exports.extractTextFromDOCX(await many.generateAsync({type:'nodebuffer'})),'');
  assert.equal(logged.filter(l=>/too large to parse safely/.test(l)).length,2,logged.join('|'));
  }finally{console.error=orig;}
});
