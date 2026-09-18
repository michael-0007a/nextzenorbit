const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('fs');const {PGlite}=require('@electric-sql/pglite');const {loadSource}=require('./test-admin-resume-exports.cjs');
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const {onboardingProfileSchema}=loadSource('src/lib/validations/onboarding.ts',{});
const basic={full_name:'Example Applicant',email:'applicant@example.com',phone:'+15551234567',target_country:'in',preferred_role:'Engineer',experience_range:'3–5 years',eeo:{acknowledged:true},consent:true};
const immigration={authorized:'yes',sponsorship:'yes',status:'F-1 OPT',cpt_required:'no',stem_degree:'yes',held_h1b:'no',held_j1:'no',i140_filed:'no',future_sponsorship:'yes',certified:true};
test('India skips immigration, optional fields stay optional, EEO acknowledgment remains required',()=>{const parsed=onboardingProfileSchema.parse({...basic,immigration:{private:'discard'}});assert.equal(parsed.immigration,null);assert.equal(parsed.work_authorization,null);assert.equal(parsed.salary_currency,'INR');assert.equal(parsed.location,'');assert.equal(onboardingProfileSchema.safeParse({...basic,eeo:{}}).success,false);});
test('US conditional visa answers and certification are enforced',()=>{assert.equal(onboardingProfileSchema.safeParse({...basic,target_country:'us'}).success,false);const us={...basic,target_country:'us',immigration};assert.equal(onboardingProfileSchema.safeParse(us).success,true);for(const changes of [{cpt_required:undefined},{stem_degree:undefined},{held_j1:'yes'},{status:'Other'},{certified:false}])assert.equal(onboardingProfileSchema.safeParse({...us,immigration:{...immigration,...changes}}).success,false);assert.equal(onboardingProfileSchema.safeParse({...us,immigration:{...immigration,status:'U.S. Citizen',cpt_required:undefined,stem_degree:undefined}}).success,true);});
test('Other countries require neutral authorization answers; inactive sensitive fields are removed',()=>{const parsed=onboardingProfileSchema.parse({...basic,target_country:'gb',immigration,work_authorization:{authorized:'yes',sponsorship:'no',certified:true}});assert.equal(parsed.immigration,null);assert.equal(parsed.salary_currency,'GBP');assert.equal(onboardingProfileSchema.safeParse({...basic,target_country:'other'}).success,false);});
test('EEO prefer-not-to-say cannot conflict with other ethnicities and invalid dates are rejected',()=>{assert.equal(onboardingProfileSchema.safeParse({...basic,eeo:{acknowledged:true,ethnicity:['Asian','Prefer not to say']}}).success,false);assert.equal(onboardingProfileSchema.safeParse({...basic,preferred_start_date:'2026-02-31'}).success,false);});

test('Expanded onboarding migration stores professional, immigration and demographic data separately',async()=>{const db=new PGlite();try{await db.exec(`
CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE SCHEMA storage;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT null::uuid';GRANT USAGE ON SCHEMA auth TO authenticated;
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,phone text,phone_confirmed_at timestamptz);
CREATE TABLE users(id uuid PRIMARY KEY,email text,role text DEFAULT 'user',is_suspended boolean DEFAULT false);
CREATE TABLE profiles(user_id uuid PRIMARY KEY REFERENCES users(id),full_name text,phone text,headline text,location text,preferred_role text,preferred_location text,preferred_work_type text,years_of_experience integer,linkedin_url text,has_agreed_to_terms boolean,preferred_salary_min integer,preferred_salary_max integer,preferred_portals text[]);
CREATE TABLE resumes(id uuid DEFAULT gen_random_uuid(),user_id uuid REFERENCES users(id),title text,content jsonb,is_base boolean,template_id text);
CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);CREATE TABLE storage.objects(bucket_id text,name text);`);
await db.exec(fs.readFileSync('supabase/migrations/033_signup_review.sql','utf8'));await db.exec(fs.readFileSync('supabase/migrations/036_expanded_onboarding.sql','utf8'));
await db.query('INSERT INTO auth.users(id,email) VALUES($1,$2)',[id(1),basic.email]);await db.query('INSERT INTO users(id,email) VALUES($1,$2)',[id(1),basic.email]);await db.query('INSERT INTO storage.objects VALUES($1,$2)',['signup-resumes',`${id(1)}/resume.pdf`]);
const payload=onboardingProfileSchema.parse({...basic,target_country:'us',immigration,eeo:{acknowledged:true,gender:'Female'}});
await db.query('SELECT submit_signup_application($1,$2,$3,$4,$5,$6)',[id(1),JSON.stringify(payload),`${id(1)}/resume.pdf`,'resume.pdf','{}','2026-09-17']);
const profile=(await db.query('SELECT profile FROM signup_applications')).rows[0].profile;assert.equal(profile.immigration,undefined);assert.equal(profile.eeo,undefined);assert.equal(profile.experience_range,basic.experience_range);
assert.equal((await db.query('SELECT answers FROM candidate_self_identification')).rows[0].answers.gender,'Female');assert.equal((await db.query('SELECT country FROM candidate_work_authorization')).rows[0].country,'us');
await db.exec('SET ROLE authenticated');assert.equal((await db.query('SELECT * FROM candidate_self_identification')).rows.length,0);await db.exec('RESET ROLE');
assert.equal((await db.query("SELECT file_size_limit FROM storage.buckets WHERE id='signup-resumes'")).rows[0].file_size_limit,10485760);
}finally{await db.close();}});

