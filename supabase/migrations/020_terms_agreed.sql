-- ============================================
-- Nextzen Orbit — Terms of Service tracking
-- Migration: 020
-- ============================================

-- 1. Add column to profiles to track terms acceptance
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS has_agreed_to_terms BOOLEAN DEFAULT FALSE;

-- 2. Retroactively approve all existing admins and super_admins 
-- so they aren't locked out of the dashboard
UPDATE profiles p
SET has_agreed_to_terms = TRUE
FROM users u
WHERE p.user_id = u.id AND u.role IN ('admin', 'super_admin');
