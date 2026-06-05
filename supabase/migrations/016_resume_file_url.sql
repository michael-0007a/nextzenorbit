-- ============================================
-- Nextzen Orbit — Ensure resumes.file_url exists
-- Version: 1.0.0
-- ============================================

ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_url TEXT;
