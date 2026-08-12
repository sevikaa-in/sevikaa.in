-- Migration: Hardening Storage Buckets & Policies for Worker Media Security (Task A1)

-- 1. Ensure storage buckets exist & explicitly update all sensitive buckets to PUBLIC = FALSE
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('worker-documents', 'worker-documents', false),
    ('worker-selfies', 'worker-selfies', false),
    ('worker-videos', 'worker-videos', false),
    ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

UPDATE storage.buckets
SET public = false
WHERE id IN ('worker-documents', 'worker-selfies', 'worker-videos', 'verification-documents');

-- 2. Drop legacy overly permissive policies on worker-selfies and worker-videos if present
DROP POLICY IF EXISTS "Allow anyone to view selfies if profile is live/approved" ON storage.objects;
DROP POLICY IF EXISTS "Allow anyone to view videos if profile is live/approved" ON storage.objects;
DROP POLICY IF EXISTS "Allow workers to view their own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Allow workers to view their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow workers to upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow workers to view their own verification documents" ON storage.objects;

-- 3. Strict owner & admin access policies for worker-selfies
CREATE POLICY "Allow workers to view their own selfies" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'worker-selfies' AND (
            (storage.foldername(name))[1] = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'super-admin')
            )
        )
    );

-- 4. Strict owner & admin access policies for worker-videos
CREATE POLICY "Allow workers to view their own videos" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'worker-videos' AND (
            (storage.foldername(name))[1] = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'super-admin')
            )
        )
    );

-- 5. Storage policies for verification-documents
CREATE POLICY "Allow workers to upload verification documents" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'verification-documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Allow workers to view their own verification documents" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'verification-documents' AND (
            (storage.foldername(name))[1] = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'super-admin')
            )
        )
    );
