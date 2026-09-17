const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const { loadSource } = require('./test-admin-resume-exports.cjs');

process.env.PAYU_MERCHANT_KEY = 'test-key';
process.env.PAYU_MERCHANT_SALT = 'test-salt';
const payu = loadSource('src/lib/payments/payu.ts', {});
function callback(extra = {}) {
  const params = { key: 'test-key', txnid: 'txn-1', amount: '13999.00', productinfo: 'Subscription: free', firstname: 'Customer', email: 'test@example.com', status: 'success', mihpayid: 'pay-1', ...extra };
  const raw = `test-salt|${params.status}||||||${params.udf5 || ''}|${params.udf4 || ''}|${params.udf3 || ''}|${params.udf2 || ''}|${params.udf1 || ''}|${params.email}|${params.firstname}|${params.productinfo}|${params.amount}|${params.txnid}|${params.key}`;
  params.hash = crypto.createHash('sha512').update((params.additionalCharges ? params.additionalCharges + '|' : '') + raw).digest('hex');
  return params;
}
test('PayU signatures: standard, UDFs, additional charges, tampering and missing key', () => {
  for (const fields of [{}, { udf1: 'client', udf5: 'reviewed' }, { additionalCharges: '10.00' }]) {
    const params = callback(fields);
    assert.equal(payu.verifyPayUWebhook(params), true);
    assert.equal(payu.verifyPayUWebhook({ ...params, amount: '1.00' }), false);
    assert.equal(payu.verifyPayUWebhook({ ...params, key: 'other' }), false);
    assert.equal(payu.verifyPayUWebhook({ ...params, hash: 'invalid' }), false);
  }
});
test('Callback rejects forged payment and fails visibly when activation fails', async () => {
  let calls = 0;
  const route = loadSource('src/app/api/webhooks/payu/route.ts', {
    '@/lib/payments/payu': payu,
    '@/lib/supabase/admin': { createAdminClient: () => ({ rpc: async () => { calls++; return { error: new Error('database unavailable') }; } }) },
  });
  const request = params => new Request('https://example.com/api/webhooks/payu', { method: 'POST', body: new URLSearchParams(params) });
  assert.equal((await route.POST(request({ ...callback(), hash: '0'.repeat(128) }))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await route.POST(request(callback()))).status, 503);
  assert.equal(calls, 1);
});
test('Active means paid and unexpired; no trial or free fallback unlocks services', () => {
  const lib = loadSource('src/lib/subscription.ts', {});
  for (const sub of [null, {status:'trialing',trial_ends_at:'2099-01-01'}, {status:'active'}, {status:'active',current_period_end:'2020-01-01'}]) {
    assert.equal(lib.isSubscriptionActive(sub),false);
    assert.equal(lib.canCreateResume(sub,0),false);
    assert.equal(lib.canTrackApplication(sub,0),false);
  }
  assert.equal(lib.isSubscriptionActive({status:'active',current_period_end:'2099-01-01'}),true);
});
for (const schemaVersion of ['original', 'payu-existing']) test(`Payment SQL (${schemaVersion} schema): activation, retries and access gate`, async () => {
  const db = new PGlite();
  const uid = '00000000-0000-4000-8000-000000000001';
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA storage; CREATE TABLE storage.objects(bucket_id text);
      CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '${uid}'::uuid $$;
      GRANT USAGE ON SCHEMA auth TO authenticated;
      CREATE TABLE users(id uuid PRIMARY KEY,email text,role text,is_suspended boolean DEFAULT false);
      CREATE TABLE signup_applications(user_id uuid,status text,phone text);
      CREATE TABLE registration_blocks(kind text,value text);
      ${fs.readFileSync('supabase/migrations/001_initial_schema.sql','utf8').match(/CREATE TABLE subscriptions \([\s\S]*?\n\);/)[0]}
      CREATE TABLE resumes(id integer); ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
      GRANT SELECT ON resumes TO authenticated; CREATE POLICY own ON resumes FOR SELECT TO authenticated USING(true);
      INSERT INTO users VALUES('${uid}','test@example.com','user',false);
      INSERT INTO signup_applications VALUES('${uid}','approved','919999999999');
      INSERT INTO resumes VALUES(1);`);
    if (schemaVersion === 'payu-existing') {
      await db.exec("ALTER TABLE subscriptions ADD COLUMN payu_subscription_id text; ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_provider_check; ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_provider_check CHECK(provider IN ('razorpay','cashfree','payu'));");
    }
    // Preserve an existing provider record, without guessing a PayU transaction ID.
    await db.query("INSERT INTO subscriptions(user_id,provider,status) VALUES($1,'razorpay','paused')",[uid]);
    const migration = fs.readFileSync('supabase/migrations/035_payment_orders_and_access.sql','utf8');
    await db.exec(migration);
    assert.equal((await db.query('SELECT provider FROM subscriptions')).rows[0].provider,'razorpay');
    assert.equal((await db.query('SELECT * FROM payment_orders')).rows.length,0);
    // Recover from a retry even when earlier DDL already exists.
    await db.exec(migration);
    const access = async () => (await db.query('SELECT has_paid_service_access() AS allowed')).rows[0].allowed;
    assert.equal(await access(), false);
    await db.exec("SET ROLE authenticated");
    assert.equal((await db.query('SELECT * FROM resumes')).rows.length,0);
    await assert.rejects(db.query("SELECT complete_payu_payment('one',1399900,'pay-1')"), /permission denied/);
    await db.exec('RESET ROLE');
    await db.query("INSERT INTO payment_orders(txnid,user_id,plan_id,amount_paise,currency) VALUES('one',$1,'free',1399900,'INR'),('two',$1,'pro',1899900,'INR')",[uid]);
    await assert.rejects(db.query("SELECT complete_payu_payment('one',1,'pay-1')"), /do not match/);
    assert.equal(await access(), false);
    await db.query("SELECT complete_payu_payment('one',1399900,'pay-1')");
    assert.equal(await access(),true);
    const end = (await db.query('SELECT current_period_end FROM subscriptions')).rows[0].current_period_end;
    await db.query("SELECT complete_payu_payment('one',1399900,'pay-1')");
    assert.deepEqual((await db.query('SELECT current_period_end FROM subscriptions')).rows[0].current_period_end,end);
    await assert.rejects(db.query("SELECT complete_payu_payment('two',1899900,'pay-1')"), /unique/);
    assert.equal((await db.query("SELECT status FROM payment_orders WHERE txnid='two'")).rows[0].status,'pending');
    assert.equal((await db.query('SELECT plan_id FROM subscriptions')).rows[0].plan_id,'free');
    await db.query("SELECT complete_payu_payment('two',1899900,'pay-2')");
    assert.equal((await db.query('SELECT plan_id FROM subscriptions')).rows[0].plan_id,'pro');
    const beforeRetry = (await db.query('SELECT current_period_end FROM subscriptions')).rows[0].current_period_end;
    await db.exec(migration);
    assert.deepEqual((await db.query('SELECT current_period_end FROM subscriptions')).rows[0].current_period_end,beforeRetry);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM payment_orders')).rows[0].n,2);
    await db.exec('SET ROLE authenticated');
    assert.equal((await db.query('SELECT * FROM resumes')).rows.length,1);
    await db.exec('RESET ROLE');
    await db.exec("UPDATE signup_applications SET status='rejected'"); assert.equal(await access(),false);
    await db.exec("UPDATE signup_applications SET status='approved'; UPDATE subscriptions SET current_period_end=now()-interval '1 day'"); assert.equal(await access(),false);
    await db.exec("UPDATE users SET role='super_admin'"); assert.equal(await access(),true);
    await db.exec("UPDATE users SET is_suspended=true"); assert.equal(await access(),false);
  } finally { await db.close(); }
});

test('Unpaid API/page requests are blocked while approved checkout stays available', async () => {
  const { NextRequest, NextResponse } = require('next/server');
  for (const approved of [false,true]) {
    const proxy = loadSource('src/middleware.ts', {
      '@/lib/supabase/middleware': { updateSession: async () => ({ user: {id:'client'}, supabaseResponse: NextResponse.next() }) },
      '@/lib/onboarding': { getApplicationAccess: async () => approved ? 'approved' : 'pending' },
      '@/lib/service-access': { hasServiceAccess: async () => false },
    }).default;
    for (const path of ['/api/resumes','/api/cover-letter','/api/profile']) {
      assert.equal((await proxy(new NextRequest('https://example.com'+path))).status,approved?402:403);
    }
    const page = await proxy(new NextRequest('https://example.com/resumes'));
    assert.equal(new URL(page.headers.get('location')).pathname,approved?'/subscription':'/onboarding');
    const checkout = await proxy(new NextRequest('https://example.com/api/subscription/create'));
    assert.equal(checkout.status,approved?200:403);
  }
});

test('Admin upload parses and saves a selected source without a client subscription; empty files never create resumes', async () => {
  let stored = 0, inserted = 0, readable = true, aiAvailable = true, throwAi = false;
  let insertedContent;
  const content = { contact:{full_name:'Test Client',email:'client@example.com'}, summary:{text:'Experienced engineer with several successful projects.'} };
  const admin = {
    from(table) {
      const q = { select(){return q}, eq(){return q}, async maybeSingle(){return {data:{id:'client'}}}, insert(value){assert.equal(value.is_base,false); assert.ok(value.file_url.startsWith('resume-uploads/')); insertedContent=value.content; inserted++; return q}, async single(){return {data:{id:'source',title:'resume',content:insertedContent,template_id:'classic'}}} };
      return q;
    },
    storage: { from(bucket){assert.equal(bucket,'resume-uploads');return { async upload(){stored++;return {error:null}} }} },
  };
  const mocks = {
    '@/lib/admin/guards': { requireAdmin: async()=>({userId:'admin',role:'admin'}),isAuthError:r=>r instanceof Response },
    '@/lib/rate-limit': {rateLimit:async()=>null},
    '@/lib/supabase/admin': {createAdminClient:()=>admin},
    '@/lib/ai/parsers/resume-parser': {extractText:async()=>readable?'A professional resume with sufficient text for extraction and parsing.':'',parseResumeWithAI:async()=>{if(throwAi) throw new Error("Provider timeout"); return {content,parsedByAI:aiAvailable}}},
  };
  const route=loadSource('src/app/api/admin/resumes/upload/route.ts',mocks);
  const request=()=>{ const f=new FormData();f.set('userId','00000000-0000-4000-8000-000000000001');f.set('file',new File(['%PDF-resume'],'resume.pdf',{type:'application/pdf'}));return new Request('https://example.com/api/admin/resumes/upload',{method:'POST',body:f}); };
  assert.equal((await route.POST(request())).status,201);
  assert.equal(inserted,1);assert.equal(stored,1);
  aiAvailable=false;
  const fallbackResponse = await route.POST(request());
  assert.equal(fallbackResponse.status,201);
  const fallbackBody = await fallbackResponse.json();
  assert.equal(fallbackBody.data.parsedByAI,false);
  assert.match(fallbackBody.data.warning,/extracted text/);
  assert.equal(insertedContent.custom_sections[0].content,'A professional resume with sufficient text for extraction and parsing.');
  assert.deepEqual(insertedContent.experience,[]);
  throwAi=true;
  assert.equal((await route.POST(request())).status,201);
  assert.equal(inserted,3);assert.equal(stored,3);
  readable=false;
  assert.equal((await route.POST(request())).status,422);
  assert.equal(inserted,3);assert.equal(stored,3);
  const forbidden=loadSource('src/app/api/admin/resumes/upload/route.ts',{...mocks,'@/lib/admin/guards':{requireAdmin:async()=>new Response(null,{status:403}),isAuthError:r=>r instanceof Response}});
  assert.equal((await forbidden.POST(request())).status,403);
});

test('Reconciliation uses the owning account, exact reference and captured amount', async () => {
  let activations = 0;
  let payment = { status:'success',unmappedstatus:'captured',amt:'13999.00',mihpayid:'pay-1' };
  const filters = [];
  const q = { select(){return q},eq(key,value){filters.push([key,value]);return q},order(){return q},async limit(){return {data:[{txnid:'old-checkout',amount_paise:1399900}]}} };
  const reconcile = loadSource('src/lib/payments/reconcile.ts', {
    '@/lib/supabase/admin': {createAdminClient:()=>({from(){return q},rpc:async(name,args)=>{assert.equal(name,'complete_payu_payment');assert.equal(args.p_txnid,'old-checkout');activations++;return {error:null}}})},
    '@/lib/payments/payu': {verifyPayUTransaction:async()=>payment},
  }).reconcileUserPayments;
  assert.equal(await reconcile('owner','old-checkout'),1);
  assert.ok(filters.some(([k,v])=>k==='user_id'&&v==='owner'));
  assert.ok(filters.some(([k,v])=>k==='txnid'&&v==='old-checkout'));
  payment={...payment,amt:'1.00'};
  await assert.rejects(reconcile('owner'),/amount mismatch/);
  payment={...payment,status:'pending'};
  assert.equal(await reconcile('owner'),0);
  assert.equal(activations,1);
});
test('Admin recovery cannot manually activate a plan without a verified payment',async()=>{
  const route=loadSource('src/app/api/admin/subscription/activate/route.ts',{
    '@/lib/admin/guards':{requireAdmin:async()=>({userId:'admin'}),isAuthError:()=>false},
    '@/lib/rate-limit':{rateLimit:async()=>null},
    '@/lib/onboarding':{requireApprovedAccount:async()=>null},
    '@/lib/payments/reconcile':{reconcileUserPayments:async()=>0},
    '@/lib/supabase/admin':{createAdminClient:()=>{throw new Error('Must not grant access')}}
  });
  const response=await route.POST(new Request('https://example.com/api/admin/subscription/activate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:'00000000-0000-4000-8000-000000000001',plan_id:'elite',duration_days:365})}));
  assert.equal(response.status,409);
});


test('Extracted text fallback preserves text and flags schema-limit truncation', () => {
  const { resumeFromExtractedText } = loadSource('src/lib/resume/text-fallback.ts', {});
  const { parseExportContent } = loadSource('src/lib/resume/export-content.ts', {});
  const text = 'Career history and professional experience. '.repeat(100);
  const result = resumeFromExtractedText(text, {full_name:'Client',email:'client@example.com'});
  assert.equal(result.content.custom_sections.map(s=>s.content).join(''),text.trim());
  assert.equal(result.truncated,false);
  assert.equal(parseExportContent(result.content).success,true);
  const complete = resumeFromExtractedText('a'.repeat(18000));
  assert.equal(complete.truncated,false);
  assert.equal(complete.content.custom_sections.map(s=>s.content).join('').length,18000);
  const long = resumeFromExtractedText('a'.repeat(180000));
  assert.equal(long.truncated,true);
  assert.equal(long.content.custom_sections.length,50);
  assert.equal(parseExportContent(long.content).success,true);
});
