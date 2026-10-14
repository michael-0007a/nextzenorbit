// Daily AI allowances (reset 00:00 GMT) and supervisor approval of extra allowance.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./test-admin-resume-exports.cjs');

// Chainable Supabase stand-in: every filter returns itself; awaiting resolves to the table's canned result.
function db(tables) {
  return { from(table) {
    const result = tables[table] || { data: null, error: null };
    const chain = new Proxy({}, { get: (_, key) => key === 'then' ? (ok, fail) => Promise.resolve(typeof result === 'function' ? result() : result).then(ok, fail) : () => chain });
    return chain;
  } };
}
const quota = ({ role = null, plan = null, used = 0, grants = [], missing = false } = {}) => loadSource('src/lib/ai/quota.ts', {
  '@/lib/account-access': { getAccountAccess: async () => ({ role, subscription: plan ? { plan_id: plan, status: 'active', current_period_end: new Date(Date.now() + 86_400_000).toISOString() } : null }) },
  '@/lib/supabase/admin': { createAdminClient: () => db({
    ai_usage_events: missing ? { count: null, error: { code: '42P01' } } : { count: used, error: null },
    ai_quota_requests: missing ? { data: null, error: { code: '42P01' } } : { data: grants, error: null },
  }) },
});

test('limits follow role and plan', () => {
  const { baseLimit } = quota();
  assert.deepEqual(['free', 'pro', 'elite'].map(plan => baseLimit('user', plan, 'rewrite')), [10, 15, 20], 'Silver / Gold / Elite rewrites');
  assert.equal(baseLimit('user', 'elite', 'cover_letter'), 30);
  assert.equal(baseLimit('user', 'elite', 'light'), 50);
  assert.deepEqual(['admin', 'supervisor_admin', 'super_admin'].map(role => baseLimit(role, null, 'rewrite')), [50, 150, 500]);
});

test('allowance counts today and adds supervisor-approved extra; day resets at 00:00 GMT', async () => {
  const { aiAllowance, utcDayStart } = quota({ role: 'admin', used: 50, grants: [{ extra: 25 }] });
  const allowance = await aiAllowance('admin-1', 'rewrite');
  assert.deepEqual([allowance.used, allowance.limit, allowance.remaining, allowance.canRequestMore], [50, 75, 25, true]);
  assert.equal(new Date(allowance.resetsAt).getUTCHours(), 0);
  assert.equal(utcDayStart(new Date('2026-10-15T23:59:00-05:00')).toISOString(), '2026-10-16T00:00:00.000Z', 'GMT day, not local day');
});

test('used-up allowance returns 429 with a clear message; admins can ask, clients are pointed to upgrades', async () => {
  const admin = await quota({ role: 'admin', used: 50 }).checkAiQuota('a', 'rewrite');
  assert.equal(admin.status, 429);
  const body = await admin.json();
  assert.equal(body.error.code, 'AI_QUOTA_EXCEEDED');
  assert.match(body.error.message, /all 50 resume generations for today.*00:00 GMT.*request more from a supervisor/);
  const client = await (await quota({ role: 'user', plan: 'pro', used: 15 }).checkAiQuota('c', 'rewrite')).json();
  assert.match(client.error.message, /all 15 resume generations.*Upgrade your plan/);
  assert.equal(await quota({ role: 'user', plan: 'pro', used: 14 }).checkAiQuota('c', 'rewrite'), null, 'one left still passes');
});

test('before migration 046 is applied, allowances are not enforced instead of blocking AI', async () => {
  assert.equal(await quota({ missing: true }).checkAiQuota('c', 'rewrite'), null);
});

test('only another supervisor can decide a request', async () => {
  const requestId = '44444444-4444-4444-8444-444444444444';
  const decide = (role, userId, requester = 'admin-1') => loadSource('src/app/api/admin/ai-quota/requests/[id]/route.ts', {
    '@/lib/admin/guards': { requireAdmin: async () => ({ userId, role }), isAuthError: v => v instanceof Response },
    '@/lib/supabase/admin': { createAdminClient: () => db({ ai_quota_requests: { data: { user_id: requester, id: requestId }, error: null } }) },
  }).POST(new Request('http://local', { method: 'POST', body: JSON.stringify({ decision: 'approved', extra: 25 }) }), { params: Promise.resolve({ id: requestId }) });
  assert.equal((await decide('admin', 'admin-2')).status, 403, 'admins cannot approve');
  assert.equal((await decide('supervisor_admin', 'sup-1', 'sup-1')).status, 403, 'no self-approval');
  assert.equal((await decide('supervisor_admin', 'sup-1')).status, 200);
});
