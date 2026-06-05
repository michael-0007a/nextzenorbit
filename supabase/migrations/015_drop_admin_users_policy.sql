-- ============================================
-- Nextzen Orbit — Ensure Users Admin Policy Removed
-- Version: 1.0.0
-- ============================================
--
-- Guard against lingering admin_all_users policy which can
-- cause infinite recursion by querying the users table.
-- ============================================

DROP POLICY IF EXISTS "admin_all_users" ON users;
