-- Deploy before the application code. Existing accounts keep their access.
BEGIN;
CREATE TABLE public.signup_applications (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  phone text,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  profile jsonb NOT NULL DEFAULT '{}',
  resume_path text,
  resume_name text,
  consent_version text,
  consented_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  rejection_reason text,
  legacy_account boolean NOT NULL DEFAULT false
);
CREATE INDEX signup_applications_queue ON public.signup_applications(status, submitted_at);
ALTER TABLE public.signup_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY signup_read_own ON public.signup_applications FOR SELECT TO authenticated USING (user_id = auth.uid());
REVOKE ALL ON public.signup_applications FROM anon, authenticated;
GRANT SELECT ON public.signup_applications TO authenticated;
GRANT ALL ON public.signup_applications TO service_role;
INSERT INTO public.signup_applications(user_id, email, status, legacy_account, reviewed_at)
SELECT id, lower(trim(email)), 'approved', true, now() FROM public.users;

-- Retained independently of deleted accounts. Never exposed to applicants.
CREATE TABLE public.registration_blocks (
  kind text NOT NULL CHECK (kind IN ('email', 'phone')),
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(kind, value)
);
ALTER TABLE public.registration_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.registration_blocks FROM anon, authenticated;
GRANT ALL ON public.registration_blocks TO service_role;

