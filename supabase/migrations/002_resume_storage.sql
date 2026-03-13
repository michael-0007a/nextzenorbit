-- ============================================
-- Nextzen Orbit — Phase 2: Resume Storage & file_url
-- Version: 2.0.0
-- ============================================

-- Add file_url column to resumes table
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Create storage bucket for resume uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resume-uploads',
  'resume-uploads',
  false,
  5242880,  -- 5MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only upload to their own folder
CREATE POLICY "users_upload_own_resumes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resume-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: users can only read their own files
CREATE POLICY "users_read_own_resumes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resume-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: users can delete their own files
CREATE POLICY "users_delete_own_resumes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resume-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

