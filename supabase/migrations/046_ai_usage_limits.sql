-- Daily AI allowances (reset at 00:00 UTC/GMT). One row per successful AI action, plus
-- admin requests for extra allowance that supervisors approve or deny.
-- Only server routes (service role) read/write these tables; they enforce ownership and roles.
BEGIN;
CREATE TABLE public.ai_usage_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 bucket text NOT NULL CHECK (bucket IN ('rewrite','cover_letter','light')),
 tokens integer CHECK (tokens >= 0),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_events_user_bucket_created ON public.ai_usage_events(user_id,bucket,created_at DESC);

CREATE TABLE public.ai_quota_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 bucket text NOT NULL CHECK (bucket IN ('rewrite','cover_letter','light')),
 day date NOT NULL,
 reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 3 AND 500),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
 extra integer NOT NULL DEFAULT 0 CHECK (extra BETWEEN 0 AND 500),
 decided_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
 decided_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
-- One open request per admin, bucket and day.
CREATE UNIQUE INDEX ai_quota_requests_one_pending ON public.ai_quota_requests(user_id,bucket,day) WHERE status='pending';
CREATE INDEX ai_quota_requests_status_created ON public.ai_quota_requests(status,created_at DESC);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_quota_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_usage_events, public.ai_quota_requests FROM anon,authenticated;
GRANT ALL ON public.ai_usage_events, public.ai_quota_requests TO service_role;
COMMIT;
