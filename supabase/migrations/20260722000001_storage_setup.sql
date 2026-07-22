-- 1. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('worker-documents', 'worker-documents', false),
    ('worker-selfies', 'worker-selfies', true),
    ('worker-videos', 'worker-videos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for worker-documents (Private documents, e.g., Aadhaar cards)
CREATE POLICY "Allow workers to upload their own documents" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'worker-documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Allow workers to view their own uploaded documents" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'worker-documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Allow admins to view all documents" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'worker-documents' AND 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

CREATE POLICY "Allow admins to delete documents" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'worker-documents' AND 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- 3. Storage Policies for worker-selfies (Public avatars, but managed by owner)
CREATE POLICY "Allow workers to upload their own selfies" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'worker-selfies' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Allow workers to update/delete their own selfies" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'worker-selfies' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Allow anyone to view selfies if profile is live/approved" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'worker-selfies' AND (
            (storage.foldername(name))[1] = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id::text = (storage.foldername(name))[1] AND status IN ('live', 'approved')
            ) OR
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'super-admin')
            )
        )
    );

-- 4. Storage Policies for worker-videos (Public profile intros, managed by owner)
CREATE POLICY "Allow workers to upload their own videos" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'worker-videos' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Allow workers to update/delete their own videos" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'worker-videos' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Allow anyone to view videos if profile is live/approved" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'worker-videos' AND (
            (storage.foldername(name))[1] = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id::text = (storage.foldername(name))[1] AND status IN ('live', 'approved')
            ) OR
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'super-admin')
            )
        )
    );
