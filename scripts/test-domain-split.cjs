// node --test --test-isolation=none scripts/test-domain-split.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./test-admin-resume-exports.cjs');
const { NextRequest, NextResponse } = require('next/server');

const ENV = {
  NEXT_PUBLIC_SITE_URL: 'https://nextzenorbit.com',
  NEXT_PUBLIC_APP_URL: 'https://app.nextzenorbit.com',
  NEXT_PUBLIC_ADMIN_URL: 'https://admin.nextzenorbit.com',
  ORBIT_LEGACY_HOSTS: 'nextzenorbit.vercel.app',
};
function withEnv(values, fn) {
  const saved = Object.fromEntries(Object.keys(ENV).map(k => [k, process.env[k]]));
  for (const k of Object.keys(ENV)) { if (values[k] === undefined) delete process.env[k]; else process.env[k] = values[k]; }
  return Promise.resolve().then(fn).finally(() => { for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
}
const hosts = loadSource('src/lib/hosts.ts', {});

test('Routing is off until all three host URLs are configured', () => withEnv({ NEXT_PUBLIC_APP_URL: 'https://nextzenorbit.vercel.app' }, () => {
  assert.equal(hosts.configuredHosts(), null);
  for (const host of ['nextzenorbit.com', 'admin.nextzenorbit.com', 'localhost:3000']) assert.equal(hosts.hostKind(host), 'any');
  assert.equal(hosts.routeForHost('any', '/admin/users'), null);
  assert.equal(hosts.sessionCookieOptions('nextzenorbit.vercel.app'), undefined);
  assert.equal(hosts.appHref('/dashboard'), '/dashboard');
}));

test('Hosts are classified and pages are routed to their domain', () => withEnv(ENV, () => {
  const { hostKind, routeForHost } = hosts;
  assert.equal(hostKind('nextzenorbit.com'), 'site');
  assert.equal(hostKind('www.nextzenorbit.com'), 'site');
  assert.equal(hostKind('APP.nextzenorbit.com'), 'app');
  assert.equal(hostKind('admin.nextzenorbit.com'), 'admin');
  assert.equal(hostKind('nextzenorbit.vercel.app'), 'legacy');
  assert.equal(hostKind('nextzenorbit-git-x.vercel.app'), 'any');
  assert.equal(hostKind('localhost:3000'), 'any');

  const cases = [
    ['site', '/', null],
    ['site', '/privacy', null],
    ['site', '/login', { redirect: 'https://app.nextzenorbit.com/login?x=1' }],
    ['site', '/dashboard', { redirect: 'https://app.nextzenorbit.com/dashboard?x=1' }],
    ['site', '/admin/users', { redirect: 'https://admin.nextzenorbit.com/admin/users?x=1' }],
    ['app', '/dashboard', null],
    ['app', '/admin', { redirect: 'https://admin.nextzenorbit.com/admin?x=1' }],
    ['app', '/administrator', null],
    ['admin', '/', { rewrite: '/admin' }],
    ['admin', '/users', { rewrite: '/admin/users' }],
    ['admin', '/login', { rewrite: '/admin/login' }],
    ['admin', '/admin/users/42', null],
    ['legacy', '/', { redirect: 'https://nextzenorbit.com/?x=1' }],
    ['legacy', '/terms', { redirect: 'https://nextzenorbit.com/terms?x=1' }],
    ['legacy', '/resumes/1', { redirect: 'https://app.nextzenorbit.com/resumes/1?x=1' }],
    ['legacy', '/admin/team', { redirect: 'https://admin.nextzenorbit.com/admin/team?x=1' }],
    ['any', '/admin', null],
  ];
  for (const [kind, path, expected] of cases) assert.deepEqual(routeForHost(kind, path, '?x=1'), expected, `${kind} ${path}`);
  // Webhooks, OAuth callback, extension APIs and static files never move.
  for (const kind of ['site', 'app', 'admin', 'legacy']) {
    for (const path of ['/api/webhooks/payu', '/api/auth/callback', '/api/autofill/profile', '/api/admin/users', '/robots.txt', '/_next/data/x.json']) {
      assert.equal(routeForHost(kind, path), null, `${kind} ${path}`);
    }
  }
}));

test('Marketing and app share a session; the staff host has its own cookie', () => withEnv(ENV, () => {
  assert.deepEqual(hosts.sessionCookieOptions('nextzenorbit.com'), { domain: '.nextzenorbit.com' });
  assert.deepEqual(hosts.sessionCookieOptions('app.nextzenorbit.com'), { domain: '.nextzenorbit.com' });
  assert.deepEqual(hosts.sessionCookieOptions('admin.nextzenorbit.com'), { name: 'sb-orbit-admin' });
  assert.equal(hosts.sessionCookieOptions('nextzenorbit.vercel.app'), undefined);
  assert.equal(hosts.sessionCookieOptions('localhost:3000'), undefined);
  assert.equal(hosts.appHref('/dashboard'), 'https://app.nextzenorbit.com/dashboard');
}));

function proxyFor(user) {
  const seen = [];
  const proxy = loadSource('src/middleware.ts', {
    '@/lib/supabase/middleware': { updateSession: async (request) => { seen.push(request.headers.get('host')); return { user, supabaseResponse: NextResponse.next() }; } },
    '@/lib/account-access': { accountAccessFor: async () => ({ application: 'approved', service: true, role: user?.role ?? 'user', subscription: null }) },
    '@/lib/access-envelope': { ACCESS_HEADER: 'x-orbit-access', signAccess: async () => 'signed' },
  }).default;
  return { proxy, seen };
}
const req = (url, init) => new NextRequest(url, init);

test('Middleware applies host routing before auth and never redirects webhooks', () => withEnv(ENV, async () => {
  const anon = proxyFor(null).proxy;
  const login = await anon(req('https://nextzenorbit.com/login'));
  assert.equal(login.status, 308);
  assert.equal(login.headers.get('location'), 'https://app.nextzenorbit.com/login');

  const webhook = await anon(req('https://app.nextzenorbit.com/api/webhooks/payu', { method: 'POST', body: 'a=1' }));
  assert.equal(webhook.headers.get('location'), null);
  const legacyWebhook = await anon(req('https://nextzenorbit.vercel.app/api/webhooks/payu', { method: 'POST', body: 'a=1' }));
  assert.equal(legacyWebhook.headers.get('location'), null);

  const appRoot = await anon(req('https://app.nextzenorbit.com/'));
  assert.equal(appRoot.headers.get('location'), 'https://app.nextzenorbit.com/login');
  const siteRoot = await anon(req('https://nextzenorbit.com/'));
  assert.equal(siteRoot.headers.get('location'), null);

  const signedIn = proxyFor({ id: 'client' }).proxy;
  const home = await signedIn(req('https://nextzenorbit.com/'));
  assert.equal(home.headers.get('location'), 'https://app.nextzenorbit.com/dashboard');

  const staff = proxyFor({ id: 'staff', role: 'admin' }).proxy;
  const clean = await staff(req('https://admin.nextzenorbit.com/users?page=2'));
  assert.equal(new URL(clean.headers.get('x-middleware-rewrite')).pathname, '/admin/users');
  assert.equal(new URL(clean.headers.get('x-middleware-rewrite')).search, '?page=2');
  assert.equal(clean.headers.get('x-robots-tag'), 'noindex, nofollow');
  const unauthenticated = await anon(req('https://admin.nextzenorbit.com/users'));
  assert.equal(new URL(unauthenticated.headers.get('location')).pathname, '/admin/login');
}));

test('Unconfigured deployments keep the old single-host behaviour', () => withEnv({ NEXT_PUBLIC_APP_URL: 'https://nextzenorbit.vercel.app' }, async () => {
  const signedIn = proxyFor({ id: 'client' }).proxy;
  const root = await signedIn(req('https://nextzenorbit.vercel.app/'));
  assert.equal(root.headers.get('location'), 'https://nextzenorbit.vercel.app/dashboard');
  const admin = await signedIn(req('https://nextzenorbit.vercel.app/admin/users'));
  assert.equal(admin.headers.get('location'), null);
  assert.equal(admin.headers.get('x-middleware-rewrite'), null);
  const anonRoot = await proxyFor(null).proxy(req('https://nextzenorbit.vercel.app/'));
  assert.equal(anonRoot.headers.get('location'), null);
}));
