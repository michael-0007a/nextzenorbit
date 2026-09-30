const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const {PGlite}=require('@electric-sql/pglite');
function load(file){const filename=path.resolve(file);const m=new Module(filename,module);m.filename=filename;m.paths=module.paths;m.require=name=>name.startsWith('@/')?load('src/'+name.slice(2)+'.ts'):require(name);m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);return m.exports;}
const {splitMonthlyTarget,buildTargetReport}=load('src/lib/admin/targets.ts');
const ids=Array.from({length:7},(_,i)=>`${i+1}1111111-1111-4111-8111-111111111111`),[supervisor,a,b,client,other,outsider,suspended]=ids;
function source(plan='free',date='2026-09-01'){return {date,clients:[{id:client,name:'Client',plan,active:true,team:[{id:a,name:'Bhavana'},{id:b,name:'Other admin'}],counts:[]}]};}
test('Plan-based equal targets match 300 / 2 = 150 monthly, 38 weekly, 8 daily',()=>{for(const [plan,target,week,day] of [['free',150,38,8],['pro',200,50,10],['elite',250,63,13]]){const r=buildTargetReport(source(plan));assert.deepEqual(r.clients[0].members.map(a=>[a.monthly,a.weekly,a.daily]),[[target,week,day],[target,week,day]]);}});
test('Remainders conserve totals, deterministic order, zero members',()=>{assert.deepEqual(splitMonthlyTarget(5,['c','a','b','a']),[{id:'a',target:2},{id:'b',target:2},{id:'c',target:1}]);assert.deepEqual(splitMonthlyTarget(300,[]),[]);for(let n=1;n<=50;n++){const split=splitMonthlyTarget(300,Array.from({length:n},(_,i)=>String(i)));assert.equal(split.reduce((s,r)=>s+r.target,0),300);assert.ok(Math.max(...split.map(r=>r.target))-Math.min(...split.map(r=>r.target))<=1);}});
test('Warnings respect weekends, completed monthly budgets, historical credit and inactive plans',()=>{const s=source('free','2026-09-05');assert.equal(buildTargetReport(s).clients[0].members[0].todayRemaining,0);s.date='2026-09-07';s.clients[0].counts=[{adminId:a,month:149,week:2,day:0},{adminId:null,month:150,week:0,day:0}];let r=buildTargetReport(s).clients[0];assert.equal(r.uncredited,150);assert.equal(r.members[0].todayRemaining,1);assert.equal(r.members[1].todayRemaining,1);s.clients[0].counts[0].month=150;r=buildTargetReport(s).clients[0];assert.ok(r.members.every(a=>a.todayRemaining===0&&!a.behind));s.clients[0].active=false;assert.equal(buildTargetReport(s).clients[0].monthly,0);});
test('Database membership, ownership, access, report totals, allocation audit and concurrent-safe completion',async()=>{
const db=new PGlite();try{
await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
CREATE TABLE users(id uuid PRIMARY KEY,role text,is_suspended boolean DEFAULT false,email text);
CREATE TABLE profiles(user_id uuid PRIMARY KEY,assigned_admin_id uuid,full_name text);
CREATE TABLE subscriptions(user_id uuid,plan_id text,status text,current_period_end timestamptz,trial_ends_at timestamptz,created_at timestamptz DEFAULT now());
CREATE TABLE jobs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company text,title text,description text,location text,apply_url text,source text,source_ref text);
CREATE UNIQUE INDEX jobs_source_ref ON jobs(source,source_ref) WHERE source_ref IS NOT NULL;
CREATE TABLE resumes(id uuid PRIMARY KEY,user_id uuid,deleted_at timestamptz);
CREATE TABLE admin_resumes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,admin_id uuid,title text,content jsonb,template_id text,job_title text,company text,job_description text,expires_at timestamptz DEFAULT now()+interval '30 days');
CREATE TABLE admin_cover_letters(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,admin_id uuid,title text,content text,job_title text,company_name text,expires_at timestamptz DEFAULT now()+interval '30 days');
CREATE TABLE job_queue(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,title text,company text,job_url text,location text,salary_text text,description text,source text,status text,resume_id uuid,assigned_to uuid,assigned_at timestamptz,claimed_by uuid,applied_at timestamptz,admin_notes text,created_at timestamptz DEFAULT now());
INSERT INTO users(id,role,email) VALUES('${supervisor}','supervisor_admin','s@test'),('${a}','admin','a@test'),('${b}','admin','b@test'),('${client}','user','client@test'),('${other}','user','other@test'),('${outsider}','admin','x@test'),('${suspended}','admin','suspended@test');
UPDATE users SET is_suspended=true WHERE id='${suspended}';
INSERT INTO profiles VALUES('${client}','${a}','Client');
INSERT INTO subscriptions(user_id,plan_id,status,current_period_end) VALUES('${client}','free','active',now()+interval '30 days');
INSERT INTO job_queue(user_id,title,job_url,status,claimed_by,assigned_to,applied_at) VALUES('${client}','Historical','https://jobs.test/old','applied','${a}','${a}',now());`);
for(const name of ['037_job_search_workspace','038_admin_document_workspace','039_shared_client_assignments'])await db.exec(fs.readFileSync('supabase/migrations/'+name+'.sql','utf8'));
const assign=(actor,admins)=>db.query('SELECT assign_client_admins($1,$2,$3)',[actor,client,admins]);
const report=async(actor)=>(await db.query('SELECT client_target_report($1) AS report',[actor])).rows[0].report;
assert.equal((await db.query('SELECT * FROM client_admin_assignments')).rows.length,1);
await assert.rejects(assign(a,[a,b]),/Supervisor required/);await assert.rejects(assign(supervisor,[a,suspended]),/active admins/);
await assign(supervisor,[a,b,b]);assert.equal((await report(b)).clients.length,1);assert.equal((await report(outsider)).clients.length,0);assert.equal((await report(supervisor)).clients.length,2);
assert.equal((await db.query("SELECT applied_by FROM job_queue WHERE status='applied'")).rows[0].applied_by,null);
const queued=await db.query('SELECT enqueue_search_jobs($1,$2,$3) AS result',[client,b,JSON.stringify([{title:'New job',company:'Acme',job_url:'https://jobs.test/new'}])]);const job=queued.rows[0].result.jobs[0];
await assert.rejects(db.query('SELECT enqueue_search_jobs($1,$2,$3)',[client,outsider,JSON.stringify([{title:'X',job_url:'https://jobs.test/x'}])]),/Client not assigned/);
const change=(actor,status=null,action=null)=>db.query('SELECT update_team_queue_job($1,$2,$3,$4) AS result',[actor,job.id,status,action]);
await assert.rejects(change(a,'applied'),/owned by another/);await assert.rejects(change(outsider,'applied'),/Client not assigned/);
await change(b,null,'unclaim');await change(a,null,'claim');await assert.rejects(change(b,null,'claim'),/owned by another/);
const done=(await change(a,'applied')).rows[0].result;await change(b,'applied');const repeated=(await db.query('SELECT applied_by,applied_at FROM job_queue WHERE id=$1',[job.id])).rows[0];assert.equal(repeated.applied_by,a);assert.equal(new Date(repeated.applied_at).toISOString(),new Date(done.applied_at).toISOString());await assert.rejects(change(a,'pending'),/cannot be reopened/);
await db.query('SELECT save_admin_document($1,$2,$3,$4,$5,$6)',['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',b,'resume','Shared draft','{"resume":{},"templateId":"classic"}',client]);
let r=await report(a);assert.equal(r.clients[0].team.length,2);assert.equal(r.clients[0].counts.reduce((sum,c)=>sum+c.month,0),2);
await assign(supervisor,[b]);assert.equal((await report(a)).clients.length,0);assert.equal((await db.query('SELECT applied_by FROM job_queue WHERE id=$1',[job.id])).rows[0].applied_by,a);await assert.rejects(change(a,'applied'),/Client not assigned/);
assert.equal((await db.query('SELECT * FROM client_assignment_history')).rows.length,2);
await db.exec('SET ROLE authenticated');await assert.rejects(report(b),/permission denied/);await assert.rejects(assign(supervisor,[a]),/permission denied/);await db.exec('RESET ROLE');
// Validate report aggregation beyond the Supabase default 1,000-row cap.
await db.exec(`INSERT INTO job_queue(user_id,title,job_url,status,applied_by,applied_at) SELECT '${client}','Bulk','https://jobs.test/bulk/'||g,'applied','${b}',now() FROM generate_series(1,1005) g;`);
r=await report(b);assert.equal(r.clients[0].counts.find(c=>c.adminId===b).month,1005);
}finally{await db.close();}
});
