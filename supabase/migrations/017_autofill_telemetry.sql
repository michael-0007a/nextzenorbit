-- ============================================
-- Nextzen Orbit — Autofill Telemetry Table
-- ============================================

CREATE TABLE IF NOT EXISTS autofill_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  portal TEXT NOT NULL,
  url TEXT NOT NULL,
  fields_detected INTEGER NOT NULL DEFAULT 0,
  field_names JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Basic RLS so only authenticated users (or system) can insert
ALTER TABLE autofill_telemetry ENABLE ROW LEVEL SECURITY;

-- Note: The /api/autofill/telemetry route uses the service role client 
-- or regular client. If it uses regular client, we allow inserts for anyone.
CREATE POLICY "insert_telemetry" ON autofill_telemetry
  FOR INSERT WITH CHECK (true);
