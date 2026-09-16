-- Migration 034: User Suspension
-- Adds is_suspended to users table to quickly load status in the admin UI.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

-- Create an index to quickly filter suspended users if needed in the future
CREATE INDEX IF NOT EXISTS users_is_suspended_idx ON public.users(is_suspended);
