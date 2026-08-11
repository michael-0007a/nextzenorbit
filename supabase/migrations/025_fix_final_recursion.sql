-- Migration 025: Fix infinite recursion in RLS policies once and for all

-- 1. Redefine admin_read_all_users with a CASE statement to force short-circuiting
DROP POLICY IF EXISTS "admin_read_all_users" ON users;
CREATE POLICY "admin_read_all_users" ON users
  FOR SELECT USING (
    CASE 
      WHEN auth.uid() = id THEN true
      ELSE is_admin_or_super()
    END
  );

-- 2. Redefine super_admin_update_users with a CASE statement
DROP POLICY IF EXISTS "super_admin_update_users" ON users;
CREATE POLICY "super_admin_update_users" ON users
  FOR UPDATE USING (
    CASE 
      WHEN auth.uid() = id THEN true
      ELSE is_super_admin()
    END
  );

-- 3. Fix the inline queries in notifications and admin_cover_letters from migration 024
DROP POLICY IF EXISTS notifications_admin_all ON notifications;
CREATE POLICY notifications_admin_all ON notifications
  FOR ALL
  USING (is_admin_or_super());

DROP POLICY IF EXISTS admin_cover_letters_admin_all ON admin_cover_letters;
CREATE POLICY admin_cover_letters_admin_all ON admin_cover_letters
  FOR ALL
  USING (is_admin_or_super());
