-- Basic AI mock interviews: 5 generated questions, one scored answer per question.
-- Only server routes (service role) read/write it; they enforce ownership.
BEGIN;
CREATE TABLE public.mock_interviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK (length(btrim(role)) BETWEEN 2 AND 120),
 job_description text CHECK (length(job_description) <= 8000),
 questions jsonb NOT NULL CHECK (jsonb_typeof(questions)='array' AND jsonb_array_length(questions) BETWEEN 1 AND 10),
 answers jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(answers)='array'),
 overall integer CHECK (overall BETWEEN 0 AND 100),
 created_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz
);
CREATE INDEX mock_interviews_user_created ON public.mock_interviews(user_id,created_at DESC);
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mock_interviews FROM anon,authenticated;
GRANT ALL ON public.mock_interviews TO service_role;
COMMIT;
