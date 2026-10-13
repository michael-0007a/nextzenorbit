// Admin download of saved client cover letters (previously listed with no way to download).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./test-admin-resume-exports.cjs');

const letterId = '44444444-4444-4444-8444-444444444444', clientId = '22222222-2222-4222-8222-222222222222';
function route({ assigned = true, letter = { user_id: clientId, title: 'Acme letter', content: 'Dear team,\n\nI build SQL reports.' } } = {}) {
  const query = { select() { return query; }, eq() { return query; }, maybeSingle: async () => ({ data: letter, error: null }) };
  return loadSource('src/app/api/admin/cover-letters/[id]/export/route.ts', {
    '@/lib/admin/guards': { requireAdmin: async () => ({ userId: 'admin', role: 'admin' }), isAuthError: v => v instanceof Response },
    '@/lib/admin/assignments': { denyUnassignedClient: async () => assigned ? null : Response.json({ error: { message: 'This client is not assigned to you.' } }, { status: 403 }) },
    '@/lib/supabase/admin': { createAdminClient: () => ({ from: () => query }) },
  });
}
const call = (r, format = 'pdf', id = letterId) => r.GET(new Request(`http://local/api/admin/cover-letters/${id}/export?format=${format}`), { params: Promise.resolve({ id }) });

test('assigned admin downloads a saved cover letter as PDF and Word', async () => {
  for (const [format, type] of [['pdf', 'application/pdf'], ['docx', 'wordprocessingml']]) {
    const response = await call(route(), format);
    assert.equal(response.status, 200, await response.clone().text());
    assert.match(response.headers.get('content-type'), new RegExp(type));
    assert.match(response.headers.get('content-disposition'), new RegExp(`Acme_letter\.${format}`));
    assert.ok((await response.arrayBuffer()).byteLength > 500);
  }
});

test('unassigned admins, unknown letters and bad input are refused', async () => {
  assert.equal((await call(route({ assigned: false }))).status, 403);
  assert.equal((await call(route({ letter: null }))).status, 404);
  assert.equal((await call(route(), 'exe')).status, 400);
  assert.equal((await call(route(), 'pdf', 'not-a-uuid')).status, 400);
});
