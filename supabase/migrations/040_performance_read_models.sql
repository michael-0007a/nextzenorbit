BEGIN;

CREATE INDEX IF NOT EXISTS job_queue_user_created ON public.job_queue(user_id,created_at DESC,id);
CREATE INDEX IF NOT EXISTS idx_job_queue_assigned ON public.job_queue(assigned_to,status);
CREATE INDEX IF NOT EXISTS users_role_created ON public.users(role,created_at DESC,id);
CREATE INDEX IF NOT EXISTS resumes_user_updated_live ON public.resumes(user_id,updated_at DESC,id) WHERE deleted_at IS NULL;

-- These policies are row-independent: evaluate the entitlement once per statement.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['profiles','resumes','resume_versions','applications','cover_letters','admin_resumes','admin_cover_letters','careers','jobs','youtube_resources','roadmaps','roadmap_steps','interview_questions','ai_notes','projects','job_queue','notifications','ai_usage'] LOOP
  IF EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname='paid_service_access') THEN
   EXECUTE format('ALTER POLICY paid_service_access ON public.%I USING ((SELECT public.has_paid_service_access())) WITH CHECK ((SELECT public.has_paid_service_access()))',t);
  END IF;
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.performance_admin_stats(p_actor_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM users WHERE id=p_actor_id AND role IN ('supervisor_admin','super_admin') AND NOT is_suspended) THEN RAISE EXCEPTION 'Supervisor required'; END IF;
 WITH user_counts AS (SELECT count(*) FILTER(WHERE role='user') regular,count(*) FILTER(WHERE role='sso_user') sso FROM users),
 queue_counts AS (SELECT count(*) FILTER(WHERE status='pending') pending,count(*) FILTER(WHERE status='applied') applied FROM job_queue),
 client_counts AS (SELECT admin_id,count(*) n FROM client_admin_assignments GROUP BY admin_id),
 applied_counts AS (SELECT applied_by,count(*) n FROM job_queue WHERE status='applied' GROUP BY applied_by),
 pending_counts AS (SELECT assigned_to,count(*) n FROM job_queue WHERE status='pending' GROUP BY assigned_to),
 staff AS (SELECT u.id,u.email,u.role,coalesce(nullif(p.full_name,''),u.email) name,
 coalesce(c.n,0) clients,coalesce(a.n,0) applied,coalesce(q.n,0) pending
 FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN client_counts c ON c.admin_id=u.id
 LEFT JOIN applied_counts a ON a.applied_by=u.id LEFT JOIN pending_counts q ON q.assigned_to=u.id
 WHERE u.role IN ('admin','supervisor_admin','super_admin'))
 SELECT jsonb_build_object('users',jsonb_build_object('regular',uc.regular,'sso',uc.sso,'total',uc.regular+uc.sso),
 'subscriptions',jsonb_build_object('pro_active',(SELECT count(*) FROM subscriptions WHERE plan_id='pro' AND status='active')),
 'queue',jsonb_build_object('pending',qc.pending,'applied',qc.applied,'total',qc.pending+qc.applied),
 'adminPerformance',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'email',email,'name',name,'role',role,
 'clientsCount',clients,'jobsApplied',applied,'jobsPending',pending) ORDER BY id) FROM staff),'[]')) INTO result FROM user_counts uc CROSS JOIN queue_counts qc;
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.performance_admin_users(p_actor_id uuid,p_page integer DEFAULT 1,p_limit integer DEFAULT 50,p_search text DEFAULT '') RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE staff_role text; result jsonb; page_number integer:=greatest(1,coalesce(p_page,1)); page_size integer:=least(100,greatest(1,coalesce(p_limit,50)));
BEGIN
 SELECT role INTO staff_role FROM users WHERE id=p_actor_id AND NOT is_suspended;
 IF staff_role IS NULL OR staff_role NOT IN ('admin','supervisor_admin','super_admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 WITH eligible AS MATERIALIZED (
 SELECT u.id,u.email,u.role,u.created_at,p.full_name,p.avatar_url,p.preferred_role,p.location,p.phone,p.headline,p.assigned_admin_id,s.plan_id,s.status
 FROM users u LEFT JOIN profiles p ON p.user_id=u.id JOIN LATERAL (SELECT plan_id,status FROM subscriptions WHERE user_id=u.id AND status IN ('active','trialing') ORDER BY created_at DESC LIMIT 1) s ON true
 WHERE u.role='user' AND (staff_role<>'admin' OR EXISTS(SELECT 1 FROM client_admin_assignments ca WHERE ca.user_id=u.id AND ca.admin_id=p_actor_id))
 AND (coalesce(p_search,'')='' OR strpos(lower(u.email),lower(p_search))>0 OR strpos(lower(coalesce(p.full_name,'')),lower(p_search))>0)),
 page AS (SELECT * FROM eligible ORDER BY created_at DESC,id LIMIT page_size OFFSET (page_number-1)*page_size),
 counts AS (SELECT q.user_id,jsonb_object_agg(q.status,q.n) AS status_counts FROM (SELECT user_id,status,count(*) n FROM job_queue WHERE user_id IN (SELECT id FROM page) GROUP BY user_id,status) q GROUP BY q.user_id),
 teams AS (SELECT ca.user_id,jsonb_agg(jsonb_build_object('id',a.id,'name',coalesce(nullif(ap.full_name,''),a.email)) ORDER BY a.id) members
 FROM client_admin_assignments ca JOIN users a ON a.id=ca.admin_id LEFT JOIN profiles ap ON ap.user_id=a.id WHERE ca.user_id IN (SELECT id FROM page) GROUP BY ca.user_id)
 SELECT jsonb_build_object('users',coalesce((SELECT jsonb_agg(jsonb_build_object('id',p.id,'email',p.email,'role',p.role,'created_at',p.created_at,
 'profile',jsonb_build_object('full_name',p.full_name,'avatar_url',p.avatar_url,'preferred_role',p.preferred_role,'location',p.location,'phone',p.phone,'headline',p.headline,'assigned_admin_id',p.assigned_admin_id),
 'subscription',jsonb_build_object('plan_id',p.plan_id,'status',p.status),
 'profileComplete',coalesce(length(trim(p.full_name))>0 AND length(trim(p.preferred_role))>0 AND length(trim(p.phone))>0 AND length(trim(p.headline))>0,false),
 'claimedBy',p.assigned_admin_id,'claimedByName',(SELECT m->>'name' FROM jsonb_array_elements(coalesce(t.members,'[]')) m WHERE m->>'id'=p.assigned_admin_id::text LIMIT 1),
 'assignedAdmins',coalesce(t.members,'[]'),'jobCounts',jsonb_build_object('pending',0,'processing',0,'applied',0,'failed',0,'skipped',0)||coalesce(c.status_counts,'{}')) ORDER BY p.created_at DESC,p.id)
 FROM page p LEFT JOIN counts c ON c.user_id=p.id LEFT JOIN teams t ON t.user_id=p.id),'[]'),
 'pagination',jsonb_build_object('page',page_number,'perPage',page_size,'total',(SELECT count(*) FROM eligible),'totalPages',ceil((SELECT count(*) FROM eligible)::numeric/page_size))) INTO result;
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.performance_queue_page(p_actor_id uuid,p_page integer DEFAULT 1,p_limit integer DEFAULT 20,p_search text DEFAULT '',p_completed boolean DEFAULT false,p_status text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE staff_role text; result jsonb; page_number integer:=greatest(1,coalesce(p_page,1));page_size integer:=least(100,greatest(1,coalesce(p_limit,20)));
BEGIN
 SELECT role INTO staff_role FROM users WHERE id=p_actor_id AND NOT is_suspended;
 IF staff_role IS NULL OR staff_role NOT IN ('admin','supervisor_admin','super_admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 WITH eligible AS MATERIALIZED (SELECT u.id,u.email,p.full_name,p.avatar_url,p.preferred_role,p.phone,p.headline,p.assigned_admin_id
 FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.role IN ('user','sso_user') AND NOT u.is_suspended
 AND (staff_role<>'admin' OR EXISTS(SELECT 1 FROM client_admin_assignments ca WHERE ca.user_id=u.id AND ca.admin_id=p_actor_id))
 AND (coalesce(p_search,'')='' OR strpos(lower(u.email),lower(p_search))>0 OR strpos(lower(coalesce(p.full_name,'')),lower(p_search))>0)),
 counts AS (SELECT q.user_id,count(*) FILTER(WHERE status='pending') pending,count(*) FILTER(WHERE status='processing') processing,
 count(*) FILTER(WHERE status='applied') applied,count(*) FILTER(WHERE status='failed') failed,count(*) FILTER(WHERE status='skipped') skipped
 FROM job_queue q WHERE q.user_id IN (SELECT id FROM eligible) AND (p_status IS NULL OR q.status=p_status) GROUP BY q.user_id),
 filtered AS MATERIALIZED (SELECT e.*,coalesce(c.pending,0) pending,coalesce(c.processing,0) processing,coalesce(c.applied,0) applied,coalesce(c.failed,0) failed,coalesce(c.skipped,0) skipped
 FROM eligible e LEFT JOIN counts c ON c.user_id=e.id WHERE NOT p_completed OR (EXISTS(SELECT 1 FROM job_queue WHERE user_id=e.id) AND NOT EXISTS(SELECT 1 FROM job_queue WHERE user_id=e.id AND status<>'applied'))),
 page AS (SELECT * FROM filtered ORDER BY pending DESC,id LIMIT page_size OFFSET (page_number-1)*page_size)
 SELECT jsonb_build_object('users',coalesce((SELECT jsonb_agg(jsonb_build_object('user_id',id,'full_name',coalesce(nullif(full_name,''),'Unknown'),'email',email,
 'avatar_url',avatar_url,'preferred_role',preferred_role,'profile_complete',coalesce(length(trim(full_name))>0 AND length(trim(preferred_role))>0 AND length(trim(phone))>0 AND length(trim(headline))>0,false),
 'is_assigned',EXISTS(SELECT 1 FROM client_admin_assignments ca WHERE ca.user_id=page.id AND ca.admin_id=p_actor_id),
 'claimed_by',assigned_admin_id,'claimed_at',NULL,'jobs','[]'::jsonb,'jobs_loaded',false,
 'job_counts',jsonb_build_object('pending',pending,'processing',processing,'applied',applied,'failed',failed,'skipped',skipped)) ORDER BY pending DESC,id) FROM page),'[]'),
 'pagination',jsonb_build_object('page',page_number,'perPage',page_size,'total',(SELECT count(*) FROM filtered),'totalPages',ceil((SELECT count(*) FROM filtered)::numeric/page_size))) INTO result;
 RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.performance_admin_stats(uuid),public.performance_admin_users(uuid,integer,integer,text),public.performance_queue_page(uuid,integer,integer,text,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.performance_admin_stats(uuid),public.performance_admin_users(uuid,integer,integer,text),public.performance_queue_page(uuid,integer,integer,text,boolean,text) TO service_role;
CREATE OR REPLACE FUNCTION public.performance_admin_analytics(p_actor_id uuid,p_admin_id uuid,p_page integer DEFAULT 1,p_limit integer DEFAULT 10,p_search text DEFAULT '') RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb; page_number integer:=greatest(1,coalesce(p_page,1));page_size integer:=least(100,greatest(1,coalesce(p_limit,10)));
BEGIN
 IF NOT EXISTS(SELECT 1 FROM users WHERE id=p_actor_id AND role IN ('supervisor_admin','super_admin') AND NOT is_suspended) THEN RAISE EXCEPTION 'Supervisor required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM users WHERE id=p_admin_id AND role IN ('admin','supervisor_admin','super_admin')) THEN RETURN NULL; END IF;
 WITH history AS MATERIALIZED (SELECT q.* FROM job_queue q WHERE (q.status='applied' AND q.applied_by=p_admin_id) OR (q.status<>'applied' AND q.assigned_to=p_admin_id)),
 months AS (SELECT to_char(coalesce(applied_at,created_at) AT TIME ZONE 'Asia/Kolkata','YYYY-MM') AS "month",
 count(*) FILTER(WHERE status='applied') applied,count(*) FILTER(WHERE status='failed') failed,count(*) FILTER(WHERE status IN ('pending','processing')) pending FROM history GROUP BY 1),
 clients AS (SELECT u.id,coalesce(nullif(p.full_name,''),'Unknown') name,u.email,count(h.id) FILTER(WHERE h.status='applied') applied,
 count(h.id) FILTER(WHERE h.status='failed') failed,count(h.id) FILTER(WHERE h.status IN ('pending','processing')) pending
 FROM client_admin_assignments ca JOIN users u ON u.id=ca.user_id LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN history h ON h.user_id=u.id
 WHERE ca.admin_id=p_admin_id GROUP BY u.id,p.full_name,u.email),
 filtered AS MATERIALIZED (SELECT id,title,company,status,applied_at,created_at,user_id,job_url FROM history
 WHERE coalesce(p_search,'')='' OR strpos(lower(coalesce(title,'')),lower(p_search))>0 OR strpos(lower(coalesce(company,'')),lower(p_search))>0),
 page AS (SELECT * FROM filtered ORDER BY created_at DESC,id LIMIT page_size OFFSET (page_number-1)*page_size)
 SELECT jsonb_build_object('admin',(SELECT jsonb_build_object('id',u.id,'email',u.email,'name',coalesce(nullif(p.full_name,''),u.email),'role',u.role,'created_at',u.created_at) FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=p_admin_id),
 'currentClients',(SELECT count(*) FROM clients),'monthlyData',coalesce((SELECT jsonb_agg(to_jsonb(m) ORDER BY m."month" DESC) FROM months m),'[]'),
 'clientsData',coalesce((SELECT jsonb_agg(to_jsonb(c) ORDER BY applied DESC,id) FROM clients c),'[]'),
 'allJobs',coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY created_at DESC,id) FROM page p),'[]'),
 'pagination',jsonb_build_object('page',page_number,'perPage',page_size,'total',(SELECT count(*) FROM filtered),'totalPages',ceil((SELECT count(*) FROM filtered)::numeric/page_size))) INTO result;
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.performance_applications(p_user_id uuid,p_page integer DEFAULT 1,p_limit integer DEFAULT 50,p_status text DEFAULT NULL,p_search text DEFAULT '') RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 WITH combined AS MATERIALIZED (
 SELECT a.id,coalesce(a.applied_at,a.created_at) sort_date,to_jsonb(a) item FROM applications a WHERE a.user_id=p_user_id
 UNION ALL
 SELECT q.id,coalesce(q.applied_at,q.created_at),jsonb_build_object('id',q.id,'user_id',q.user_id,'resume_id',q.resume_id,'company',q.company,'position',q.title,'role',q.title,'job_url',q.job_url,'status','applied',
 'applied_at',coalesce(q.applied_at,q.created_at),'salary_range',q.salary_text,'location',q.location,'work_type','any',
 'notes',concat_ws(E'\n\n',CASE q.status WHEN 'pending' THEN '⏳ In Queue to be applied' WHEN 'processing' THEN '🔄 Currently applying...' ELSE '✅ Applied via Admin/AI' END,
 CASE WHEN q.admin_notes IS NOT NULL THEN 'Admin Note: '||q.admin_notes END,q.description),'follow_up_at',NULL,'created_at',q.created_at,'updated_at',coalesce(q.updated_at,q.created_at))
 FROM job_queue q WHERE q.user_id=p_user_id AND q.status IN ('pending','processing','applied')
 AND NOT EXISTS(SELECT 1 FROM applications a WHERE a.user_id=p_user_id AND a.job_url IS NOT NULL AND a.job_url=q.job_url)),
 filtered AS MATERIALIZED (SELECT * FROM combined WHERE (p_status IS NULL OR item->>'status'=p_status)
 AND (coalesce(p_search,'')='' OR strpos(lower(coalesce(item->>'company','')||' '||coalesce(item->>'position','')),lower(p_search))>0)),
 page AS (SELECT * FROM filtered ORDER BY sort_date DESC,id LIMIT least(100,greatest(1,p_limit)) OFFSET (greatest(1,p_page)-1)*least(100,greatest(1,p_limit)))
 SELECT jsonb_build_object('applications',coalesce((SELECT jsonb_agg(item ORDER BY sort_date DESC,id) FROM page),'[]'),
 'counts',jsonb_build_object('total',(SELECT count(*) FROM combined),'interviews',(SELECT count(*) FROM combined WHERE item->>'status'='interview'),'offers',(SELECT count(*) FROM combined WHERE item->>'status'='offer'),'followUps',(SELECT count(*) FROM combined WHERE (item->>'follow_up_at')::timestamptz>now())),
 'pagination',jsonb_build_object('page',greatest(1,p_page),'perPage',least(100,greatest(1,p_limit)),'total',(SELECT count(*) FROM filtered),'totalPages',ceil((SELECT count(*) FROM filtered)::numeric/least(100,greatest(1,p_limit)))))
