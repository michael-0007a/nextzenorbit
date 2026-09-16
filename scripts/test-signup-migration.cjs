// Requires a local @electric-sql/pglite installation; no live database is touched.
// node --test --test-isolation=none scripts/test-signup-migration.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

test('Migration versions are unique', () => {
  const files = fs.readdirSync(path.join(__dirname, '../supabase/migrations')).filter(file => file.endsWith('.sql'));
  const versions = files.map(file => file.split('_')[0]);
  assert.equal(new Set(versions).size, versions.length, 'Each SQL migration must have a unique version prefix');
});

test('Signup migration and database security', async t => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth; CREATE SCHEMA storage;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT null::uuid';
      GRANT USAGE ON SCHEMA auth TO authenticated;
      CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, phone text, phone_confirmed_at timestamptz);
      CREATE TABLE public.users(id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE, email text NOT NULL, role text DEFAULT 'user', is_suspended boolean DEFAULT false);
      GRANT ALL ON public.users TO authenticated;
      CREATE TABLE public.profiles(user_id uuid PRIMARY KEY REFERENCES public.users ON DELETE CASCADE, full_name text, phone text, headline text, location text, preferred_role text, preferred_location text, preferred_work_type text, years_of_experience integer, linkedin_url text, has_agreed_to_terms boolean);
      CREATE TABLE public.resumes(id uuid DEFAULT gen_random_uuid(), user_id uuid REFERENCES public.users ON DELETE CASCADE, title text, content jsonb, is_base boolean, template_id text);
      ALTER TABLE public.profiles ADD COLUMN preferred_salary_min integer, ADD COLUMN preferred_salary_max integer, ADD COLUMN preferred_portals text[];
      CREATE TABLE storage.buckets(id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      CREATE TABLE storage.objects(bucket_id text, name text);
      INSERT INTO auth.users(id, email) VALUES('${id(1)}', 'old@example.com'), ('${id(2)}', 'super@example.com'), ('${id(3)}', 'supervisor@example.com'), ('${id(4)}', 'admin@example.com');
      INSERT INTO public.users(id, email, role) VALUES('${id(1)}', 'old@example.com', 'user'), ('${id(2)}', 'super@example.com', 'super_admin'), ('${id(3)}', 'supervisor@example.com', 'supervisor_admin'), ('${id(4)}', 'admin@example.com', 'admin');
    `);
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/033_signup_review.sql'), 'utf8'));
    // The suspension migration is safe after an interrupted push or manual application.
    const suspensionSql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/034_user_suspension.sql'), 'utf8');
    await db.exec(suspensionSql);
    await db.exec(suspensionSql);
    const profile = { full_name: 'Test Applicant', headline: 'Engineer', location: 'India', preferred_role: 'Engineer', preferred_location: 'India', preferred_work_type: 'remote', years_of_experience: 3 };
    const phones = new Map();
    async function applicant(n, phone = `91900000${String(n).padStart(4, '0')}`) {
      phones.set(n, `+${phone}`);
      await db.query('INSERT INTO auth.users VALUES($1,$2,$3,$4)', [id(n), `client${n}@example.com`, null, null]);
      await db.query('INSERT INTO public.users(id,email) VALUES($1,$2)', [id(n), `client${n}@example.com`]);
      await db.query('INSERT INTO storage.objects VALUES($1,$2)', ['signup-resumes', `${id(n)}/resume.pdf`]);
    }
    const submit = (n, overrides = {}) => db.query('SELECT public.submit_signup_application($1,$2,$3,$4,$5,$6)', [id(n), JSON.stringify({ ...profile, phone: phones.get(n), ...overrides }), `${id(n)}/resume.pdf`, 'resume.pdf', '{}', '2026-09-16']);
    const review = (n, reviewer, decision, reason = '') => db.query('SELECT public.review_signup_application($1,$2,$3,$4)', [id(n), id(reviewer), decision, reason]);

    await t.test('Migration preserves existing accounts', async () => {
      const result = await db.query('SELECT status, legacy_account FROM signup_applications WHERE user_id=$1', [id(1)]);
      assert.deepEqual(result.rows[0], { status: 'approved', legacy_account: true });
    });
    await t.test('Submission saves profile/resume and locks duplicate submissions', async () => {
      await applicant(10); await submit(10);
      const result = await db.query('SELECT status, consent_version FROM signup_applications WHERE user_id=$1', [id(10)]);
      assert.deepEqual(result.rows[0], { status: 'pending', consent_version: '2026-09-16' });
      await assert.rejects(submit(10), /already submitted/);
      assert.equal((await db.query('SELECT count(*)::int AS count FROM resumes WHERE user_id=$1', [id(10)])).rows[0].count, 1);
    });
    await t.test('Missing phone and incomplete profiles cannot submit', async () => {
      await applicant(11); await assert.rejects(submit(11, { phone: '' }), /valid phone/);
      await applicant(12); await assert.rejects(submit(12, { headline: '' }), /required profile/);
    });
    await t.test('Ordinary admins cannot approve; supervisors can', async () => {
      await assert.rejects(review(10, 4, 'approved'), /Supervisor/);
      await review(10, 3, 'approved');
      await assert.rejects(review(10, 2, 'rejected', 'Duplicate decision'), /no longer pending/);
    });
    await t.test('Rejection persists email/phone blocks independently of deleted user', async () => {
      await applicant(13, '919999999999'); await submit(13);
      await assert.rejects(review(13, 2, 'rejected', ''), /reason/);
      await review(13, 2, 'rejected', 'Application does not meet requirements');
      await db.query('DELETE FROM auth.users WHERE id=$1', [id(13)]);
      await assert.rejects(db.query('INSERT INTO auth.users(id,email) VALUES($1,$2)', [id(14), ' CLIENT13@EXAMPLE.COM ']), /Registration is not available/);
      await applicant(15, '919999999999');
      await assert.rejects(submit(15), /Registration is not available/);
    });
    await t.test('Missing uploaded resume prevents submission', async () => {
      await applicant(16);
      await db.query('DELETE FROM storage.objects WHERE name=$1', [`${id(16)}/resume.pdf`]);
      await assert.rejects(submit(16), /uploaded resume/);
    });
    await t.test('Conflicting reviewer decisions cannot both succeed', async () => {
      await applicant(17); await submit(17);
      const results = await Promise.allSettled([review(17, 2, 'approved'), review(17, 3, 'rejected', 'Rejected')]);
      assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    });
    await t.test('Rate limits atomically cap attempts and reset on expiry', async () => {
      const consume = () => db.query("SELECT consume_request_limit('test', 2, 60) AS allowed");
      assert.equal((await consume()).rows[0].allowed, true);
      assert.equal((await consume()).rows[0].allowed, true);
      assert.equal((await consume()).rows[0].allowed, false);
      await db.exec("UPDATE request_limits SET expires_at=now()-interval '1 minute'");
      assert.equal((await consume()).rows[0].allowed, true);
    });
    await t.test('Clients cannot promote themselves, write approvals, inspect blocks or call privileged RPCs', async () => {
      await db.exec('SET ROLE authenticated');
      for (const sql of ["UPDATE public.users SET role='super_admin'", "INSERT INTO signup_applications(user_id,email,status) VALUES(gen_random_uuid(),'x','approved')", 'SELECT * FROM registration_blocks', "SELECT consume_request_limit('bypass', 1, 1)", `SELECT review_signup_application('${id(10)}','${id(2)}','approved','')`]) {
        await assert.rejects(db.exec(sql), /permission denied/);
      }
      await db.exec('RESET ROLE');
    });
  } finally { await db.close(); }
});
