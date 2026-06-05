-- ============================================
-- Nextzen Orbit — Career Workspace Tables
-- Version: 1.0.0
-- ============================================

-- ============================================
-- 1. CAREERS
-- ============================================
CREATE TABLE IF NOT EXISTS careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_careers_slug ON careers(slug);

DROP TRIGGER IF EXISTS careers_updated_at ON careers;
CREATE TRIGGER careers_updated_at
  BEFORE UPDATE ON careers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE careers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS careers_select_all ON careers;
CREATE POLICY careers_select_all ON careers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS careers_admin_all ON careers;
CREATE POLICY careers_admin_all ON careers
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));


-- ============================================
-- 2. JOBS (AGGREGATED)
-- ============================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  apply_url TEXT,
  source TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_source_ref
  ON jobs(source, source_ref)
  WHERE source_ref IS NOT NULL;

DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jobs_select_all ON jobs;
CREATE POLICY jobs_select_all ON jobs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS jobs_admin_all ON jobs;
CREATE POLICY jobs_admin_all ON jobs
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));


-- ============================================
-- 3. YOUTUBE RESOURCES
-- ============================================
CREATE TABLE IF NOT EXISTS youtube_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID REFERENCES careers(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT,
  channel TEXT,
  topic TEXT,
  difficulty TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_youtube_resources_url
  ON youtube_resources(url);
CREATE INDEX IF NOT EXISTS idx_youtube_resources_role_topic
  ON youtube_resources(role, topic);

DROP TRIGGER IF EXISTS youtube_resources_updated_at ON youtube_resources;
CREATE TRIGGER youtube_resources_updated_at
  BEFORE UPDATE ON youtube_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE youtube_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS youtube_resources_select_all ON youtube_resources;
CREATE POLICY youtube_resources_select_all ON youtube_resources
  FOR SELECT USING (true);

DROP POLICY IF EXISTS youtube_resources_admin_all ON youtube_resources;
CREATE POLICY youtube_resources_admin_all ON youtube_resources
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));


-- ============================================
-- 4. ROADMAPS
-- ============================================
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID REFERENCES careers(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmaps_role ON roadmaps(role);

DROP TRIGGER IF EXISTS roadmaps_updated_at ON roadmaps;
CREATE TRIGGER roadmaps_updated_at
  BEFORE UPDATE ON roadmaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadmaps_select_all ON roadmaps;
CREATE POLICY roadmaps_select_all ON roadmaps
  FOR SELECT USING (true);

DROP POLICY IF EXISTS roadmaps_admin_all ON roadmaps;
CREATE POLICY roadmaps_admin_all ON roadmaps
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));


-- ============================================
-- 5. ROADMAP STEPS
-- ============================================
CREATE TABLE IF NOT EXISTS roadmap_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  level TEXT NOT NULL DEFAULT 'beginner'
    CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (roadmap_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_roadmap_steps_roadmap
  ON roadmap_steps(roadmap_id, order_index);

DROP TRIGGER IF EXISTS roadmap_steps_updated_at ON roadmap_steps;
CREATE TRIGGER roadmap_steps_updated_at
  BEFORE UPDATE ON roadmap_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE roadmap_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadmap_steps_select_all ON roadmap_steps;
CREATE POLICY roadmap_steps_select_all ON roadmap_steps
  FOR SELECT USING (true);

DROP POLICY IF EXISTS roadmap_steps_admin_all ON roadmap_steps;
CREATE POLICY roadmap_steps_admin_all ON roadmap_steps
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));


-- ============================================
-- 6. INTERVIEW QUESTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID REFERENCES careers(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  company TEXT,
  difficulty TEXT,
  topic TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_questions_role
  ON interview_questions(role);
CREATE INDEX IF NOT EXISTS idx_interview_questions_filters
  ON interview_questions(role, company, difficulty, topic);

DROP TRIGGER IF EXISTS interview_questions_updated_at ON interview_questions;
CREATE TRIGGER interview_questions_updated_at
  BEFORE UPDATE ON interview_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS interview_questions_select_all ON interview_questions;
CREATE POLICY interview_questions_select_all ON interview_questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS interview_questions_admin_all ON interview_questions;
CREATE POLICY interview_questions_admin_all ON interview_questions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));


-- ============================================
-- 7. AI NOTES (USER OWNED)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL,
  generated_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role, topic)
);

CREATE INDEX IF NOT EXISTS idx_ai_notes_user_topic
  ON ai_notes(user_id, topic);

DROP TRIGGER IF EXISTS ai_notes_updated_at ON ai_notes;
CREATE TRIGGER ai_notes_updated_at
  BEFORE UPDATE ON ai_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE ai_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_notes_select_own ON ai_notes;
CREATE POLICY ai_notes_select_own ON ai_notes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS ai_notes_insert_own ON ai_notes;
CREATE POLICY ai_notes_insert_own ON ai_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS ai_notes_update_own ON ai_notes;
CREATE POLICY ai_notes_update_own ON ai_notes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS ai_notes_delete_own ON ai_notes;
CREATE POLICY ai_notes_delete_own ON ai_notes
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- 8. PROJECTS (USER OWNED)
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  github_url TEXT,
  description TEXT,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  screenshots TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_select_own ON projects;
CREATE POLICY projects_select_own ON projects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS projects_insert_own ON projects;
CREATE POLICY projects_insert_own ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS projects_update_own ON projects;
CREATE POLICY projects_update_own ON projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS projects_delete_own ON projects;
CREATE POLICY projects_delete_own ON projects
  FOR DELETE USING (auth.uid() = user_id);
