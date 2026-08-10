-- Migration: Admin Dashboard Overhaul
-- Adds notifications, admin cover letters, user-level claiming, and pg_cron cleanup.

-- ═══════════════════════════════════════════════
-- 1. Notifications table (simple in-app notifications)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,              -- 'resume_request', 'profile_update', 'admin_message'
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',    -- Flexible payload (e.g., admin_id, resume_id)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;

-- RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY notifications_user_select ON notifications
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Users can update (mark as read) their own notifications
CREATE POLICY notifications_user_update ON notifications
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Admins can read and insert notifications
CREATE POLICY notifications_admin_all ON notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- ═══════════════════════════════════════════════
-- 2. Admin Cover Letters table
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL DEFAULT 'Admin Generated Cover Letter',
  content TEXT NOT NULL,
  company_name TEXT,
  job_title TEXT,
  job_description TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_cover_letters_user_id ON admin_cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_cover_letters_admin_id ON admin_cover_letters(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_cover_letters_expires_at ON admin_cover_letters(expires_at);

-- RLS policies
ALTER TABLE admin_cover_letters ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY admin_cover_letters_admin_all ON admin_cover_letters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Users can read their own admin-generated cover letters
CREATE POLICY admin_cover_letters_user_read ON admin_cover_letters
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- ═══════════════════════════════════════════════
-- 3. Job Queue modifications — user-level claiming
-- ═══════════════════════════════════════════════

ALTER TABLE job_queue ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES users(id);
ALTER TABLE job_queue ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- ═══════════════════════════════════════════════
-- 4. pg_cron cleanup job (auto-delete expired docs)
-- Note: pg_cron must be enabled in Supabase dashboard first.
-- Uncomment when pg_cron is available.
-- ═══════════════════════════════════════════════

-- SELECT cron.schedule(
--   'cleanup-expired-admin-docs',
--   '0 3 * * *',
--   $$
--     DELETE FROM admin_resumes WHERE expires_at < NOW();
--     DELETE FROM admin_cover_letters WHERE expires_at < NOW();
--   $$
-- );
