-- ============================================
-- Nextzen Orbit — Storage Buckets
-- Version: 1.0.0
-- ============================================

-- Create resume-uploads bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resume-uploads',
  'resume-uploads',
  false,
  5242880, -- 5MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for resume-uploads bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resume-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own uploads
CREATE POLICY "Users can read their own resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resume-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resume-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

