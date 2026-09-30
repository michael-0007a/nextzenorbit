BEGIN;
-- Membership replaces profiles.assigned_admin_id. Preserve that column for old readers only.
CREATE TABLE public.client_admin_assignments (
 user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 admin_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 assigned_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,admin_id)
);
CREATE INDEX client_admin_assignments_admin ON public.client_admin_assignments(admin_id,user_id);
INSERT INTO public.client_admin_assignments(user_id,admin_id)
 SELECT p.user_id,p.assigned_admin_id FROM public.profiles p JOIN public.users a ON a.id=p.assigned_admin_id
 WHERE a.role='admin';
ALTER TABLE public.client_admin_assignments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_admin_assignments FROM anon,authenticated;
GRANT ALL ON public.client_admin_assignments TO service_role;
-- Historical claimed_by was bulk rewritten on allocation; it cannot prove who applied.
ALTER TABLE public.job_queue ADD COLUMN applied_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
CREATE INDEX job_queue_application_credit ON public.job_queue(applied_by,applied_at) WHERE status='applied';
CREATE TABLE public.client_assignment_history (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,admin_ids uuid[] NOT NULL,changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_assignment_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_assignment_history FROM anon,authenticated;
GRANT ALL ON public.client_assignment_history TO service_role;
GRANT USAGE ON SEQUENCE public.client_assignment_history_id_seq TO service_role;
CREATE FUNCTION public.assign_client_admins(p_actor_id uuid,p_user_id uuid,p_admin_ids uuid[]) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE ids uuid[];
BEGIN
 IF NOT EXISTS(SELECT 1 FROM users WHERE id=p_actor_id AND role IN ('supervisor_admin','super_admin') AND NOT is_suspended) THEN RAISE EXCEPTION 'Supervisor required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM users WHERE id=p_user_id AND role IN ('user','sso_user') AND NOT is_suspended) THEN RAISE EXCEPTION 'Client unavailable'; END IF;
 SELECT coalesce(array_agg(DISTINCT x ORDER BY x),'{}'::uuid[]) INTO ids FROM unnest(p_admin_ids) x;
 IF cardinality(ids)>50 OR EXISTS(SELECT 1 FROM unnest(ids) x WHERE x IS NULL OR NOT EXISTS(SELECT 1 FROM users WHERE id=x AND role='admin' AND NOT is_suspended)) THEN RAISE EXCEPTION 'Choose active admins'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,39));
 DELETE FROM client_admin_assignments WHERE user_id=p_user_id AND NOT(admin_id=ANY(ids));
 INSERT INTO client_admin_assignments(user_id,admin_id) SELECT p_user_id,x FROM unnest(ids) x ON CONFLICT DO NOTHING;
 UPDATE profiles SET assigned_admin_id=ids[1] WHERE user_id=p_user_id;
 -- Release unfinished work owned by removed members; never rewrite completed credit.
 UPDATE job_queue SET assigned_to=NULL,assigned_at=NULL WHERE user_id=p_user_id AND status<>'applied' AND assigned_to IS NOT NULL AND NOT(assigned_to=ANY(ids));
 INSERT INTO client_assignment_history(user_id,actor_id,admin_ids) VALUES(p_user_id,p_actor_id,ids);
