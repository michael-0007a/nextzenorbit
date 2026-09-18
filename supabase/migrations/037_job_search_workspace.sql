BEGIN;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS first_seen_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;
ALTER TABLE public.job_queue ADD COLUMN IF NOT EXISTS catalog_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admin_resume_id uuid REFERENCES public.admin_resumes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_key text;
-- Preserve every historical row. Older duplicates stay readable and are never deleted.
WITH ranked AS (SELECT id, md5(regexp_replace(split_part(job_url, '#', 1), '/$', '')) AS key,
  row_number() OVER(PARTITION BY user_id, md5(regexp_replace(split_part(job_url, '#', 1), '/$', '')) ORDER BY created_at, id) AS n FROM job_queue)
UPDATE job_queue q SET job_key = CASE WHEN ranked.n = 1 THEN ranked.key ELSE NULL END FROM ranked WHERE q.id = ranked.id;
CREATE UNIQUE INDEX job_queue_client_key ON public.job_queue(user_id, job_key) WHERE job_key IS NOT NULL;
CREATE FUNCTION public.set_queue_job_key() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  NEW.job_key := md5(regexp_replace(split_part(NEW.job_url, '#', 1), '/$', '')); RETURN NEW;
END $$;
CREATE TRIGGER queue_job_key BEFORE INSERT OR UPDATE OF job_url ON public.job_queue FOR EACH ROW EXECUTE FUNCTION public.set_queue_job_key();
CREATE TABLE public.saved_job_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK(length(title) BETWEEN 1 AND 100), filters jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_job_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY saved_search_owner ON public.saved_job_searches FOR ALL TO authenticated USING(auth.uid() = user_id) WITH CHECK(auth.uid() = user_id);
GRANT SELECT, INSERT, DELETE ON public.saved_job_searches TO authenticated;
GRANT ALL ON public.saved_job_searches TO service_role;

CREATE FUNCTION public.store_job_results(p_jobs jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item jsonb; stored jobs; result jsonb := '[]';
BEGIN
  IF jsonb_array_length(p_jobs) > 50 THEN RAISE EXCEPTION 'Too many jobs'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_jobs) LOOP
    INSERT INTO jobs(company,title,description,location,apply_url,source,source_ref,country,details,last_checked_at)
    VALUES(item->>'company',item->>'title',item->>'description',item->>'location',item->>'job_url','adzuna',(item->>'country') || ':' || (item->>'id'),item->>'country',item,now())
    ON CONFLICT(source,source_ref) WHERE source_ref IS NOT NULL DO UPDATE SET
      title=excluded.title,company=excluded.company,description=excluded.description,location=excluded.location,apply_url=excluded.apply_url,
      country=excluded.country,details=excluded.details,last_checked_at=now(),closed_at=NULL
    RETURNING * INTO stored;
    result := result || jsonb_build_array(item || jsonb_build_object('catalog_id',stored.id,'first_seen',stored.first_seen_at,'last_checked',stored.last_checked_at));
  END LOOP;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.store_job_results(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.store_job_results(jsonb) TO service_role;

CREATE FUNCTION public.enqueue_search_jobs(p_user_id uuid,p_actor_id uuid,p_jobs jsonb,p_resume_id uuid DEFAULT NULL,p_admin_resume_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_role text; item jsonb; inserted job_queue; all_rows jsonb := '[]'; added integer := 0; found_row job_queue;
BEGIN
  SELECT role INTO actor_role FROM users WHERE id=p_actor_id AND NOT is_suspended;
  IF actor_role IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF p_actor_id <> p_user_id AND actor_role NOT IN ('admin','supervisor_admin','super_admin') THEN RAISE EXCEPTION 'Access denied'; END IF;
  IF actor_role='admin' AND NOT EXISTS(SELECT 1 FROM profiles WHERE user_id=p_user_id AND assigned_admin_id=p_actor_id) THEN RAISE EXCEPTION 'Client not assigned'; END IF;
  IF NOT EXISTS(SELECT 1 FROM users WHERE id=p_user_id AND NOT is_suspended) THEN RAISE EXCEPTION 'Client unavailable'; END IF;
  IF p_resume_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM resumes WHERE id=p_resume_id AND user_id=p_user_id AND deleted_at IS NULL) THEN RAISE EXCEPTION 'Invalid resume'; END IF;
  IF p_admin_resume_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM admin_resumes WHERE id=p_admin_resume_id AND user_id=p_user_id AND expires_at>now()) THEN RAISE EXCEPTION 'Invalid generated resume'; END IF;
  IF p_resume_id IS NOT NULL AND p_admin_resume_id IS NOT NULL THEN RAISE EXCEPTION 'Choose one resume'; END IF;
  IF jsonb_array_length(p_jobs) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Choose 1 to 50 jobs'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 37));
  FOR item IN SELECT value FROM jsonb_array_elements(p_jobs) LOOP
    IF coalesce(item->>'job_url','') !~ '^https?://' OR coalesce(item->>'title','')='' THEN RAISE EXCEPTION 'Invalid job'; END IF;
    SELECT * INTO found_row FROM job_queue WHERE user_id=p_user_id AND (job_key=md5(regexp_replace(split_part(item->>'job_url','#',1),'/$','')) OR (catalog_id IS NOT NULL AND catalog_id=nullif(item->>'catalog_id','')::uuid)) LIMIT 1;
    IF found_row.id IS NOT NULL THEN all_rows := all_rows || to_jsonb(found_row); CONTINUE; END IF;
    INSERT INTO job_queue(user_id,title,company,job_url,location,salary_text,description,source,status,resume_id,admin_resume_id,catalog_id,assigned_to,assigned_at)
    VALUES(p_user_id,item->>'title',item->>'company',item->>'job_url',item->>'location',item->>'salary_text',item->>'description','adzuna','pending',p_resume_id,p_admin_resume_id,nullif(item->>'catalog_id','')::uuid,
      CASE WHEN actor_role IN ('admin','supervisor_admin','super_admin') THEN p_actor_id ELSE NULL END,
      CASE WHEN actor_role IN ('admin','supervisor_admin','super_admin') THEN now() ELSE NULL END)
    ON CONFLICT(user_id,job_key) WHERE job_key IS NOT NULL DO NOTHING RETURNING * INTO inserted;
    IF inserted.id IS NOT NULL THEN added:=added+1;all_rows:=all_rows||to_jsonb(inserted); END IF;
  END LOOP;
  RETURN jsonb_build_object('added',added,'jobs',all_rows,'queuedUrls',(SELECT coalesce(jsonb_agg(value->>'job_url'),'[]') FROM jsonb_array_elements(all_rows)));
END $$;
REVOKE ALL ON FUNCTION public.enqueue_search_jobs(uuid,uuid,jsonb,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_search_jobs(uuid,uuid,jsonb,uuid,uuid) TO service_role;
COMMIT;
