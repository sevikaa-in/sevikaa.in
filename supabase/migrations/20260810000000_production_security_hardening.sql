-- Production Security Hardening Migration
-- 1. Harden Profiles Table RLS Policies
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles readable by self or admin" ON public.profiles
    FOR SELECT TO authenticated USING (
        auth.uid() = id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- 2. Harden Employer Profiles Table RLS Policies
DROP POLICY IF EXISTS "Employer profiles readable by authenticated users" ON public.employer_profiles;

CREATE POLICY "Employer profiles readable by owner, job applicants, or admins" ON public.employer_profiles
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.applications ja 
            JOIN public.jobs j ON j.id = ja.job_id 
            WHERE (j.employer_id = employer_profiles.user_id OR j.employer_id = employer_profiles.id) 
              AND ja.worker_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- 3. Storage Bucket Policy Hardening
-- Support path formats: {userId}/..., documents/{userId}/..., workers/{userId}/..., employers/{userId}/...

-- verification-documents (Private Bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow users to upload verification documents" ON storage.objects;
CREATE POLICY "Allow users to upload verification documents" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'verification-documents' AND (
            (storage.foldername(name))[1] = auth.uid()::text OR
            ((storage.foldername(name))[1] IN ('documents', 'workers', 'employers') AND (storage.foldername(name))[2] = auth.uid()::text) OR
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
        )
    );

DROP POLICY IF EXISTS "Allow users to view own verification documents" ON storage.objects;
CREATE POLICY "Allow users to view own verification documents" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'verification-documents' AND (
            (storage.foldername(name))[1] = auth.uid()::text OR
            ((storage.foldername(name))[1] IN ('documents', 'workers', 'employers') AND (storage.foldername(name))[2] = auth.uid()::text) OR
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
        )
    );

-- worker-documents (Private Bucket)
DROP POLICY IF EXISTS "Allow workers to upload their own documents" ON storage.objects;
CREATE POLICY "Allow workers to upload their own documents" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'worker-documents' AND (
            (storage.foldername(name))[1] = auth.uid()::text OR
            ((storage.foldername(name))[1] IN ('documents', 'workers', 'employers') AND (storage.foldername(name))[2] = auth.uid()::text) OR
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
        )
    );

DROP POLICY IF EXISTS "Allow workers to view their own uploaded documents" ON storage.objects;
CREATE POLICY "Allow workers to view their own uploaded documents" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'worker-documents' AND (
            (storage.foldername(name))[1] = auth.uid()::text OR
            ((storage.foldername(name))[1] IN ('documents', 'workers', 'employers') AND (storage.foldername(name))[2] = auth.uid()::text) OR
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
        )
    );