END $$;
REVOKE ALL ON FUNCTION public.assign_client_admins(uuid,uuid,uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.assign_client_admins(uuid,uuid,uuid[]) TO service_role;

CREATE FUNCTION public.update_team_queue_job(p_actor_id uuid,p_id uuid,p_status text DEFAULT NULL,p_action text DEFAULT NULL,p_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE staff_role text; item job_queue;
BEGIN
 SELECT role INTO staff_role FROM users WHERE id=p_actor_id AND NOT is_suspended;
 IF staff_role IS NULL OR staff_role NOT IN ('admin','supervisor_admin','super_admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 SELECT * INTO item FROM job_queue WHERE id=p_id;
 IF item.id IS NULL THEN RAISE EXCEPTION 'Job unavailable'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(item.user_id::text,39));
 SELECT * INTO item FROM job_queue WHERE id=p_id FOR UPDATE;
 IF item.id IS NULL THEN RAISE EXCEPTION 'Job unavailable'; END IF;
 IF p_status IS NOT NULL AND p_action IS NOT NULL THEN RAISE EXCEPTION 'Choose a status or an ownership action'; END IF;
 IF staff_role='admin' AND NOT EXISTS(SELECT 1 FROM client_admin_assignments WHERE user_id=item.user_id AND admin_id=p_actor_id) THEN RAISE EXCEPTION 'Client not assigned'; END IF;
 IF p_status IS NOT NULL AND p_status NOT IN ('pending','processing','applied','failed','skipped') THEN RAISE EXCEPTION 'Invalid status'; END IF;
 IF p_action IS NOT NULL AND p_action NOT IN ('claim','unclaim') THEN RAISE EXCEPTION 'Invalid action'; END IF;
 IF item.status='applied' THEN
  IF p_status IS NOT NULL AND p_status<>'applied' THEN RAISE EXCEPTION 'Completed applications cannot be reopened'; END IF;
  IF p_action IS NOT NULL THEN RAISE EXCEPTION 'Completed applications cannot be reassigned'; END IF;
 ELSE
  IF staff_role='admin' AND item.assigned_to IS NOT NULL AND item.assigned_to<>p_actor_id THEN RAISE EXCEPTION 'This job is already owned by another admin'; END IF;
  IF p_action='unclaim' THEN item.assigned_to:=NULL;item.assigned_at:=NULL;
  ELSIF p_action='claim' OR p_status IS NOT NULL THEN item.assigned_to:=p_actor_id;item.assigned_at:=coalesce(item.assigned_at,now()); END IF;
  IF p_status IS NOT NULL THEN item.status:=p_status; END IF;
  IF p_status='applied' THEN item.applied_at:=now();item.applied_by:=p_actor_id; END IF;
 END IF;
 UPDATE job_queue SET status=item.status,assigned_to=item.assigned_to,assigned_at=item.assigned_at,
 applied_at=item.applied_at,applied_by=item.applied_by,admin_notes=coalesce(p_notes,admin_notes)
 WHERE id=p_id RETURNING * INTO item;
 RETURN to_jsonb(item);
END $$;
REVOKE ALL ON FUNCTION public.update_team_queue_job(uuid,uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.update_team_queue_job(uuid,uuid,text,text,text) TO service_role;

-- Aggregate inside PostgreSQL so API row limits cannot silently truncate progress.
CREATE FUNCTION public.client_target_report(p_actor_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE staff_role text; result jsonb; today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
 SELECT role INTO staff_role FROM users WHERE id=p_actor_id AND NOT is_suspended;
 IF staff_role IS NULL OR staff_role NOT IN ('admin','supervisor_admin','super_admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 SELECT coalesce(jsonb_agg(row_data ORDER BY row_data->>'name'),'[]') INTO result FROM (
 SELECT jsonb_build_object('id',u.id,'name',coalesce(nullif(p.full_name,''),u.email),'plan',s.plan_id,
 'active',coalesce((s.status='active' AND s.current_period_end>now()) OR (s.status='trialing' AND s.trial_ends_at>now()),false),
 'team',coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'name',coalesce(nullif(ap.full_name,''),a.email),'since',ca.assigned_at) ORDER BY a.id)
 FROM client_admin_assignments ca JOIN users a ON a.id=ca.admin_id LEFT JOIN profiles ap ON ap.user_id=a.id WHERE ca.user_id=u.id AND NOT a.is_suspended AND a.role='admin'),'[]'),
 'counts',coalesce((SELECT jsonb_agg(jsonb_build_object('adminId',c.applied_by,'month',c.month_count,'week',c.week_count,'day',c.day_count)) FROM (
 SELECT q.applied_by,count(*) month_count,
 count(*) FILTER(WHERE (q.applied_at AT TIME ZONE 'Asia/Kolkata')::date>=date_trunc('week',today)::date) week_count,
 count(*) FILTER(WHERE (q.applied_at AT TIME ZONE 'Asia/Kolkata')::date=today) day_count
 FROM job_queue q WHERE q.user_id=u.id AND q.status='applied' AND q.applied_at>=date_trunc('month',today::timestamp) AT TIME ZONE 'Asia/Kolkata'
 AND q.applied_at<(date_trunc('month',today::timestamp)+interval '1 month') AT TIME ZONE 'Asia/Kolkata' GROUP BY q.applied_by) c),'[]')) row_data
 FROM users u LEFT JOIN profiles p ON p.user_id=u.id
 LEFT JOIN LATERAL(SELECT * FROM subscriptions WHERE user_id=u.id ORDER BY created_at DESC LIMIT 1) s ON true
 WHERE u.role IN ('user','sso_user') AND NOT u.is_suspended
 AND (staff_role<>'admin' OR EXISTS(SELECT 1 FROM client_admin_assignments WHERE user_id=u.id AND admin_id=p_actor_id))
 ) rows;
 RETURN jsonb_build_object('date',today,'clients',result);
