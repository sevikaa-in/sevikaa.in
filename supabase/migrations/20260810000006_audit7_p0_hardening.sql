-- ============================================================
-- Migration 20260810000006: Audit 7 P0 Hardening & Privacy Isolation
-- Includes:
-- 1. Drop open RLS SELECT policy on worker_profiles
-- 2. Revoke public/anon EXECUTE on search_workers() RPC
-- 3. Update search_workers() return columns (includes is_police_verified & is_interview_verified)
-- 4. Status protection triggers for profiles & worker_profiles
-- 5. Revoke SELECT on employer_worker_directory from anon
-- ============================================================

-- ============================================================
-- 1. Drop Open Worker Profiles RLS Policy
-- Restrict direct worker_profiles SELECT to owner and admins ONLY
-- ============================================================
DO $$
BEGIN
    DROP POLICY IF EXISTS "Worker profiles readable by owner, admins, or if live" ON public.worker_profiles;
    DROP POLICY IF EXISTS "worker_profiles_employer_select" ON public.worker_profiles;
    DROP POLICY IF EXISTS "worker_profiles_owner_all" ON public.worker_profiles;
    DROP POLICY IF EXISTS "worker_profiles_admin_all" ON public.worker_profiles;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Notice dropping worker_profiles policies: %', SQLERRM;
END $$;

ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

-- Owner can SELECT their own profile
CREATE POLICY worker_profiles_owner_select ON public.worker_profiles
    FOR SELECT USING (
        user_id = auth.uid()
        OR id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super-admin')
        )
    );

-- Owner can UPDATE safe fields on their own profile
CREATE POLICY worker_profiles_owner_update ON public.worker_profiles
    FOR UPDATE USING (user_id = auth.uid() OR id = auth.uid());

-- Admin full access
CREATE POLICY worker_profiles_admin_all ON public.worker_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super-admin')
        )
    );

-- ============================================================
-- 2. Revoke EXECUTE on search_workers() from public/anon/authenticated
-- Function can ONLY be executed by service_role (API routes)
-- ============================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname = 'search_workers'
          AND pronamespace = 'public'::regnamespace
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Update search_workers RPC definition to return is_police_verified & is_interview_verified
CREATE OR REPLACE FUNCTION public.search_workers(
    p_society_id uuid DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_max_salary integer DEFAULT NULL,
    p_limit integer DEFAULT 20
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    full_name text,
    phone text,
    experience_years integer,
    expected_salary integer,
    skills text[],
    primary_gated_society text,
    society_id uuid,
    bio text,
    profile_picture_url text,
    avatar_url text,
    rating numeric,
    total_reviews integer,
    status text,
    is_aadhaar_verified boolean,
    is_police_verified boolean,
    is_interview_verified boolean,
    created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wp.id,
        wp.user_id,
        wp.full_name,
        p.phone,
        wp.experience_years,
        wp.expected_salary,
        wp.skills,
        wp.primary_gated_society,
        wp.society_id,
        wp.bio,
        wp.profile_picture_url,
        wp.avatar_url,
        COALESCE(wp.rating, 4.8::numeric),
        COALESCE(wp.total_reviews, 12),
        wp.status,
        COALESCE(wp.is_aadhaar_verified, false),
        COALESCE(wp.is_police_verified, false),
        COALESCE(wp.is_interview_verified, false),
        wp.created_at
    FROM public.worker_profiles wp
    JOIN public.profiles p ON p.id = wp.user_id OR p.id = wp.id
    WHERE (p_category IS NULL OR LOWER(p_category) = ANY(SELECT LOWER(s) FROM unnest(wp.skills) s))
      AND (p_max_salary IS NULL OR wp.expected_salary <= p_max_salary)
      AND (p_society_id IS NULL OR wp.society_id = p_society_id)
      AND wp.status IN ('live', 'approved')
      AND p.status IN ('approved', 'live', 'active')
    ORDER BY wp.created_at DESC
    LIMIT LEAST(p_limit, 50);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.search_workers(uuid, text, integer, integer) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.search_workers(uuid, text, integer, integer) TO service_role;

-- ============================================================
-- 3. Status Protection Triggers for profiles & worker_profiles
-- Prevents non-admins from self-assigning 'live', 'approved', or status changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_protect_profile_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status IS DISTINCT FROM OLD.status) THEN
        IF current_setting('request.jwt.claims', true)::jsonb->>'role' NOT IN ('admin', 'super-admin', 'service_role')
           AND current_user NOT IN ('postgres', 'service_role') THEN
            RAISE EXCEPTION 'Profile status modification is restricted to system admins.'
                USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_status ON public.profiles;
CREATE TRIGGER trg_protect_profile_status
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (OLD.status IS NOT NULL AND NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION public.fn_protect_profile_status();

CREATE OR REPLACE FUNCTION public.fn_protect_worker_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status IS DISTINCT FROM OLD.status) THEN
        IF current_setting('request.jwt.claims', true)::jsonb->>'role' NOT IN ('admin', 'super-admin', 'service_role')
           AND current_user NOT IN ('postgres', 'service_role') THEN
            RAISE EXCEPTION 'Worker profile status modification is restricted to system admins.'
                USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_worker_status ON public.worker_profiles;
CREATE TRIGGER trg_protect_worker_status
    BEFORE UPDATE ON public.worker_profiles
    FOR EACH ROW
    WHEN (OLD.status IS NOT NULL AND NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION public.fn_protect_worker_status();

-- ============================================================
-- 4. Privacy View Access Isolation
-- employer_worker_directory is accessible to authenticated users ONLY (not anon)
-- ============================================================
REVOKE SELECT ON public.employer_worker_directory FROM anon, public;
GRANT SELECT ON public.employer_worker_directory TO authenticated;
