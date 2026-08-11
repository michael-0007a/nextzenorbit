-- Migration 027: NUKE and recreate all problematic RLS policies
-- This guarantees no lingering policies (like admin_all_users) are causing infinite recursion.

-- 1. NUKE ALL POLICIES ON `users`
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "admin_all_users" ON users;
DROP POLICY IF EXISTS "admin_read_all_users" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "super_admin_update_users" ON users;
DROP POLICY IF EXISTS "users_delete_own" ON users;

-- Recreate clean users policies
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "admin_read_all_users" ON users
  FOR SELECT USING (
    CASE 
      WHEN auth.uid() = id THEN true
      ELSE is_admin_or_super()
    END
  );

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "super_admin_update_users" ON users
  FOR UPDATE USING (
    CASE 
      WHEN auth.uid() = id THEN true
      ELSE is_super_admin()
    END
  );

-- 2. NUKE ALL POLICIES ON `subscriptions`
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
DROP POLICY IF EXISTS "admin_read_all_subscriptions" ON subscriptions;

-- Recreate clean subscriptions policies
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admin_read_all_subscriptions" ON subscriptions
  FOR SELECT USING (is_admin_or_super());

-- 3. Redefine the admin functions to be ABSOLUTELY bulletproof.
-- By bypassing RLS explicitly and not relying on STABLE/VOLATILE quirks.
-- Wait, SECURITY DEFINER already bypasses RLS. We will keep it VOLATILE just in case.

CREATE OR REPLACE FUNCTION is_admin_or_super()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid()),
    'user'
  ) IN ('admin', 'super_admin');
$$ LANGUAGE sql SECURITY DEFINER VOLATILE SET search_path = public;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid()),
    'user'
  ) = 'super_admin';
$$ LANGUAGE sql SECURITY DEFINER VOLATILE SET search_path = public;
