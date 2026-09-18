// node --test --test-isolation=none scripts/test-onboarding.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./test-admin-resume-exports.cjs');

const viewer = { id: '11111111-1111-4111-8111-111111111111', email: 'Client@Example.com' };
function accessMocks({ status = null, role = 'user', suspended = false, blocked = false, failure = false } = {}) {
  return { '@/lib/supabase/admin': { createAdminClient: () => ({
    auth: { admin: { getUserById: async () => ({ data: { user: viewer } }) } },
    from(table) {
      const result = { data: table === 'users' ? { role, is_suspended: suspended } : table === 'registration_blocks' ? (blocked ? [{ kind: 'phone' }] : []) : (status ? { status } : null), error: failure ? new Error('Database unavailable') : null };
      const query = { select() { return query; }, eq() { return query; }, in() { return query; }, limit() { return Promise.resolve(result); }, maybeSingle() { return Promise.resolve(result); } };
      return query;
    },
  }) } };
}

for (const status of [null, 'pending', 'approved', 'rejected']) {
  test(`Account access for ${status || 'new'} applicant`, async () => {
    const module = loadSource('src/lib/onboarding.ts', accessMocks({ status }));
    assert.equal(await module.getApplicationAccess(viewer), status || 'draft');
    const denied = await module.requireApprovedAccount(viewer.id);
    assert.equal(denied?.status || 200, status === 'approved' ? 200 : 403);
  });
}
for (const role of ['admin', 'supervisor_admin', 'super_admin', 'sso_user']) {
  test(`${role} retains existing access; suspension overrides it`, async () => {
    assert.equal(await loadSource('src/lib/onboarding.ts', accessMocks({ role })).getApplicationAccess(viewer), 'approved');
    assert.equal(await loadSource('src/lib/onboarding.ts', accessMocks({ role, suspended: true })).getApplicationAccess(viewer), 'rejected');
  });
}
test('Blocked identity overrides approval', async () => {
  assert.equal(await loadSource('src/lib/onboarding.ts', accessMocks({ blocked: true, status: 'approved' })).getApplicationAccess(viewer), 'rejected');
});
test('Database failure never unlocks account', async () => {
  await assert.rejects(loadSource('src/lib/onboarding.ts', accessMocks({ failure: true })).getApplicationAccess(viewer));
});

for (const route of ['src/app/api/payments/create-order/route.ts', 'src/app/api/subscription/create/route.ts']) {
  test(`${route}: approval checked before provider call`, async () => {
    let providerCalled = false;
    const { POST } = loadSource(route, {
      '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: viewer } }) } }) },
      '@/lib/supabase/admin': { createAdminClient: () => { throw new Error('Unexpected database write'); } },
      '@/lib/onboarding': { requireApprovedAccount: async () => new Response('Approval required', { status: 403 }) },
      '@/lib/rate-limit': { rateLimit: async () => null },
      '@/lib/payments': { getPaymentProvider: () => { providerCalled = true; throw new Error('Unexpected checkout'); } },
      '@/services/subscription-service': {},
    });
    const response = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ plan: 'pro', planId: 'pro' }) }));
    assert.equal(response.status, 403);
    assert.equal(providerCalled, false);
  });
}

