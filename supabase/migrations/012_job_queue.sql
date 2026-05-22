-- ============================================
-- Nextzen Orbit — Job Queue Table
-- Version: 1.0.0
-- ============================================

-- ── Job Queue Table ──
-- Stores jobs found by the scraper, processed by the Playwright worker.
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  job_url TEXT NOT NULL,
  location TEXT,
  salary_text TEXT,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'adzuna'
    CHECK (source IN ('adzuna', 'jsearch', 'manual')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'applied', 'failed', 'skipped')),
  error_message TEXT,
  cover_letter_id UUID,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_queue_user ON job_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_pending ON job_queue(user_id, status)
  WHERE status = 'pending';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS job_queue_updated_at ON job_queue;
CREATE TRIGGER job_queue_updated_at
  BEFORE UPDATE ON job_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_queue_select_own" ON job_queue;
CREATE POLICY "job_queue_select_own" ON job_queue
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "job_queue_insert_own" ON job_queue;
CREATE POLICY "job_queue_insert_own" ON job_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "job_queue_update_own" ON job_queue;
CREATE POLICY "job_queue_update_own" ON job_queue
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "job_queue_delete_own" ON job_queue;
CREATE POLICY "job_queue_delete_own" ON job_queue
  FOR DELETE USING (auth.uid() = user_id);
