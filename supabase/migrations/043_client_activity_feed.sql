-- Client progress feed: read-only timeline of work the team did for a client,
-- built from existing tables (no new writes in admin routes).
BEGIN;
CREATE INDEX IF NOT EXISTS job_queue_client_applied ON public.job_queue(user_id,applied_at DESC) WHERE status='applied';
CREATE INDEX IF NOT EXISTS admin_resumes_client_created ON public.admin_resumes(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS admin_cover_letters_client_created ON public.admin_cover_letters(user_id,created_at DESC);

CREATE FUNCTION public.client_activity(p_user_id uuid,p_before timestamptz DEFAULT NULL,p_limit integer DEFAULT 20)
RETURNS TABLE(kind text,title text,detail text,actor_name text,happened_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 WITH events AS (
  SELECT 'applied'::text AS kind,q.title,q.company AS detail,q.applied_by AS actor,q.applied_at AS happened_at
   FROM job_queue q WHERE q.user_id=p_user_id AND q.status='applied' AND q.applied_at IS NOT NULL
  UNION ALL
  SELECT 'resume',coalesce(nullif(r.job_title,''),r.title),r.company,r.admin_id,r.created_at
   FROM admin_resumes r WHERE r.user_id=p_user_id
  UNION ALL
  SELECT 'cover_letter',coalesce(nullif(c.job_title,''),c.title),c.company_name,c.admin_id,c.created_at
   FROM admin_cover_letters c WHERE c.user_id=p_user_id
 )
 SELECT e.kind,e.title,e.detail,
  -- First name only: clients see who helped, never staff emails.
  nullif(split_part(trim(p.full_name),' ',1),''),e.happened_at
 FROM events e LEFT JOIN profiles p ON p.user_id=e.actor
 WHERE p_before IS NULL OR e.happened_at<p_before
 ORDER BY e.happened_at DESC
 LIMIT least(greatest(coalesce(p_limit,20),1),50)
$$;

CREATE FUNCTION public.client_activity_summary(p_user_id uuid,p_since timestamptz)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object(
  'applied',(SELECT count(*) FROM job_queue WHERE user_id=p_user_id AND status='applied' AND applied_at>=p_since),
  'resumes',(SELECT count(*) FROM admin_resumes WHERE user_id=p_user_id AND created_at>=p_since),
  'cover_letters',(SELECT count(*) FROM admin_cover_letters WHERE user_id=p_user_id AND created_at>=p_since))
$$;

-- Callers pass the signed-in user's id from the server; never callable directly by clients.
REVOKE ALL ON FUNCTION public.client_activity(uuid,timestamptz,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.client_activity_summary(uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.client_activity(uuid,timestamptz,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.client_activity_summary(uuid,timestamptz) TO service_role;
COMMIT;