END $$;
REVOKE ALL ON FUNCTION public.client_target_report(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.client_target_report(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_search_jobs(p_user_id uuid,p_actor_id uuid,p_jobs jsonb,p_resume_id uuid DEFAULT NULL,p_admin_resume_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_role text; item jsonb; inserted job_queue; all_rows jsonb := '[]'; added integer := 0; found_row job_queue;
BEGIN
  SELECT role INTO actor_role FROM users WHERE id=p_actor_id AND NOT is_suspended;
  IF actor_role IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF p_actor_id <> p_user_id AND actor_role NOT IN ('admin','supervisor_admin','super_admin') THEN RAISE EXCEPTION 'Access denied'; END IF;
  IF actor_role='admin' AND NOT EXISTS(SELECT 1 FROM client_admin_assignments WHERE user_id=p_user_id AND admin_id=p_actor_id) THEN RAISE EXCEPTION 'Client not assigned'; END IF;
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

CREATE OR REPLACE FUNCTION public.save_admin_document(p_id uuid,p_owner_id uuid,p_kind text,p_title text,p_payload jsonb,p_client_id uuid DEFAULT NULL)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE staff_role text; existing admin_documents; assigned_id uuid;
BEGIN
 SELECT role INTO staff_role FROM users WHERE id=p_owner_id AND NOT is_suspended;
 IF staff_role IS NULL OR staff_role NOT IN ('admin','supervisor_admin','super_admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 IF p_kind NOT IN ('resume','cover_letter') THEN RAISE EXCEPTION 'Invalid document type'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_id::text,38));
 SELECT * INTO existing FROM admin_documents WHERE id=p_id;
 IF existing.id IS NOT NULL AND (existing.owner_id<>p_owner_id OR existing.kind<>p_kind) THEN RAISE EXCEPTION 'Document unavailable'; END IF;
 IF p_client_id IS NOT NULL THEN
  IF NOT EXISTS(SELECT 1 FROM users WHERE id=p_client_id AND role IN ('user','sso_user') AND NOT is_suspended) THEN RAISE EXCEPTION 'Client unavailable'; END IF;
  IF staff_role='admin' AND NOT EXISTS(SELECT 1 FROM client_admin_assignments WHERE user_id=p_client_id AND admin_id=p_owner_id) THEN RAISE EXCEPTION 'Client not assigned'; END IF;
  IF existing.assigned_client_id=p_client_id THEN assigned_id:=existing.assigned_document_id; END IF;
  IF p_kind='resume' THEN
   IF assigned_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM admin_resumes WHERE id=assigned_id AND user_id=p_client_id AND admin_id=p_owner_id) THEN assigned_id:=NULL; END IF;
   IF assigned_id IS NULL THEN
    INSERT INTO admin_resumes(user_id,admin_id,title,content,template_id,job_title,company,job_description)
    VALUES(p_client_id,p_owner_id,p_title,p_payload->'resume',p_payload->>'templateId',p_payload->>'jobTitle',p_payload->>'company',p_payload->>'jobDescription') RETURNING id INTO assigned_id;
   ELSE
    UPDATE admin_resumes SET title=p_title,content=p_payload->'resume',template_id=p_payload->>'templateId',job_title=p_payload->>'jobTitle',company=p_payload->>'company',job_description=p_payload->>'jobDescription',expires_at=now()+interval '30 days' WHERE id=assigned_id;
   END IF;
  ELSE
   IF assigned_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM admin_cover_letters WHERE id=assigned_id AND user_id=p_client_id AND admin_id=p_owner_id) THEN assigned_id:=NULL; END IF;
   IF assigned_id IS NULL THEN
    INSERT INTO admin_cover_letters(user_id,admin_id,title,content,job_title,company_name)
    VALUES(p_client_id,p_owner_id,p_title,p_payload->>'letter',p_payload->>'jobTitle',p_payload->>'company') RETURNING id INTO assigned_id;
   ELSE
    UPDATE admin_cover_letters SET title=p_title,content=p_payload->>'letter',job_title=p_payload->>'jobTitle',company_name=p_payload->>'company',expires_at=now()+interval '30 days' WHERE id=assigned_id;
   END IF;
  END IF;
 END IF;
 INSERT INTO admin_documents(id,owner_id,kind,title,payload,assigned_client_id,assigned_document_id)
 VALUES(p_id,p_owner_id,p_kind,p_title,p_payload,p_client_id,assigned_id)
 ON CONFLICT(id) DO UPDATE SET title=excluded.title,payload=excluded.payload,updated_at=now(),
 assigned_client_id=coalesce(excluded.assigned_client_id,admin_documents.assigned_client_id),assigned_document_id=coalesce(excluded.assigned_document_id,admin_documents.assigned_document_id);
 RETURN jsonb_build_object('id',p_id,'assigned_document_id',assigned_id);
END $$;
REVOKE ALL ON FUNCTION public.save_admin_document(uuid,uuid,text,text,jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_admin_document(uuid,uuid,text,text,jsonb,uuid) TO service_role;

COMMIT;
