-- ============================================
-- Nextzen Orbit — Resume Versions & Cover Letters
-- Version: 1.0.0
-- ============================================

-- Ensure the update_updated_at function exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Resume Versions Table ──
-- Stores historical versions of resumes for version control
CREATE TABLE IF NOT EXISTS resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  title TEXT NOT NULL,
  template_id TEXT,
  change_summary TEXT, -- e.g. "Updated experience section"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resume_versions_resume ON resume_versions(resume_id);
CREATE INDEX idx_resume_versions_user ON resume_versions(user_id);
CREATE UNIQUE INDEX idx_resume_versions_unique ON resume_versions(resume_id, version_number);

-- RLS
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resume_versions_select_own" ON resume_versions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "resume_versions_insert_own" ON resume_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ── Cover Letters Table ──
-- Stores generated cover letters
CREATE TABLE IF NOT EXISTS cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Cover Letter',
  content TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cover_letters_user ON cover_letters(user_id);
CREATE INDEX idx_cover_letters_resume ON cover_letters(resume_id);

CREATE TRIGGER cover_letters_updated_at
  BEFORE UPDATE ON cover_letters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cover_letters_select_own" ON cover_letters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cover_letters_insert_own" ON cover_letters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cover_letters_update_own" ON cover_letters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cover_letters_delete_own" ON cover_letters
  FOR DELETE USING (auth.uid() = user_id);