CREATE TABLE public.request_limits (
  key text PRIMARY KEY,
  hits integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX request_limits_expiry ON public.request_limits(expires_at);
ALTER TABLE public.request_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.request_limits FROM anon, authenticated;
GRANT ALL ON public.request_limits TO service_role;
CREATE FUNCTION public.consume_request_limit(p_key text, p_limit integer, p_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_hits integer;
BEGIN
  IF p_limit < 1 OR p_seconds < 1 THEN RAISE EXCEPTION 'Invalid limit'; END IF;
  INSERT INTO request_limits AS r(key, hits, expires_at) VALUES(p_key, 1, now() + make_interval(secs => p_seconds))
  ON CONFLICT(key) DO UPDATE SET
    hits = CASE WHEN r.expires_at <= now() THEN 1 ELSE r.hits + 1 END,
    expires_at = CASE WHEN r.expires_at <= now() THEN now() + make_interval(secs => p_seconds) ELSE r.expires_at END
  RETURNING hits INTO v_hits;
  DELETE FROM request_limits WHERE expires_at < now() - interval '1 day';
  RETURN v_hits <= p_limit;
END $$;

-- Deny direct role/account manipulation, even if an old permissive RLS policy exists.
REVOKE INSERT, UPDATE, DELETE ON public.users FROM anon, authenticated;

CREATE FUNCTION public.reject_blocked_registration() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM registration_blocks WHERE kind = 'email' AND value = lower(trim(NEW.email))) THEN
    RAISE EXCEPTION 'Registration is not available for this account';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER reject_blocked_auth_registration BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.reject_blocked_registration();

INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('signup-resumes', 'signup-resumes', false, 5242880,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT(id) DO UPDATE SET public = false;

CREATE FUNCTION public.submit_signup_application(p_user_id uuid, p_profile jsonb, p_resume_path text,
  p_resume_name text, p_content jsonb, p_consent_version text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text; v_phone text; v_field text;
BEGIN
  -- Submission and decisions share a lock so rejection cannot race another application.
  PERFORM pg_advisory_xact_lock(33001);
  SELECT lower(trim(email)) INTO v_email FROM auth.users WHERE id = p_user_id;
  v_phone := regexp_replace(p_profile->>'phone', '[^0-9]', '', 'g');
  IF v_email IS NULL OR coalesce(p_profile->>'phone', '') !~ '^\+[1-9][0-9]{7,14}$' THEN
    RAISE EXCEPTION 'A valid phone number with country code is required';
  END IF;
  IF EXISTS(SELECT 1 FROM signup_applications WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Application already submitted';
  END IF;
  IF EXISTS(SELECT 1 FROM registration_blocks WHERE (kind = 'email' AND value = v_email) OR (kind = 'phone' AND value = v_phone)) THEN
    RAISE EXCEPTION 'Registration is not available for this account';
  END IF;
  FOREACH v_field IN ARRAY ARRAY['full_name', 'headline', 'location', 'preferred_role', 'preferred_location', 'preferred_work_type'] LOOP
    IF length(trim(coalesce(p_profile->>v_field, ''))) = 0 THEN RAISE EXCEPTION 'Complete all required profile details'; END IF;
  END LOOP;
  IF p_consent_version IS DISTINCT FROM '2026-09-16' OR p_resume_path NOT LIKE p_user_id::text || '/%'
    OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id = 'signup-resumes' AND name = p_resume_path) THEN
    RAISE EXCEPTION 'Consent and uploaded resume are required';
  END IF;
  INSERT INTO signup_applications(user_id, email, phone, status, profile, resume_path, resume_name, consent_version, consented_at)
  VALUES(p_user_id, v_email, v_phone, 'pending', p_profile || jsonb_build_object('phone', '+' || v_phone), p_resume_path, p_resume_name, p_consent_version, now());
  INSERT INTO profiles(user_id, full_name, phone, headline, location, preferred_role, preferred_location,
    preferred_work_type, years_of_experience, linkedin_url, has_agreed_to_terms)
  VALUES(p_user_id, p_profile->>'full_name', '+' || v_phone, p_profile->>'headline', p_profile->>'location',
    p_profile->>'preferred_role', p_profile->>'preferred_location', p_profile->>'preferred_work_type',
    (p_profile->>'years_of_experience')::integer, nullif(p_profile->>'linkedin_url', ''), true)
  ON CONFLICT(user_id) DO UPDATE SET full_name = excluded.full_name, phone = excluded.phone,
    headline = excluded.headline, location = excluded.location, preferred_role = excluded.preferred_role,
    preferred_location = excluded.preferred_location, preferred_work_type = excluded.preferred_work_type,
    years_of_experience = excluded.years_of_experience, linkedin_url = excluded.linkedin_url, has_agreed_to_terms = true;
  UPDATE profiles SET preferred_salary_min = (p_profile->>'preferred_salary_min')::integer,
    preferred_salary_max = (p_profile->>'preferred_salary_max')::integer,
    preferred_portals = ARRAY(SELECT jsonb_array_elements_text(coalesce(p_profile->'preferred_portals', '[]'::jsonb)))
    WHERE user_id = p_user_id;
  UPDATE resumes SET is_base = false WHERE user_id = p_user_id AND is_base;
  INSERT INTO resumes(user_id, title, content, is_base, template_id)
  VALUES(p_user_id, 'Uploaded resume', p_content, true, 'classic');
END $$;

CREATE FUNCTION public.review_signup_application(p_user_id uuid, p_reviewer_id uuid, p_decision text, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_application signup_applications;
BEGIN
  PERFORM pg_advisory_xact_lock(33001);
  IF NOT EXISTS(SELECT 1 FROM users WHERE id = p_reviewer_id AND role IN ('super_admin', 'supervisor_admin') AND NOT is_suspended) THEN
    RAISE EXCEPTION 'Supervisor or super admin access required';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') OR p_decision IS NULL THEN RAISE EXCEPTION 'Invalid decision'; END IF;
  SELECT * INTO v_application FROM signup_applications WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_application.status <> 'pending' THEN RAISE EXCEPTION 'Application is no longer pending'; END IF;
  IF p_decision = 'approved' AND EXISTS(SELECT 1 FROM registration_blocks
    WHERE (kind = 'email' AND value = v_application.email) OR (kind = 'phone' AND value = v_application.phone)) THEN
    RAISE EXCEPTION 'Registration is blocked';
  END IF;
  IF p_decision = 'rejected' THEN
    IF length(trim(coalesce(p_reason, ''))) < 3 THEN RAISE EXCEPTION 'A rejection reason is required'; END IF;
    INSERT INTO registration_blocks(kind, value) VALUES('email', v_application.email), ('phone', v_application.phone)
    ON CONFLICT DO NOTHING;
  END IF;
  UPDATE signup_applications SET status = p_decision, reviewed_at = now(), reviewed_by = p_reviewer_id,
    rejection_reason = CASE WHEN p_decision = 'rejected' THEN p_reason ELSE NULL END WHERE user_id = p_user_id;
END $$;

REVOKE ALL ON FUNCTION public.consume_request_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_signup_application(uuid, jsonb, text, text, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.review_signup_application(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_blocked_registration() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_request_limit(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_signup_application(uuid, jsonb, text, text, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.review_signup_application(uuid, uuid, text, text) TO service_role;
COMMIT;
