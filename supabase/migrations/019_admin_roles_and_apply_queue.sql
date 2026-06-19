-- ============================================
-- Nextzen Orbit — Admin Roles & Apply Queue
-- Migration: 019
-- ============================================

-- ── 1. Expand user roles ──
-- Add 'sso_user' and 'super_admin' to the role check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'sso_user', 'admin', 'super_admin'));


-- ── 2. Apply queue columns for admin workflow ──
ALTER TABLE job_queue
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Index for admin queries: find unclaimed pending jobs, or jobs assigned to a specific admin
CREATE INDEX IF NOT EXISTS idx_job_queue_assigned
  ON job_queue(assigned_to, status);

CREATE INDEX IF NOT EXISTS idx_job_queue_pending_unclaimed
  ON job_queue(status) WHERE status = 'pending' AND assigned_to IS NULL;


-- ── 3. RLS policies for admin access ──
-- Admins and super_admins need to read all user data

-- Helper function to check admin role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION is_admin_or_super()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ── Profiles: admins can read all profiles ──
DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;
CREATE POLICY "admin_read_all_profiles" ON profiles
  FOR SELECT USING (is_admin_or_super());


-- ── Resumes: admins can read all resumes ──
DROP POLICY IF EXISTS "admin_read_all_resumes" ON resumes;
CREATE POLICY "admin_read_all_resumes" ON resumes
  FOR SELECT USING (is_admin_or_super() AND deleted_at IS NULL);


-- ── Cover Letters: admins can read all cover letters ──
DROP POLICY IF EXISTS "admin_read_all_cover_letters" ON cover_letters;
CREATE POLICY "admin_read_all_cover_letters" ON cover_letters
  FOR SELECT USING (is_admin_or_super());


-- ── Job Queue: admins can read & update all queue items ──
DROP POLICY IF EXISTS "admin_read_all_job_queue" ON job_queue;
CREATE POLICY "admin_read_all_job_queue" ON job_queue
  FOR SELECT USING (is_admin_or_super());

DROP POLICY IF EXISTS "admin_update_job_queue" ON job_queue;
CREATE POLICY "admin_update_job_queue" ON job_queue
  FOR UPDATE USING (is_admin_or_super());


-- ── Users: admins can read all users ──
DROP POLICY IF EXISTS "admin_read_all_users" ON users;
CREATE POLICY "admin_read_all_users" ON users
  FOR SELECT USING (is_admin_or_super());

-- Super admins can update user roles
DROP POLICY IF EXISTS "super_admin_update_users" ON users;
CREATE POLICY "super_admin_update_users" ON users
  FOR UPDATE USING (is_super_admin());


-- ── Subscriptions: admins can read all subscriptions ──
DROP POLICY IF EXISTS "admin_read_all_subscriptions" ON subscriptions;
CREATE POLICY "admin_read_all_subscriptions" ON subscriptions
  FOR SELECT USING (is_admin_or_super());


-- ── Applications: admins can read all applications ──
DROP POLICY IF EXISTS "admin_read_all_applications" ON applications;
CREATE POLICY "admin_read_all_applications" ON applications
  FOR SELECT USING (is_admin_or_super());
