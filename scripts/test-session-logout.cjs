// node --test --test-isolation=none --test-name-pattern=Logout scripts/test-session-logout.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./test-admin-resume-exports.cjs');

function control(pathname, { user = { id: 'viewer' }, signOut = async () => {} } = {}) {
  const errors = [];
  const states = [];
  const { SessionLogout } = loadSource('src/components/layout/session-logout.tsx', {
    react: { useState: () => [false, value => states.push(value)] },
    'next/navigation': { usePathname: () => pathname },
    '@/hooks/use-user': { useUser: () => ({ user, signOut }) },
    sonner: { toast: { error: message => errors.push(message) } },
  });
  return { element: SessionLogout(), errors, states };
}

test('Logout is available on every signed-in route, including unpaid and pending users', async () => {
  const originalWindow = global.window;
  try {
    for (const pathname of ['/subscription', '/onboarding', '/onboarding/terms', '/profile', '/dashboard', '/resumes/example', '/admin', '/admin/users/example', '/', '/privacy']) {
      let calls = 0, destination;
      global.window = { location: { replace: url => { destination = url; } } };
      const { element } = control(pathname, { signOut: async () => { calls++; } });
      const button = element.props.children;
      assert.equal(button.props['aria-label'], 'Log out');
      assert.equal(button.props.type, 'button');
      await button.props.onClick();
      assert.equal(calls, 1);
      assert.equal(destination, pathname.startsWith('/admin') ? '/admin/login' : '/login');
    }
  } finally { global.window = originalWindow; }
});

test('Logout is hidden for signed-out visitors', () => {
  assert.equal(control('/login', { user: null }).element, null);
});

test('Logout failure stays on the current page and offers retry', async () => {
  const originalWindow = global.window;
  let redirected = false;
  global.window = { location: { replace: () => { redirected = true; } } };
  try {
    const { element, errors, states } = control('/subscription', { signOut: async () => { throw new Error('Network failure'); } });
    await element.props.children.props.onClick();
    assert.equal(redirected, false);
    assert.equal(errors.length, 1);
    assert.deepEqual(states, [true, false]);
  } finally { global.window = originalWindow; }
});

test('Logout hook does not report success when Supabase rejects sign-out', async () => {
  const failure = new Error('Sign-out failed');
  let cleared = false;
  const { useUser } = loadSource('src/hooks/use-user.ts', {
    react: { useState: () => [null, () => { cleared = true; }], useEffect: () => {}, useCallback: fn => fn },
    '@/lib/supabase/client': { createClient: () => ({ auth: { signOut: async () => ({ error: failure }) } }) },
  });
  await assert.rejects(useUser().signOut(), failure);
  assert.equal(cleared, false);
});
