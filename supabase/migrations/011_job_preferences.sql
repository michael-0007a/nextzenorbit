-- ============================================
-- Nextzen Orbit — Job Preferences on Profiles
-- Version: 1.0.0
-- ============================================

-- Add job preference columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_role TEXT,
  ADD COLUMN IF NOT EXISTS preferred_location TEXT,
  ADD COLUMN IF NOT EXISTS preferred_salary_min INTEGER,
  ADD COLUMN IF NOT EXISTS preferred_salary_max INTEGER,
  ADD COLUMN IF NOT EXISTS preferred_work_type TEXT
    CHECK (preferred_work_type IN ('remote', 'onsite', 'hybrid', 'any')),
  ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
  ADD COLUMN IF NOT EXISTS preferred_portals TEXT[] DEFAULT '{}';

-- Index for common queries by the job scraper
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_role ON profiles(preferred_role)
  WHERE preferred_role IS NOT NULL;
