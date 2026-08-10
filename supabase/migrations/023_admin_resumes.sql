-- Migration: Admin-generated resumes table
-- Admin can generate resumes on behalf of users. These auto-expire after 30 days.

CREATE TABLE IF NOT EXISTS admin_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id),
  job_description TEXT,
  job_title TEXT,
  company TEXT,
  title TEXT NOT NULL DEFAULT 'Admin Generated Resume',
  content JSONB NOT NULL,
  template_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching by user
CREATE INDEX IF NOT EXISTS idx_admin_resumes_user_id ON admin_resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_resumes_admin_id ON admin_resumes(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_resumes_expires_at ON admin_resumes(expires_at);

-- RLS policies
ALTER TABLE admin_resumes ENABLE ROW LEVEL SECURITY;

-- Admins can read/write all admin_resumes
CREATE POLICY admin_resumes_admin_all ON admin_resumes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Users can read their own admin-generated resumes
CREATE POLICY admin_resumes_user_read ON admin_resumes
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Auto-cleanup: Schedule daily cleanup of expired admin resumes
-- Note: This requires pg_cron extension to be enabled in Supabase
-- SELECT cron.schedule('cleanup-expired-admin-resumes', '0 3 * * *', 
--   $$DELETE FROM admin_resumes WHERE expires_at < NOW()$$
-- );
-- Uncomment the above when pg_cron is available in your Supabase project.
