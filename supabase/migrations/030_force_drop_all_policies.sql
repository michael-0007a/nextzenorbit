-- Migration 030: Force Drop All Policies via DO block
-- This executes dynamic SQL to obliterate every single RLS policy
-- on the users and subscriptions tables to guarantee a clean slate.

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;

    FOR pol IN
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'subscriptions' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.subscriptions', pol.policyname);
    END LOOP;
END
$$;

-- Now, recreate ONLY the absolutely essential policies!

-- 1. Users table
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_delete_own" ON public.users
  FOR DELETE USING (auth.uid() = id);

-- NO ADMIN POLICIES ON USERS. 
-- The admin dashboard uses the Service Role key (which bypasses RLS)
-- so it can read/update all users without needing an RLS policy.

-- 2. Subscriptions table
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- NO ADMIN POLICIES ON SUBSCRIPTIONS.
-- Admin dashboard uses Service Role key.

-- 3. Redefine the function just in case
CREATE OR REPLACE FUNCTION is_admin_or_super()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role IN ('admin', 'super_admin');
END;
$$;
