-- Each checkout survives subsequent attempts. Payment and entitlement commit together.
-- Older installations still have the original Razorpay/Cashfree schema.
-- Establish PayU support before referencing its transaction column or provider.
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS payu_subscription_id text;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_provider_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_provider_check
  CHECK (provider IN ('razorpay','cashfree','payu','usd_gateway'));

CREATE TABLE IF NOT EXISTS public.payment_orders (
  txnid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL CHECK (plan_id IN ('free','pro','elite')),
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  currency text NOT NULL CHECK (currency = 'INR'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  provider_payment_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS payment_orders_user_idx ON public.payment_orders(user_id, created_at DESC);
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_orders FROM anon, authenticated;
GRANT ALL ON public.payment_orders TO service_role;
INSERT INTO public.payment_orders(txnid,user_id,plan_id,amount_paise,currency,status,paid_at)
SELECT payu_subscription_id,user_id,plan_id,amount_paise,currency,
  CASE WHEN status='active' THEN 'paid' ELSE 'pending' END,
  CASE WHEN status='active' THEN current_period_start END
FROM public.subscriptions WHERE payu_subscription_id IS NOT NULL AND amount_paise > 0 AND currency='INR'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.complete_payu_payment(p_txnid text,p_amount_paise integer,p_payment_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.payment_orders; end_at timestamptz;
BEGIN
  SELECT * INTO o FROM public.payment_orders WHERE txnid=p_txnid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown payment transaction'; END IF;
  IF o.amount_paise <> p_amount_paise OR nullif(p_payment_id,'') IS NULL THEN RAISE EXCEPTION 'Payment details do not match'; END IF;
  IF o.status='paid' THEN RETURN; END IF;
  -- Serializes different successful checkouts belonging to the same account.
  PERFORM 1 FROM public.users WHERE id=o.user_id FOR UPDATE;
  SELECT current_period_end INTO end_at FROM public.subscriptions WHERE user_id=o.user_id AND status='active';
  INSERT INTO public.subscriptions(user_id,provider,plan_id,status,currency,amount_paise,payu_subscription_id,current_period_start,current_period_end)
  VALUES(o.user_id,'payu',o.plan_id,'active',o.currency,o.amount_paise,o.txnid,now(),greatest(now(),coalesce(end_at,now()))+interval '30 days')
  ON CONFLICT(user_id) DO UPDATE SET provider='payu',plan_id=excluded.plan_id,status='active',currency=excluded.currency,
    amount_paise=excluded.amount_paise,payu_subscription_id=excluded.payu_subscription_id,
    current_period_start=excluded.current_period_start,current_period_end=excluded.current_period_end,
    cancel_at_period_end=false,cancelled_at=null;
  UPDATE public.payment_orders SET status='paid',provider_payment_id=p_payment_id,paid_at=now() WHERE txnid=p_txnid;
END $$;

REVOKE ALL ON FUNCTION public.complete_payu_payment(text,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.complete_payu_payment(text,integer,text) TO service_role;

CREATE OR REPLACE FUNCTION public.has_paid_service_access() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND NOT coalesce(u.is_suspended,false) AND
 (u.role IN ('admin','super_admin','supervisor_admin','sso_user') OR (
 EXISTS(SELECT 1 FROM public.signup_applications a WHERE a.user_id=u.id AND a.status='approved') AND
 NOT EXISTS(SELECT 1 FROM public.registration_blocks b WHERE (b.kind='email' AND b.value=lower(trim(u.email))) OR
   (b.kind='phone' AND b.value=(SELECT phone FROM public.signup_applications WHERE user_id=u.id))) AND
 EXISTS(SELECT 1 FROM public.subscriptions s WHERE s.user_id=u.id AND s.status='active' AND s.current_period_end>now()))));
$$;
REVOKE ALL ON FUNCTION public.has_paid_service_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_paid_service_access() TO authenticated;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['profiles','resumes','resume_versions','applications','cover_letters','admin_resumes','admin_cover_letters','careers','jobs','youtube_resources','roadmaps','roadmap_steps','interview_questions','ai_notes','projects','job_queue','notifications','ai_usage'] LOOP
  IF to_regclass('public.'||t) IS NOT NULL THEN
   EXECUTE format('DROP POLICY IF EXISTS paid_service_access ON public.%I',t);
   EXECUTE format('CREATE POLICY paid_service_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.has_paid_service_access()) WITH CHECK (public.has_paid_service_access())',t);
  END IF;
 END LOOP;
END $$;

-- Browser storage access must respect the same entitlement as the download API.
DROP POLICY IF EXISTS paid_resume_storage_access ON storage.objects;
CREATE POLICY paid_resume_storage_access ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
USING (bucket_id NOT IN ('resume-uploads','signup-resumes') OR public.has_paid_service_access())
WITH CHECK (bucket_id NOT IN ('resume-uploads','signup-resumes') OR public.has_paid_service_access());
