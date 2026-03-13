-- ============================================
-- Nextzen Orbit — Fix ALL RLS Infinite Recursion Issues
-- Version: 1.0.4
-- ============================================
--
-- This migration removes ALL admin policies that cause infinite
-- recursion by querying the users table within RLS policies.
-- Admin operations should use the service role key instead.
-- ============================================

-- 1. Drop problematic admin policy from users table (if still exists)
DROP POLICY IF EXISTS "admin_all_users" ON users;

-- 2. Drop any admin policies from profiles table
DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;

-- 3. Drop any admin policies from subscriptions table
DROP POLICY IF EXISTS "admin_all_subscriptions" ON subscriptions;

-- 4. Drop any admin policies from resumes table
DROP POLICY IF EXISTS "admin_all_resumes" ON resumes;

-- 5. Drop any admin policies from applications table (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications') THEN
    DROP POLICY IF EXISTS "admin_all_applications" ON applications;
  END IF;
END $$;

-- 6. Drop any admin policies from ai_usage table (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_usage') THEN
    DROP POLICY IF EXISTS "admin_all_ai_usage" ON ai_usage;
  END IF;
END $$;

-- ============================================
-- NOTE: All admin operations should now use the service role key
-- which bypasses RLS entirely. This is the correct pattern.
-- ============================================


