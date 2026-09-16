const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./test-admin-resume-exports.cjs');

test('PDF export accepts blank contact fields and nullable legacy fields without changing stored content', () => {
  const { parseExportContent, hasResumeBody } = loadSource('src/lib/resume/export-content.ts', {});
  const saved = { contact: { full_name: '', email: '', phone: null }, summary: { text: 'Developer experience' }, experience: [{ company: 'Company', position: 'Developer', start_date: '', bullets: [], location: null }] };
  const parsed = parseExportContent(saved);
  assert.equal(parsed.success, true);
  assert.equal(saved.contact.phone, null);
  assert.equal(hasResumeBody(saved), true);
  assert.equal(hasResumeBody({ contact: { full_name: '', email: '' }, experience: [], summary: { text: '' } }), false);
});

for (const text of ['', 'Experienced developer building reliable applications for customers.']) {
  test(`Onboarding saves original when ${text ? 'AI is unavailable' : 'resume has no extractable text'}`, async () => {
    let uploaded = false; let submitted = false;
    const query = { select() { return query; }, in() { return query; }, limit: async () => ({ data: [], error: null }) };
    const admin = {
      from: () => query,
      storage: { from: () => ({ upload: async () => { uploaded = true; return { error: null }; } }) },
      rpc: async (_name, args) => { assert.equal(uploaded, true); assert.equal(args.p_content.contact.full_name, 'Test Applicant'); submitted = true; return { error: null }; },
    };
    const { POST } = loadSource('src/app/api/onboarding/route.ts', {
      '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'client', email: 'client@example.com' } } }) } }) },
      '@/lib/supabase/admin': { createAdminClient: () => admin },
      '@/lib/onboarding': { getApplicationAccess: async () => 'draft' },
      '@/lib/rate-limit': { rateLimit: async () => null },
      '@/lib/ai/parsers/resume-parser': { extractText: async () => text, parseResumeWithAI: async () => ({ parsedByAI: false }) },
    });
    const form = new FormData();
    form.set('profile', JSON.stringify({ full_name: 'Test Applicant', phone: '+919876543210', headline: 'Developer', location: 'India', preferred_role: 'Developer', preferred_location: 'India', preferred_work_type: 'remote', years_of_experience: 2, consent: true }));
    form.set('file', new File(['%PDF-1.4 test'], 'resume.pdf', { type: 'application/pdf' }));
    const response = await POST(new Request('http://localhost/api/onboarding', { method: 'POST', body: form }));
    assert.equal(response.status, 201, await response.text());
    assert.equal(submitted, true);
  });
}

test('Admins download original storage bytes without parsing; traversal is rejected', async () => {
  const owner = '11111111-1111-4111-8111-111111111111';
  const bytes = '%PDF-1.4 original content';
  const { GET } = loadSource('src/app/api/admin/users/[id]/files/route.ts', {
    '@/lib/admin/guards': { requireAdmin: async () => ({ role: 'admin' }), isAuthError: () => false },
    '@/lib/supabase/admin': { createAdminClient: () => ({
      from: () => { const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: { id: owner } }) }; return q; },
      storage: { from: bucket => ({ download: async path => { assert.equal(bucket, 'resume-uploads'); assert.equal(path, `${owner}/original.pdf`); return { data: new Blob([bytes], { type: 'application/pdf' }) }; } }) },
    }) },
  });
  const response = await GET(new Request('http://localhost?bucket=resume-uploads&name=original.pdf'), { params: Promise.resolve({ id: owner }) });
  assert.equal(response.status, 200); assert.equal(await response.text(), bytes);
  const invalid = await GET(new Request('http://localhost?bucket=resume-uploads&name=..%2Fother.pdf'), { params: Promise.resolve({ id: owner }) });
  assert.equal(invalid.status, 400);
});
