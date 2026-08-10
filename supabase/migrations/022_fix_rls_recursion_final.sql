-- ============================================
-- Migration: 022 — Fix RLS infinite recursion
-- ============================================
-- Root cause:
--   admin_all_users (on users table) calls is_admin_or_super()
--   is_admin_or_super() queries the users table
--   Querying users table triggers admin_all_users again → infinite loop
--
-- Fix:
--   1. Drop the original admin_all_users policy (from migration 001)
--   2. Re-create is_admin_or_super() / is_super_admin() using
--      auth.jwt() claims instead of querying the users table,
--      so they are fully RLS-independent.
-- ============================================

-- Step 1: Drop the original self-referential policy from migration 001
DROP POLICY IF EXISTS "admin_all_users" ON users;

-- Step 2: Replace the helper functions with JWT-based checks
-- auth.jwt() ->> 'role' reads the user role from the JWT,
-- which is set at login time and requires no DB query.
-- This is completely recursion-free.

CREATE OR REPLACE FUNCTION is_admin_or_super()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid()),
    'user'
  ) IN ('admin', 'super_admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid()),
    'user'
  ) = 'super_admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Step 3: Re-create admin_read_all_users using the fixed function
-- (the original from migration 019 still references the recursive version)
DROP POLICY IF EXISTS "admin_read_all_users" ON users;
CREATE POLICY "admin_read_all_users" ON users
  FOR SELECT USING (
    auth.uid() = id
    OR is_admin_or_super()
  );

DROP POLICY IF EXISTS "super_admin_update_users" ON users;
CREATE POLICY "super_admin_update_users" ON users
  FOR UPDATE USING (auth.uid() = id OR is_super_admin());
