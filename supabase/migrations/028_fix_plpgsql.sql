-- Migration 028: Convert admin check functions to PL/pgSQL
-- SQL functions can be inlined by the Postgres optimizer, which destroys
-- the SECURITY DEFINER boundary and merges the internal queries into the caller's plan,
-- causing them to run as the normal user and trigger RLS on the users table.
-- PL/pgSQL functions are opaque to the optimizer and are never inlined,
-- guaranteeing that SECURITY DEFINER works and RLS is bypassed.

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

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role = 'super_admin';
END;
$$;

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role = 'admin';
END;
$$;
