// node --test --test-isolation=none scripts/test-ai-features.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const { loadSource } = require('./test-admin-resume-exports.cjs');
const { fakeDb, fakeGroq } = require('./fake-supabase.cjs');

const me = '11111111-1111-4111-8111-111111111111';
const someoneElse = '22222222-2222-4222-8222-222222222222';
const resumeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const otherResume = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const content = {
  contact: { full_name: 'Asha Rao', email: 'asha@example.com' },
  summary: { text: 'Data analyst with 4 years of experience.' },
  experience: [{ id: 'e1', company: 'Acme', position: 'Data Analyst', start_date: '2021', bullets: ['Built dashboards', 'Cut report time 40%'] }],
  skills: [{ id: 's1', category: 'Tools', items: ['SQL', 'Python', 'Tableau'] }],
};

function routes({ replies, user = { id: me }, usage = { allowed: true }, quotaLeft = Infinity }) {
  const aiUses = [];
  const db = fakeDb({
    resumes: [{ id: resumeId, user_id: me, deleted_at: null, content }, { id: otherResume, user_id: someoneElse, deleted_at: null, content }],
    ai_usage: [], mock_interviews: [],
  });
  const groq = fakeGroq(replies);
  const mocks = {
    'groq-sdk': groq.module,
    '@/lib/supabase/admin': { createAdminClient: () => db },
    '@/lib/supabase/server': { getCachedUser: async () => ({ user }) },
    '@/lib/rate-limit': { rateLimit: async () => null },
    '@/lib/subscription-server': { checkAiTokenUsage: async () => usage },
    '@/lib/ai/quota': {
      checkAiQuota: async () => (aiUses.length >= quotaLeft ? new Response(null, { status: 429 }) : null),
      recordAiUse: async (userId, bucket) => { aiUses.push(bucket); },
    },
  };
  return {
    db, groq, aiUses,
    linkedin: loadSource('src/app/api/linkedin/optimize/route.ts', mocks),
    sessions: loadSource('src/app/api/mock-interviews/route.ts', mocks),
    session: loadSource('src/app/api/mock-interviews/[id]/route.ts', mocks),
    answer: loadSource('src/app/api/mock-interviews/[id]/answer/route.ts', mocks),
  };
}
const post = body => new Request('https://app.test/x', { method: 'POST', body: JSON.stringify(body) });
const params = id => ({ params: Promise.resolve({ id }) });

const profile = {
  headline: 'Data Analyst | SQL, Python, Tableau | Cut reporting time 40%',
  about: 'I am a data analyst with four years of experience turning messy data into decisions. '.repeat(3),
  skills: Array.from({ length: 20 }, (_, i) => `Skill ${i}`),
  experience: [{ company: 'Acme', position: 'Data Analyst', bullets: ['a', 'b', 'c', 'd'] }],
};