$$;
CREATE INDEX IF NOT EXISTS applications_user_applied ON public.applications(user_id,applied_at DESC,id);
CREATE INDEX IF NOT EXISTS applications_user_url ON public.applications(user_id,job_url) WHERE job_url IS NOT NULL;
REVOKE ALL ON FUNCTION public.performance_admin_analytics(uuid,uuid,integer,integer,text),public.performance_applications(uuid,integer,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.performance_admin_analytics(uuid,uuid,integer,integer,text),public.performance_applications(uuid,integer,integer,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.performance_resume_metadata(p_actor_id uuid,p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE staff_role text;result jsonb;
BEGIN
 SELECT role INTO staff_role FROM users WHERE id=p_actor_id AND NOT is_suspended;
 IF staff_role IS NULL OR staff_role NOT IN ('admin','supervisor_admin','super_admin') THEN RAISE EXCEPTION 'Admin required';END IF;
 IF staff_role='admin' AND NOT EXISTS(SELECT 1 FROM client_admin_assignments WHERE user_id=p_user_id AND admin_id=p_actor_id) THEN RAISE EXCEPTION 'Client not assigned';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'template_id',r.template_id,'is_base',r.is_base,'version',r.version,'created_at',r.created_at,'updated_at',r.updated_at,
 'has_export_content',coalesce((jsonb_typeof(r.content->'summary'->'text')='string' AND length(btrim(r.content#>>'{summary,text}',E' \t\n\r\f'||chr(160)||chr(65279)))>0),false)
 OR EXISTS(SELECT 1 FROM unnest(ARRAY['experience','education','skills','projects','certifications','languages','custom_sections']) k WHERE CASE WHEN jsonb_typeof(r.content->k)='array' THEN jsonb_array_length(r.content->k)>0 ELSE false END)) ORDER BY r.is_base DESC,r.updated_at DESC,r.id),'[]') INTO result
 FROM resumes r WHERE r.user_id=p_user_id AND r.deleted_at IS NULL;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.performance_resume_metadata(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.performance_resume_metadata(uuid,uuid) TO service_role;
COMMIT;
