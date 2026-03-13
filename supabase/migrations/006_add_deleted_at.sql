-- ============================================
-- Nextzen Orbit — Add deleted_at column for soft deletes
-- Version: 1.0.2
-- ============================================

-- Add deleted_at column to resumes table for soft deletes
ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for faster queries filtering out deleted resumes
CREATE INDEX IF NOT EXISTS idx_resumes_deleted_at ON resumes(deleted_at);

