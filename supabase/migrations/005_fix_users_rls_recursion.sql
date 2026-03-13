-- ============================================
-- Nextzen Orbit — Fix Users RLS Infinite Recursion
-- Version: 1.0.1
-- ============================================
--
-- Problem: The admin_all_users policy queries the users table
-- to check if the user is an admin, which triggers RLS again,
-- causing infinite recursion.
--
-- Solution: Drop the admin policy. Admin access should use
-- service role key, not RLS bypass via policy.
-- ============================================

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "admin_all_users" ON users;

-- The remaining policies are sufficient:
-- - users_select_own: Users can read their own row
-- - users_insert_own: Users can insert their own row
-- - users_update_own: Users can update their own row
--
-- Admin operations should use the service role key which
-- bypasses RLS entirely.

