BEGIN;
CREATE TABLE IF NOT EXISTS public.document_jobs (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 operation text NOT NULL CHECK(operation IN ('generate_resume','generate_cover_letter','parse_resume')),
 payload jsonb NOT NULL, result jsonb, status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','succeeded','failed')),
 attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(),
 lease_until timestamptz, lease_token uuid, error text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.document_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.document_jobs FROM anon,authenticated;
GRANT ALL ON public.document_jobs TO service_role;
CREATE INDEX IF NOT EXISTS document_jobs_ready ON public.document_jobs(available_at,created_at) WHERE status IN ('queued','running');
CREATE INDEX IF NOT EXISTS document_jobs_owner ON public.document_jobs(user_id,created_at DESC);
CREATE OR REPLACE FUNCTION public.claim_document_job(p_id uuid) RETURNS SETOF public.document_jobs
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 UPDATE document_jobs SET status='running',attempts=attempts+1,lease_until=now()+interval '90 seconds',lease_token=gen_random_uuid(),updated_at=now()
 WHERE id=p_id AND attempts<3 AND ((status='queued' AND available_at<=now()) OR (status='running' AND lease_until<now())) RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_document_job(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_document_job(uuid) TO service_role;
COMMIT;
