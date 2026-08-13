-- Migration: Hardening RLS Policies for job_applications and applications (Task A2)

-- 1. Ensure public.job_applications table exists and enable RLS
CREATE TABLE IF NOT EXISTS public.job_applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id uuid,
    worker_id uuid,
    status text DEFAULT 'applied',
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing permissive or outdated policies on job_applications & applications if any
DROP POLICY IF EXISTS "job_applications_worker_select" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_worker_insert" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_worker_update" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_employer_select" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_employer_update" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_admin_all" ON public.job_applications;

DROP POLICY IF EXISTS "Applications readable by applicant, job owner, or admin" ON public.applications;
DROP POLICY IF EXISTS "Workers can apply for jobs" ON public.applications;
DROP POLICY IF EXISTS "Applicants can cancel or update applications" ON public.applications;
DROP POLICY IF EXISTS "Job owners can update applications state" ON public.applications;
DROP POLICY IF EXISTS "Admins have full access to applications" ON public.applications;
DROP POLICY IF EXISTS "applications_worker_select" ON public.applications;
DROP POLICY IF EXISTS "applications_worker_insert" ON public.applications;
DROP POLICY IF EXISTS "applications_worker_update" ON public.applications;
DROP POLICY IF EXISTS "applications_employer_select" ON public.applications;
DROP POLICY IF EXISTS "applications_employer_update" ON public.applications;
DROP POLICY IF EXISTS "applications_admin_all" ON public.applications;

-- 3. WORKER POLICIES for job_applications
-- Worker can SELECT only their own applications
CREATE POLICY "job_applications_worker_select" ON public.job_applications
    FOR SELECT TO authenticated USING (
        worker_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.worker_profiles wp
            WHERE wp.user_id = auth.uid() AND (wp.id = job_applications.worker_id OR wp.user_id = job_applications.worker_id)
        )
    );

-- Worker can INSERT an application only for themselves
CREATE POLICY "job_applications_worker_insert" ON public.job_applications
    FOR INSERT TO authenticated WITH CHECK (
        (
            worker_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.worker_profiles wp
                WHERE wp.user_id = auth.uid() AND (wp.id = job_applications.worker_id OR wp.user_id = job_applications.worker_id)
            )
        ) AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'worker'
        )
    );

-- Worker can UPDATE only their own applications (e.g. withdraw/cancel)
CREATE POLICY "job_applications_worker_update" ON public.job_applications
    FOR UPDATE TO authenticated USING (
        worker_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.worker_profiles wp
            WHERE wp.user_id = auth.uid() AND (wp.id = job_applications.worker_id OR wp.user_id = job_applications.worker_id)
        )
    );

-- 4. EMPLOYER POLICIES for job_applications
-- Employer can SELECT applications belonging to jobs owned by that employer
CREATE POLICY "job_applications_employer_select" ON public.job_applications
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.jobs j
            WHERE j.id = job_applications.job_id
              AND (
                  j.employer_id = auth.uid() OR
                  EXISTS (
                      SELECT 1 FROM public.employer_profiles ep
                      WHERE ep.user_id = auth.uid() AND (ep.id = j.employer_id OR ep.user_id = j.employer_id)
                  )
              )
        )
    );

-- Employer can UPDATE applications for jobs owned by that employer (shortlist/hire/reject)
CREATE POLICY "job_applications_employer_update" ON public.job_applications
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.jobs j
            WHERE j.id = job_applications.job_id
              AND (
                  j.employer_id = auth.uid() OR
                  EXISTS (
                      SELECT 1 FROM public.employer_profiles ep
                      WHERE ep.user_id = auth.uid() AND (ep.id = j.employer_id OR ep.user_id = j.employer_id)
                  )
              )
        )
    );

-- 5. ADMIN POLICIES for job_applications
CREATE POLICY "job_applications_admin_all" ON public.job_applications
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- 6. Relationship-based RLS Policies for public.applications (legacy table compatibility)
CREATE POLICY "applications_worker_select" ON public.applications
    FOR SELECT TO authenticated USING (
        worker_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.worker_profiles wp
            WHERE wp.user_id = auth.uid() AND (wp.id = applications.worker_id OR wp.user_id = applications.worker_id)
        )
    );

CREATE POLICY "applications_worker_insert" ON public.applications
    FOR INSERT TO authenticated WITH CHECK (
        (
            worker_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.worker_profiles wp
                WHERE wp.user_id = auth.uid() AND (wp.id = applications.worker_id OR wp.user_id = applications.worker_id)
            )
        ) AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'worker'
        )
    );

CREATE POLICY "applications_worker_update" ON public.applications
    FOR UPDATE TO authenticated USING (
        worker_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.worker_profiles wp
            WHERE wp.user_id = auth.uid() AND (wp.id = applications.worker_id OR wp.user_id = applications.worker_id)
        )
    );

CREATE POLICY "applications_employer_select" ON public.applications
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.jobs j
            WHERE j.id = applications.job_id
              AND (
                  j.employer_id = auth.uid() OR
                  EXISTS (
                      SELECT 1 FROM public.employer_profiles ep
                      WHERE ep.user_id = auth.uid() AND (ep.id = j.employer_id OR ep.user_id = j.employer_id)
                  )
              )
        )
    );

CREATE POLICY "applications_employer_update" ON public.applications
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.jobs j
            WHERE j.id = applications.job_id
              AND (
                  j.employer_id = auth.uid() OR
                  EXISTS (
                      SELECT 1 FROM public.employer_profiles ep
                      WHERE ep.user_id = auth.uid() AND (ep.id = j.employer_id OR ep.user_id = j.employer_id)
                  )
              )
        )
    );

CREATE POLICY "applications_admin_all" ON public.applications
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );
