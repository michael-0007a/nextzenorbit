-- Migration 031: Add supervisor_admin role

-- 1. Update the check constraint on users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'sso_user', 'admin', 'supervisor_admin', 'super_admin'));

-- 2. Redefine is_admin_or_super to include supervisor_admin
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
  RETURN v_role IN ('admin', 'supervisor_admin', 'super_admin');
END;
$$;
