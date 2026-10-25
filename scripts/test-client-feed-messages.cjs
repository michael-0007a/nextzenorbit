// node --test --test-isolation=none scripts/test-client-feed-messages.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const { loadSource } = require('./test-admin-resume-exports.cjs');
const { fakeDb } = require('./fake-supabase.cjs');

const client = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const staff = '33333333-3333-4333-8333-333333333333';
const stranger = '44444444-4444-4444-8444-444444444444';

test('client_activity returns only this client\'s team work, newest first, with staff first names', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
      CREATE TABLE users(id uuid PRIMARY KEY);
      CREATE TABLE profiles(user_id uuid PRIMARY KEY,full_name text);
      CREATE TABLE job_queue(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,title text,company text,status text,applied_by uuid,applied_at timestamptz);
      CREATE TABLE admin_resumes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,admin_id uuid,job_title text,company text,title text,created_at timestamptz);
      CREATE TABLE admin_cover_letters(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,admin_id uuid,job_title text,company_name text,title text,created_at timestamptz);
      INSERT INTO profiles VALUES('${staff}','  Priya   Sharma ');
      INSERT INTO job_queue(user_id,title,company,status,applied_by,applied_at) VALUES
       ('${client}','Backend Engineer','Acme','applied','${staff}',now()-interval '1 day'),
       ('${client}','Pending Role','Acme','pending','${staff}',NULL),
       ('${other}','Other Client Role','Beta','applied','${staff}',now());
      INSERT INTO admin_resumes(user_id,admin_id,job_title,company,title,created_at) VALUES
       ('${client}','${staff}','','Acme','Admin Generated Resume',now()-interval '10 days'),
       ('${other}','${staff}','Hidden','Beta','x',now());
      INSERT INTO admin_cover_letters(user_id,admin_id,job_title,company_name,title,created_at) VALUES
       ('${client}','${stranger}','Data Analyst','Gamma','Cover',now()-interval '2 hours');`);
    await db.exec(fs.readFileSync('supabase/migrations/043_client_activity_feed.sql', 'utf8'));

    const { rows } = await db.query('SELECT * FROM client_activity($1)', [client]);
    assert.deepEqual(rows.map(r => [r.kind, r.title, r.detail, r.actor_name]), [
      ['cover_letter', 'Data Analyst', 'Gamma', null],
      ['applied', 'Backend Engineer', 'Acme', 'Priya'],
      ['resume', 'Admin Generated Resume', 'Acme', 'Priya'],
    ]);
    const page = await db.query('SELECT * FROM client_activity($1,$2,1)', [client, rows[0].happened_at]);
    assert.deepEqual(page.rows.map(r => r.kind), ['applied']);
    assert.equal((await db.query('SELECT * FROM client_activity($1,NULL,0)', [client])).rows.length, 1);

    const week = (await db.query(`SELECT client_activity_summary($1,now()-interval '7 days') AS s`, [client])).rows[0].s;
    assert.deepEqual(week, { applied: 1, resumes: 0, cover_letters: 1 });

    await db.exec('SET ROLE authenticated');
    await assert.rejects(db.query('SELECT * FROM client_activity($1)', [client]), /permission denied/);
    await assert.rejects(db.query('SELECT client_activity_summary($1,now())', [client]), /permission denied/);
  } finally { await db.close(); }
});

test('client_messages is server-only and rejects empty or oversized bodies', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE TABLE users(id uuid PRIMARY KEY);INSERT INTO users VALUES('${client}');`);
    await db.exec(fs.readFileSync('supabase/migrations/044_client_messages.sql', 'utf8'));
    await db.query('INSERT INTO client_messages(client_id,sender_id,from_team,body) VALUES($1,$1,false,$2)', [client, 'Hello team']);
    await assert.rejects(db.query('INSERT INTO client_messages(client_id,sender_id,from_team,body) VALUES($1,$1,false,$2)', [client, '   ']), /check/);
    await assert.rejects(db.query('INSERT INTO client_messages(client_id,sender_id,from_team,body) VALUES($1,$1,false,$2)', [client, 'x'.repeat(4001)]), /check/);
    await db.exec('SET ROLE authenticated');
    await assert.rejects(db.query('SELECT * FROM client_messages'), /permission denied/);
  } finally { await db.close(); }
});

