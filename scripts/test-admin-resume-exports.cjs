// Run with: node --test --test-isolation=none scripts/test-admin-resume-exports.cjs
// Mock authentication/storage; exercise the real route, validation and PDF renderer.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
module.exports = { loadSource, exportHandler };
function loadSource(relativePath, mocks, cache = new Map()) {
  const filename = path.resolve(root, relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.endsWith('.json')) return require(path.resolve(path.dirname(filename), name));
    if (name.startsWith('@/')) {
      const base = `src/${name.slice(2)}`;
      const source = [base + '.ts', base + '.tsx', base + '/index.ts'].find(p => fs.existsSync(path.join(root, p)));
      assert.ok(source, `Cannot resolve ${name}`);
      return loadSource(source, mocks, cache);
    }
    return require(name);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}

for (const profile of [{ full_name: 'Test Client' }, [{ full_name: 'Test Client' }], null]) {
  test(`Creation page loads client with ${profile === null ? 'missing' : Array.isArray(profile) ? 'array' : 'object'} profile`, async () => {
    const database = {
      from(table) {
        let selection = '';
        const query = {
          select(value) { selection = value; return query; },
          eq() { return query; }, is() { return query; }, order() { return query; }, limit() { return query; },
          async single() {
            // The schema has both user_id and assigned_admin_id relationships.
            if (!selection.includes('profiles!profiles_user_id_fkey')) {
              return { data: null, error: { code: 'PGRST201', message: 'Ambiguous relationship' } };
            }
            assert.equal(table, 'users');
            return { data: { id: 'client', email: 'client@example.com', profile }, error: null };
          },
          async maybeSingle() { return { data: null, error: null }; },
        };
        return query;
      },
    };
    const page = loadSource('src/app/(admin)/admin/users/[id]/generate-resume/page.tsx', {
      '@/lib/supabase/admin': { createAdminClient: () => database },
      '@/lib/admin/guards': { requireAdmin: async () => ({ role: 'admin' }), isAuthError: () => false },
      'next/navigation': { redirect: (url) => { throw new Error(`Unexpected redirect: ${url}`); } },
      './client': { AdminResumeGeneratorClient: () => null },
    }).default;
    const result = await page({ params: Promise.resolve({ id: 'client' }) });
    assert.equal(result.props.userId, 'client');
    assert.equal(result.props.userName, profile ? 'Test Client' : 'client@example.com');
    assert.deepEqual(result.props.resumes, []);
  });
}

function exportHandler(adminGenerated, { role = 'user', signedIn = true, owner = false, missing = false, content, overrides = {} } = {}) {
  const resume = {
    id: 'resume-id', user_id: owner ? 'viewer' : 'client', title: 'Client Resume', template_id: 'classic',
    content: content || { contact: { full_name: 'Test Client', email: 'client@example.com' }, summary: { text: 'Experienced developer.' } },
  };
  const database = {
    from(table) {
      const filters = {};
      const query = {
        select() { return query; },
        eq(key, value) { filters[key] = value; return query; },
        async maybeSingle() {
          if (table === 'users') return { data: role ? { role } : null, error: null };
          const allowed = !missing && (!filters.user_id || filters.user_id === resume.user_id);
          return { data: allowed ? resume : null, error: null };
        },
        single() { return query.maybeSingle(); },
      };
      return query;
    },
  };
  const mocks = {
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: signedIn ? { id: 'viewer' } : null } }) } }) },
    '@/lib/supabase/admin': { createAdminClient: () => database },
    ...overrides,
  };
  return loadSource(adminGenerated ? 'src/app/api/resumes/export-admin/route.ts' : 'src/app/api/resumes/[id]/export/route.ts', mocks).GET;
}

for (const adminGenerated of [false, true]) {
  const label = adminGenerated ? 'Admin-generated resume' : 'Client resume';
  async function request(options) {
    return exportHandler(adminGenerated, options)(
      new Request('http://localhost/api/resumes/export-admin?id=resume-id&format=pdf'),
      { params: Promise.resolve({ id: 'resume-id' }) },
    );
  }
  for (const role of ['admin', 'supervisor_admin', 'super_admin']) {
    test(`${label}: ${role} can download a client PDF`, async () => {
      const response = await request({ role });
      assert.equal(response.status, 200, await response.clone().text());
      assert.equal(response.headers.get('content-type'), 'application/pdf');
      assert.match(response.headers.get('content-disposition'), /attachment; filename="Client_Resume.pdf"/);
      const pdf = Buffer.from(await response.arrayBuffer());
      assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
      assert.ok(pdf.length > 500);
    });
  }
  test(`${label}: owner can download`, async () => {
    assert.equal((await request({ owner: true })).status, 200);
  });
  for (const role of ['user', 'sso_user', null]) {
    test(`${label}: non-owner with role ${role} cannot download`, async () => {
      assert.equal((await request({ role })).status, 404);
    });
  }
  test(`${label}: unauthenticated request is rejected`, async () => {
    assert.equal((await request({ signedIn: false })).status, 401);
  });
  test(`${label}: missing resume returns 404`, async () => {
    assert.equal((await request({ role: 'admin', missing: true })).status, 404);
  });
}

for (const generated of [true, false]) for (const template of ['classic', 'modern', 'creative']) test(`${generated ? 'Admin' : 'Client'} PDF (${template}) accepts imported non-breaking hyphens and ligatures`, async () => {
  const { extractText } = require('unpdf');
  const content = { contact: { full_name: 'Test Client', email: 'client@example.com' }, summary: { text: 'Led cross\u2011functional teams and high\u2010priority projects. Improved of\ufb01ce work\ufb02ows with 100\u202fusers.' } };
  const original = JSON.stringify(content);
  const response = await exportHandler(generated, { owner: true, content })(new Request(`http://localhost/api/resumes/export-admin?id=resume-id&format=pdf&template=${template}`), { params: Promise.resolve({ id: 'resume-id' }) });
  assert.equal(response.status, 200, await response.clone().text());
  const recovered = await extractText(new Uint8Array(await response.arrayBuffer()), { mergePages: true });
  assert.match(recovered.text, /cross-functional/);
  assert.match(recovered.text, /high-priority/);
  assert.match(recovered.text, /office workflows/);
  assert.equal(JSON.stringify(content), original, 'Saved source must not be changed');
});
