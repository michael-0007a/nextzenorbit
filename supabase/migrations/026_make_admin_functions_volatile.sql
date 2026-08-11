-- Migration 026: Make admin functions VOLATILE to prevent Postgres optimizer recursion
--
-- Postgres query planner can pull out STABLE functions and evaluate them before
-- scanning rows, which bypasses the short-circuiting of our CASE statements
-- and causes infinite recursion. Making them VOLATILE forces per-row evaluation.

CREATE OR REPLACE FUNCTION is_admin_or_super()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid()),
    'user'
  ) IN ('admin', 'super_admin');
$$ LANGUAGE sql SECURITY DEFINER VOLATILE SET search_path = public;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid()),
    'user'
  ) = 'super_admin';
$$ LANGUAGE sql SECURITY DEFINER VOLATILE SET search_path = public;
