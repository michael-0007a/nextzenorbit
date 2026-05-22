-- ============================================================
-- Migration 013: Screenshot Proof-of-Work columns
-- 
-- Adds screenshot_url and screenshot_expires_at to job_queue
-- for storing auto-apply proof screenshots with 7-day TTL.
-- ============================================================

ALTER TABLE job_queue
  ADD COLUMN screenshot_url TEXT,
  ADD COLUMN screenshot_expires_at TIMESTAMPTZ;

-- Index for cleanup cron queries
CREATE INDEX idx_job_queue_screenshot_expiry
  ON job_queue (screenshot_expires_at)
  WHERE screenshot_url IS NOT NULL;

COMMENT ON COLUMN job_queue.screenshot_url IS 'Supabase Storage URL of post-apply screenshot';
COMMENT ON COLUMN job_queue.screenshot_expires_at IS '7-day expiry timestamp — file deleted after this';
