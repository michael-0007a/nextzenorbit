// Times signed-in page loads against a deployment (no browser, server time + network only).
//   node --env-file=.env.local scripts/measure-latency.cjs https://app.beta.nextzenorbit.com https://nextzenorbit.vercel.app
// Env: LATENCY_EMAIL / LATENCY_PASSWORD (a test client), optional VERCEL_BYPASS (Deployment Protection bypass
// secret, needed for protected preview deployments).
const { createClient } = require('@supabase/supabase-js');

const PATHS = ['/login', '/dashboard', '/resumes', '/applications', '/api/notifications'];

(async () => {
  const bases = process.argv.slice(2);
  if (!bases.length || !process.env.LATENCY_EMAIL || !process.env.LATENCY_PASSWORD) {
    console.error('Usage: LATENCY_EMAIL=... LATENCY_PASSWORD=... node --env-file=.env.local scripts/measure-latency.cjs <base-url>...');
    process.exit(1);
  }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await db.auth.signInWithPassword({ email: process.env.LATENCY_EMAIL, password: process.env.LATENCY_PASSWORD });
  if (error) throw error;
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host.split('.')[0];
  const session = `base64-${Buffer.from(JSON.stringify(data.session)).toString('base64url')}`;
  const headers = { cookie: `sb-${ref}-auth-token=${session}` };
  if (process.env.VERCEL_BYPASS) headers['x-vercel-protection-bypass'] = process.env.VERCEL_BYPASS;

  for (const base of bases) {
    console.log(`\n${base}`);
    for (const path of PATHS) {
      const times = [];
      let status = '';
      for (let i = 0; i < 4; i++) {
        const start = Date.now();
        const response = await fetch(base + path, { headers, redirect: 'manual' });
        await response.text();
        times.push(Date.now() - start);
        status = String(response.status);
      }
      const warm = times.slice(1).sort((a, b) => a - b);
      console.log(`  ${path.padEnd(20)} ${status}  median ${String(warm[1]).padStart(5)} ms   (all: ${times.join(' / ')})`);
    }
  }
})().catch((err) => { console.error(err.message); process.exit(1); });
