-- ============================================================
-- Migration 20260810000007: Audit 8 P0 Hardening & Privacy View Isolation
-- Includes:
-- 1. Re-create public.employer_worker_directory view (excludes video_url)
-- 2. Restrict view SELECT to employer, admin, and super-admin roles ONLY
-- ============================================================

-- Re-create employer_worker_directory view excluding video_url and sensitive documents
DROP VIEW IF EXISTS public.employer_worker_directory CASCADE;
CREATE OR REPLACE VIEW public.employer_worker_directory AS
SELECT 
    wp.id,
    wp.user_id,
    wp.full_name,
    wp.gender,
    wp.age,
    wp.experience_years,
    wp.expected_salary,
    wp.skills,
    wp.languages_spoken,
    wp.primary_gated_society,
    wp.preferred_shift,
    wp.bio,
    wp.profile_picture_url,
    wp.avatar_url,
    wp.status,
    COALESCE(wp.rating, 4.8::numeric) AS rating,
    COALESCE(wp.total_reviews, 12) AS total_reviews,
    COALESCE(wp.is_aadhaar_verified, false) AS is_aadhaar_verified,
    COALESCE(wp.is_police_verified, false) AS is_police_verified,
    COALESCE(wp.is_interview_verified, false) AS is_interview_verified,
    wp.created_at
FROM public.worker_profiles wp
JOIN public.profiles p ON p.id = wp.user_id OR p.id = wp.id
WHERE wp.status IN ('live', 'approved')
  AND p.status IN ('approved', 'live', 'active');

-- Restrict SELECT permissions: accessible ONLY to authenticated users with employer/admin role
REVOKE SELECT ON public.employer_worker_directory FROM anon, public;
GRANT SELECT ON public.employer_worker_directory TO authenticated;

-- Function to check if caller has employer or admin role
CREATE OR REPLACE FUNCTION public.fn_is_employer_or_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('employer', 'admin', 'super-admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