function setup({ viewer = { id: client }, admin = { userId: staff, role: 'admin', email: 's@x' }, assigned = true } = {}) {
  const db = fakeDb({
    users: [{ id: client, role: 'user' }, { id: staff, role: 'admin' }],
    client_admin_assignments: assigned ? [{ user_id: client, admin_id: staff }] : [],
    client_messages: [], notifications: [],
  });
  const mocks = {
    '@/lib/supabase/admin': { createAdminClient: () => db },
    '@/lib/supabase/server': { getCachedUser: async () => ({ user: viewer }) },
    '@/lib/rate-limit': { rateLimit: async () => null },
    '@/lib/admin/guards': { requireAdmin: async () => admin, isAuthError: r => r instanceof Response },
  };
  return {
    db,
    clientRoute: loadSource('src/app/api/messages/route.ts', mocks),
    staffRoute: loadSource('src/app/api/admin/users/[id]/messages/route.ts', mocks),
    inbox: loadSource('src/app/api/admin/messages/route.ts', mocks),
  };
}
const post = body => new Request('https://app.test/x', { method: 'POST', body: JSON.stringify(body) });
const params = id => ({ params: Promise.resolve({ id }) });

test('Client and assigned team share one thread; read state and notifications follow', async () => {
  const { db, clientRoute, staffRoute, inbox } = setup();
  assert.equal((await clientRoute.POST(post({ body: '  Please skip service companies  ' }))).status, 201);
  assert.deepEqual(db.tables.client_messages.map(m => [m.client_id, m.sender_id, m.from_team, m.body]), [[client, client, false, 'Please skip service companies']]);

  const unread = await (await inbox.GET()).json();
  assert.deepEqual(unread.data.map(t => [t.client_id, t.unread]), [[client, 1]]);

  const staffView = await (await staffRoute.GET(new Request('https://admin.test/x'), params(client))).json();
  assert.equal(staffView.data.length, 1);
  assert.ok(db.tables.client_messages[0].read_at, 'team reading marks client message read');
  assert.equal((await (await inbox.GET()).json()).data.length, 0);

  assert.equal((await staffRoute.POST(post({ body: 'Noted!' }), params(client))).status, 201);
  assert.equal(db.tables.notifications.length, 1);
  assert.equal(db.tables.notifications[0].user_id, client);

  const clientView = await (await clientRoute.GET()).json();
  assert.deepEqual(clientView.data.map(m => m.body), ['Please skip service companies', 'Noted!']);
  assert.ok(db.tables.client_messages[1].read_at);
});

test('Message routes reject strangers, unassigned admins, non-clients and bad bodies', async () => {
  const anon = setup({ viewer: null });
  assert.equal((await anon.clientRoute.GET()).status, 401);
  assert.equal((await anon.clientRoute.POST(post({ body: 'hi' }))).status, 401);

  const { clientRoute, staffRoute } = setup();
  assert.equal((await clientRoute.POST(post({ body: '   ' }))).status, 400);
  assert.equal((await clientRoute.POST(post({ body: 'x'.repeat(4001) }))).status, 400);
  assert.equal((await clientRoute.POST(new Request('https://app.test/x', { method: 'POST', body: 'not json' }))).status, 400);
  assert.equal((await staffRoute.GET(new Request('https://admin.test/x'), params('not-a-uuid'))).status, 400);
  assert.equal((await staffRoute.GET(new Request('https://admin.test/x'), params(staff))).status, 403, 'staff account is not assigned as a client');

  const unassigned = setup({ assigned: false });
  assert.equal((await unassigned.staffRoute.GET(new Request('https://admin.test/x'), params(client))).status, 403);
  assert.equal((await unassigned.staffRoute.POST(post({ body: 'hi' }), params(client))).status, 403);
  assert.equal((await (await unassigned.inbox.GET()).json()).data.length, 0);

  const supervisor = setup({ admin: { userId: stranger, role: 'supervisor_admin', email: 'x' }, assigned: false });
  assert.equal((await supervisor.staffRoute.GET(new Request('https://admin.test/x'), params(client))).status, 200);
  assert.equal((await supervisor.staffRoute.GET(new Request('https://admin.test/x'), params(staff))).status, 404, 'staff accounts have no client thread');

  const notAdmin = setup({ admin: new Response(null, { status: 403 }) });
  assert.equal((await notAdmin.staffRoute.GET(new Request('https://admin.test/x'), params(client))).status, 403);
  assert.equal((await notAdmin.inbox.GET()).status, 403);
});
