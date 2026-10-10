-- Security audit run-3 hardening (F4-F7). Idempotent; every app write to these tables uses the service role.

-- F4: a client may only snapshot a resume they own.
DROP POLICY IF EXISTS "resume_versions_insert_own" ON public.resume_versions;
CREATE POLICY "resume_versions_insert_own" ON public.resume_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = auth.uid()));

-- F5: clients must not forge queue rows or admin-owned columns; reads stay.
DROP POLICY IF EXISTS "job_queue_insert_own" ON public.job_queue;
DROP POLICY IF EXISTS "job_queue_update_own" ON public.job_queue;
DROP POLICY IF EXISTS "admin_update_job_queue" ON public.job_queue;
REVOKE INSERT, UPDATE ON public.job_queue FROM anon, authenticated;

-- F6: no anonymous inserts; the telemetry route writes with the service role.
DROP POLICY IF EXISTS "insert_telemetry" ON public.autofill_telemetry;
REVOKE INSERT ON public.autofill_telemetry FROM anon, authenticated;

-- F7: gate saved searches like the other paid-feature tables and bound the filters size.
DROP POLICY IF EXISTS paid_service_access ON public.saved_job_searches;
CREATE POLICY paid_service_access ON public.saved_job_searches AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT public.has_paid_service_access())) WITH CHECK ((SELECT public.has_paid_service_access()));
ALTER TABLE public.saved_job_searches DROP CONSTRAINT IF EXISTS saved_job_searches_filters_size;
ALTER TABLE public.saved_job_searches ADD CONSTRAINT saved_job_searches_filters_size CHECK (length(filters::text) <= 4000) NOT VALID;
