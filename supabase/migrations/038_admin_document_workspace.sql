BEGIN;
CREATE TABLE public.admin_documents (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('resume','cover_letter')), title text NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
 payload jsonb NOT NULL, assigned_client_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
 assigned_document_id uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_documents_owner_updated ON public.admin_documents(owner_id,updated_at DESC);
ALTER TABLE public.admin_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_documents FROM anon, authenticated;
GRANT SELECT, DELETE ON public.admin_documents TO authenticated;
GRANT ALL ON public.admin_documents TO service_role;
CREATE POLICY admin_document_owner ON public.admin_documents FOR ALL TO authenticated
 USING(owner_id=auth.uid() AND EXISTS(SELECT 1 FROM public.users WHERE id=auth.uid() AND role IN ('admin','supervisor_admin','super_admin') AND NOT is_suspended))
 WITH CHECK(owner_id=auth.uid());
CREATE FUNCTION public.save_admin_document(p_id uuid,p_owner_id uuid,p_kind text,p_title text,p_payload jsonb,p_client_id uuid DEFAULT NULL)
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
  IF staff_role='admin' AND NOT EXISTS(SELECT 1 FROM profiles WHERE user_id=p_client_id AND assigned_admin_id=p_owner_id) THEN RAISE EXCEPTION 'Client not assigned'; END IF;
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
