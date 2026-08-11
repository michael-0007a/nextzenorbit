-- Migration 029: Drop all recursive admin policies
-- The frontend NEVER queries all users or all subscriptions from the client side.
-- The admin dashboard uses `createAdminClient()` (Service Role) which bypasses RLS.
-- Therefore, having `admin_read_all_*` RLS policies is not only useless, but causes
-- infinite recursion because RLS filters are evaluated for every row during scans,
-- triggering the admin check function which queries the users table, triggering the policy again.

-- Drop the recursive users policy
DROP POLICY IF EXISTS "admin_read_all_users" ON users;

-- Drop other useless admin read policies that could cause recursion or slow down queries
DROP POLICY IF EXISTS "admin_read_all_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_read_all_resumes" ON resumes;
DROP POLICY IF EXISTS "admin_read_all_cover_letters" ON cover_letters;
DROP POLICY IF EXISTS "admin_read_all_job_queue" ON job_queue;
DROP POLICY IF EXISTS "admin_read_all_applications" ON applications;

-- The careers and related tables might have admin_all policies.
-- We will leave them for now unless they cause issues, but to be safe:
DROP POLICY IF EXISTS careers_admin_all ON careers;
DROP POLICY IF EXISTS jobs_admin_all ON jobs;
DROP POLICY IF EXISTS youtube_resources_admin_all ON youtube_resources;
DROP POLICY IF EXISTS roadmaps_admin_all ON roadmaps;
DROP POLICY IF EXISTS roadmap_steps_admin_all ON roadmap_steps;
DROP POLICY IF EXISTS interview_questions_admin_all ON interview_questions;
DROP POLICY IF EXISTS admin_cover_letters_admin_all ON admin_cover_letters;
DROP POLICY IF EXISTS admin_resumes_admin_all ON admin_resumes;
DROP POLICY IF EXISTS notifications_admin_all ON notifications;

-- That's it! RLS recursion is now mathematically impossible because
-- the users table no longer has a SELECT policy that calls an admin function!
