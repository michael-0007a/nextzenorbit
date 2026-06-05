-- ============================================
-- Fix RLS Recursion on Career Workspace Tables
-- ============================================

-- Create a security definer function to check admin status
-- This bypasses RLS on the users table, breaking the infinite recursion loop.
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS careers_admin_all ON careers;
CREATE POLICY careers_admin_all ON careers FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS jobs_admin_all ON jobs;
CREATE POLICY jobs_admin_all ON jobs FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS youtube_resources_admin_all ON youtube_resources;
CREATE POLICY youtube_resources_admin_all ON youtube_resources FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS roadmaps_admin_all ON roadmaps;
CREATE POLICY roadmaps_admin_all ON roadmaps FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS roadmap_steps_admin_all ON roadmap_steps;
CREATE POLICY roadmap_steps_admin_all ON roadmap_steps FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS interview_questions_admin_all ON interview_questions;
CREATE POLICY interview_questions_admin_all ON interview_questions FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());