test('Job catalog and queue migration preserves history and enforces atomic deduplication and resume ownership',async()=>{const db=new PGlite();try{await db.exec(`
CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT null::uuid';
CREATE TABLE users(id uuid PRIMARY KEY,role text,is_suspended boolean DEFAULT false);CREATE TABLE profiles(user_id uuid,assigned_admin_id uuid);
CREATE TABLE resumes(id uuid PRIMARY KEY,user_id uuid,deleted_at timestamptz);CREATE TABLE admin_resumes(id uuid PRIMARY KEY,user_id uuid,expires_at timestamptz);
CREATE TABLE jobs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company text,title text,description text,location text,apply_url text,source text,source_ref text,created_at timestamptz DEFAULT now());CREATE UNIQUE INDEX jobs_source_ref ON jobs(source,source_ref) WHERE source_ref IS NOT NULL;
CREATE TABLE job_queue(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,title text,company text,job_url text,location text,salary_text text,description text,source text,status text,resume_id uuid,assigned_to uuid,assigned_at timestamptz,created_at timestamptz DEFAULT now());
INSERT INTO users(id,role) VALUES('${id(1)}','user'),('${id(2)}','admin');INSERT INTO profiles VALUES('${id(1)}','${id(2)}');
INSERT INTO resumes VALUES('${id(3)}','${id(1)}',NULL),('${id(4)}','${id(2)}',NULL);
INSERT INTO job_queue(user_id,title,job_url,status) VALUES('${id(1)}','Old job','https://example.com/old','applied'),('${id(1)}','Old job','https://example.com/old','pending');`);
await db.exec(fs.readFileSync('supabase/migrations/037_job_search_workspace.sql','utf8'));assert.equal((await db.query('SELECT * FROM job_queue')).rows.length,2);
const job={id:'provider1',title:'Engineer',company:'Example',job_url:'https://example.com/new',country:'us',description:'Python services'};
const stored=(await db.query('SELECT store_job_results($1) AS jobs',[JSON.stringify([job])])).rows[0].jobs;
const again=(await db.query('SELECT store_job_results($1) AS jobs',[JSON.stringify([job])])).rows[0].jobs;assert.equal(stored[0].catalog_id,again[0].catalog_id);
const enqueue=()=>db.query('SELECT enqueue_search_jobs($1,$2,$3,$4,$5) AS result',[id(1),id(2),JSON.stringify(stored),id(3),null]);
const first=await enqueue();const second=await enqueue();assert.equal(first.rows[0].result.added,1);assert.equal(second.rows[0].result.added,0);assert.equal((await db.query('SELECT * FROM job_queue')).rows.length,3);
await assert.rejects(db.query('SELECT enqueue_search_jobs($1,$2,$3,$4,$5)',[id(1),id(2),JSON.stringify(stored),id(4),null]));
await assert.rejects(db.query("INSERT INTO job_queue(user_id,title,job_url) VALUES($1,'Duplicate',$2)",[id(1),job.job_url]));
}finally{await db.close();}});
