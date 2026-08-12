-- Migration: Add assigned_admin_id to profiles

ALTER TABLE public.profiles
ADD COLUMN assigned_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Create an index for faster lookups when filtering by admin
CREATE INDEX IF NOT EXISTS profiles_assigned_admin_id_idx ON public.profiles(assigned_admin_id);
