-- Apply before deploying the expanded onboarding form. Existing accounts retain access.
BEGIN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS application_details jsonb NOT NULL DEFAULT '{}';
CREATE TABLE public.candidate_self_identification (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL, acknowledged_at timestamptz NOT NULL
);
CREATE TABLE public.candidate_work_authorization (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  country text NOT NULL, answers jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.candidate_self_identification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_work_authorization ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.candidate_self_identification, public.candidate_work_authorization FROM anon, authenticated;
GRANT ALL ON public.candidate_self_identification, public.candidate_work_authorization TO service_role;
-- Demographic responses never appear in public profiles, review payloads or matching.
CREATE POLICY candidate_read_own_eeo ON public.candidate_self_identification FOR SELECT TO authenticated USING(auth.uid() = user_id);
CREATE POLICY candidate_read_own_work ON public.candidate_work_authorization FOR SELECT TO authenticated USING(auth.uid() = user_id);
GRANT SELECT ON public.candidate_self_identification, public.candidate_work_authorization TO authenticated;
UPDATE storage.buckets SET file_size_limit = 10485760, allowed_mime_types = ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'] WHERE id = 'signup-resumes';
CREATE OR REPLACE FUNCTION public.submit_signup_application(p_user_id uuid, p_profile jsonb, p_resume_path text,
  p_resume_name text, p_content jsonb, p_consent_version text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text; v_phone text; v_field text;
BEGIN
  IF p_profile#>>'{eeo,acknowledged}' IS DISTINCT FROM 'true' OR p_profile->>'consent' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Acknowledgment and consent are required'; END IF;
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
  FOREACH v_field IN ARRAY ARRAY['full_name', 'preferred_role', 'preferred_work_type', 'experience_range', 'target_country'] LOOP
    IF length(trim(coalesce(p_profile->>v_field, ''))) = 0 THEN RAISE EXCEPTION 'Complete all required profile details'; END IF;
  END LOOP;
  IF p_consent_version IS DISTINCT FROM '2026-09-17' OR p_resume_path NOT LIKE p_user_id::text || '/%'
    OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id = 'signup-resumes' AND name = p_resume_path) THEN
    RAISE EXCEPTION 'Consent and uploaded resume are required';
  END IF;
  INSERT INTO signup_applications(user_id, email, phone, status, profile, resume_path, resume_name, consent_version, consented_at)
  VALUES(p_user_id, v_email, v_phone, 'pending', (p_profile - 'eeo' - 'immigration' - 'work_authorization') || jsonb_build_object('phone', '+' || v_phone), p_resume_path, p_resume_name, p_consent_version, now());
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
  UPDATE profiles SET application_details = p_profile - 'eeo' - 'immigration' - 'work_authorization' - 'consent' WHERE user_id = p_user_id;
  INSERT INTO candidate_self_identification(user_id, answers, acknowledged_at) VALUES(p_user_id, p_profile->'eeo', now());
  INSERT INTO candidate_work_authorization(user_id, country, answers)
  SELECT p_user_id, p_profile->>'target_country', CASE WHEN p_profile->>'target_country' = 'us' THEN p_profile->'immigration' ELSE p_profile->'work_authorization' END
  WHERE p_profile->>'target_country' <> 'in';
END $$;
COMMIT;