test('LinkedIn optimizer uses only the caller\'s resume and validates AI output', async () => {
  const ok = routes({ replies: [JSON.stringify(profile)] });
  const response = await ok.linkedin.POST(post({ resumeId, targetRole: 'Senior Data Analyst' }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.skills.length, 15);
  assert.equal(body.data.experience[0].bullets.length, 3);
  assert.equal(ok.db.tables.ai_usage[0].tokens_used, 100);
  const sent = JSON.parse(ok.groq.calls[0].messages[1].content);
  assert.equal(sent.target_role, 'Senior Data Analyst');
  assert.deepEqual(sent.skills, ['SQL', 'Python', 'Tableau']);
  assert.equal(ok.groq.calls[0].response_format.type, 'json_object');

  assert.equal((await routes({ replies: [] }).linkedin.POST(post({ resumeId: otherResume, targetRole: 'Analyst' }))).status, 404);
  assert.equal((await routes({ replies: [], user: null }).linkedin.POST(post({ resumeId, targetRole: 'Analyst' }))).status, 401);
  assert.equal((await routes({ replies: [] }).linkedin.POST(post({ resumeId, targetRole: 'x' }))).status, 400);
  assert.equal((await routes({ replies: [] }).linkedin.POST(post({ resumeId: 'nope', targetRole: 'Analyst' }))).status, 400);
  assert.equal((await routes({ replies: [], usage: { allowed: false, error: 'Limit' } }).linkedin.POST(post({ resumeId, targetRole: 'Analyst' }))).status, 403);
  assert.equal((await routes({ replies: ['not json'] }).linkedin.POST(post({ resumeId, targetRole: 'Analyst' }))).status, 502);
  assert.equal((await routes({ replies: [JSON.stringify({ ...profile, headline: 'x'.repeat(221) })] }).linkedin.POST(post({ resumeId, targetRole: 'Analyst' }))).status, 502);
  assert.equal((await routes({ replies: [new Error('provider down')] }).linkedin.POST(post({ resumeId, targetRole: 'Analyst' }))).status, 503);
});

const questions = ['Tell me about a time you handled a tough deadline.', 'How would you design a sales dashboard?', 'Describe a conflict with a colleague.', 'Explain a SQL window function you used.', 'What would you do if data looked wrong before a review?', 'Extra question that should be dropped.'];
const feedback = score => JSON.stringify({ score, strengths: ['Clear'], gaps: ['Add numbers'], improved_answer: 'In my last role I [placeholder] and improved results.' });

test('Mock interview: start, answer every question, finish with an overall score', async () => {
  const r = routes({ replies: [JSON.stringify({ questions }), feedback(5), feedback(4), feedback(3), feedback(4), feedback(4)] });
  const started = await r.sessions.POST(post({ role: 'Data Analyst', jobDescription: 'SQL heavy role' }));
  assert.equal(started.status, 201);
  const session = (await started.json()).data;
  assert.equal(session.questions.length, 5);
  assert.equal(session.user_id, me);

  let last;
  for (let index = 0; index < 5; index++) {
    const res = await r.answer.POST(post({ index, answer: `Answer ${index}` }), params(session.id));
    assert.equal(res.status, 200, `answer ${index}`);
    last = (await res.json()).data;
    assert.equal(last.completed_at ? 'done' : 'open', index === 4 ? 'done' : 'open');
  }
  assert.equal(last.overall, 80);
  assert.equal(last.answers[0].score, 5);
  assert.equal((await r.answer.POST(post({ index: 0, answer: 'again' }), params(session.id))).status, 409);

  const list = await (await r.sessions.GET()).json();
  assert.deepEqual(list.data.map(s => s.overall), [80]);
  assert.equal(r.aiUses.length, 6, 'start + 5 scored answers each count as one light AI use');
});

test('Mock interview answers stop at the daily AI allowance', async () => {
  const r = routes({ replies: [JSON.stringify({ questions }), feedback(5)], quotaLeft: 2 });
  const session = (await (await r.sessions.POST(post({ role: 'Analyst' }))).json()).data;
  assert.equal((await r.answer.POST(post({ index: 0, answer: 'one' }), params(session.id))).status, 200);
  assert.equal((await r.answer.POST(post({ index: 1, answer: 'two' }), params(session.id))).status, 429);
  assert.equal(r.groq.calls.length, 2, 'no model call once the allowance is used up');
  assert.deepEqual(r.aiUses, ['light', 'light']);
});

test('Mock interview sessions are private and inputs are validated', async () => {
  const r = routes({ replies: [JSON.stringify({ questions })] });
  const session = (await (await r.sessions.POST(post({ role: 'Analyst' }))).json()).data;
  r.db.tables.mock_interviews.push({ ...session, id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', user_id: someoneElse });

  assert.equal((await r.session.GET(new Request('https://app.test/x'), params('cccccccc-cccc-4ccc-8ccc-cccccccccccc'))).status, 404);
  assert.equal((await r.answer.POST(post({ index: 0, answer: 'hi' }), params('cccccccc-cccc-4ccc-8ccc-cccccccccccc'))).status, 404);
  assert.equal((await r.session.GET(new Request('https://app.test/x'), params(session.id))).status, 200);
  assert.equal((await r.answer.POST(post({ index: 7, answer: 'hi' }), params(session.id))).status, 400);
  assert.equal((await r.answer.POST(post({ index: 0, answer: '   ' }), params(session.id))).status, 400);
  assert.equal((await r.sessions.POST(post({ role: 'A' }))).status, 400);
  assert.equal((await routes({ replies: [], user: null }).sessions.GET()).status, 401);
  assert.equal((await routes({ replies: [JSON.stringify({ questions: ['too few'] })] }).sessions.POST(post({ role: 'Analyst' }))).status, 502);
});

test('mock_interviews migration is server-only with sane constraints', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE TABLE users(id uuid PRIMARY KEY);INSERT INTO users VALUES('${me}');`);
    await db.exec(fs.readFileSync('supabase/migrations/045_mock_interviews.sql', 'utf8'));
    await db.query(`INSERT INTO mock_interviews(user_id,role,questions) VALUES($1,'Analyst','["q1"]')`, [me]);
    await assert.rejects(db.query(`INSERT INTO mock_interviews(user_id,role,questions) VALUES($1,'A','["q1"]')`, [me]), /check/);
    await assert.rejects(db.query(`INSERT INTO mock_interviews(user_id,role,questions) VALUES($1,'Analyst','{}')`, [me]), /check/);
    await assert.rejects(db.query(`INSERT INTO mock_interviews(user_id,role,questions,overall) VALUES($1,'Analyst','["q"]',101)`, [me]), /check/);
    await db.exec('SET ROLE authenticated');
    await assert.rejects(db.query('SELECT * FROM mock_interviews'), /permission denied/);
  } finally { await db.close(); }
});