for (const role of ['admin', 'supervisor_admin', 'super_admin']) {
  test(`Review endpoint permissions: ${role}`, async () => {
    let calls = 0;
    const { POST } = loadSource('src/app/api/admin/signup-applications/route.ts', {
      '@/lib/admin/guards': { requireAdmin: async () => ({ role, userId: 'reviewer' }), isAuthError: () => false },
      '@/lib/rate-limit': { rateLimit: async () => null },
      '@/lib/supabase/admin': { createAdminClient: () => ({ rpc: async () => { calls++; return { error: null }; } }) },
    });
    const request = (decision, reason = '') => new Request('http://localhost', { method: 'POST', body: JSON.stringify({ userId: viewer.id, decision, reason }) });
    assert.equal((await POST(request('approved'))).status, role === 'admin' ? 403 : 200);
    assert.equal(calls, role === 'admin' ? 0 : 1);
    assert.equal((await POST(request('rejected'))).status, role === 'admin' ? 403 : 400);
  });
}
test('Rate limit errors fail closed; exhausted limits include Retry-After', async () => {
  for (const [data, error, expected] of [[true, null, 200], [false, null, 429], [null, { code: 'unavailable' }, 503]]) {
    const { rateLimit } = loadSource('src/lib/rate-limit.ts', { '@/lib/supabase/admin': { createAdminClient: () => ({ rpc: async (_name, args) => {
      assert.match(args.p_key, /^[0-9a-f]{64}$/);
      return { data, error };
    } }) } });
    const result = await rateLimit('test', 'private-client-ip', 3, 900);
    assert.equal(result?.status || 200, expected);
    if (expected === 429) assert.equal(result.headers.get('retry-after'), '900');
  }
});
test('Onboarding requires explicit consent and complete profile', () => {
  const { onboardingProfileSchema, phoneSchema } = loadSource('src/lib/validations/onboarding.ts', {});
  assert.equal(onboardingProfileSchema.safeParse({}).success, false);
  assert.equal(phoneSchema.safeParse('9876543210').success, false);
  assert.equal(phoneSchema.safeParse('+919876543210').success, true);
  const profile = { full_name: 'Test Client', email: 'client@example.com', phone: '+919876543210', target_country: 'in', experience_range: '3\u20135 years', preferred_role: 'Developer', eeo: { acknowledged: true }, consent: true };
  assert.equal(onboardingProfileSchema.safeParse(profile).success, true);
  assert.equal(onboardingProfileSchema.safeParse({ ...profile, consent: false }).success, false);
});

test('Cover letter creation loads the client instead of redirecting on an ambiguous relationship', async () => {
  const query = {
    select(columns) {
      if (columns.includes('profile:')) assert.ok(columns.includes('profiles!profiles_user_id_fkey'));
      return query;
    },
    eq() { return query; }, is() { return query; }, order() { return query; }, limit() { return query; },
    single: async () => ({ data: { id: viewer.id, email: viewer.email, profile: { full_name: 'Client' } } }),
    maybeSingle: async () => ({ data: null }),
  };
  const page = loadSource('src/app/(admin)/admin/users/[id]/generate-cover-letter/page.tsx', {
    '@/lib/supabase/admin': { createAdminClient: () => ({ from: () => query }) },
    '@/lib/admin/guards': { requireAdmin: async () => ({ role: 'admin' }), isAuthError: () => false },
    'next/navigation': { redirect: () => { throw new Error('Unexpected redirect'); } },
    './client': { AdminCoverLetterGeneratorClient: () => null },
  }).default;
  assert.equal((await page({ params: Promise.resolve({ id: viewer.id }) })).props.userName, 'Client');
});

test('Cover letter generation validates input and returns generated text', async () => {
  let generated = 0;
  const query = { select() { return query; }, eq() { return query; }, is() { return query; }, maybeSingle: async () => ({ data: { content: { contact: { full_name: 'Client', email: 'client@example.com' } } } }) };
  class MockGroq { chat = { completions: { create: async () => { generated++; return { choices: [{ message: { content: 'Dear Hiring Team, I am applying for this position.' } }] }; } } }; }
  const { POST } = loadSource('src/app/api/admin/cover-letters/generate/route.ts', {
    'groq-sdk': MockGroq,
    '@/lib/supabase/admin': { createAdminClient: () => ({ from: () => query }) },
    '@/lib/admin/guards': { requireAdmin: async () => ({ role: 'admin', userId: viewer.id }), isAuthError: () => false },
    '@/lib/rate-limit': { rateLimit: async () => null },
  });
  const request = body => new Request('http://localhost', { method: 'POST', body: JSON.stringify(body) });
  assert.equal((await POST(request({}))).status, 400);
  assert.equal(generated, 0);
  const response = await POST(request({ userId: viewer.id, resumeId: viewer.id, jobDescription: 'An engineering position developing software.', companyName: 'Company', jobTitle: 'Engineer' }));
  assert.equal(response.status, 200);
  assert.match((await response.json()).data.coverLetter, /Dear Hiring Team/);
});
