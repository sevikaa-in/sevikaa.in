-- Production Performance & Security Hardening Migration

-- 1. Persistent Upload Tokens Table
CREATE TABLE IF NOT EXISTS public.verification_upload_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    token_hash text NOT NULL UNIQUE,
    user_id text NOT NULL,
    created_by text,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    max_uses integer DEFAULT 1,
    use_count integer DEFAULT 0,
    created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upload_tokens_hash ON public.verification_upload_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_upload_tokens_user_id ON public.verification_upload_tokens(user_id);

-- Enable RLS on verification_upload_tokens
ALTER TABLE public.verification_upload_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on upload tokens" ON public.verification_upload_tokens;
CREATE POLICY "Admin full access on upload tokens" ON public.verification_upload_tokens
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- 2. Audit Log Policy Hardening (Revoke broad client INSERT)
DROP POLICY IF EXISTS "Allow authenticated users to insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow admins or service role to insert audit logs" ON public.audit_logs;

CREATE POLICY "Allow admins or service role to insert audit logs" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- 3. Society Relocation Requests Table
CREATE TABLE IF NOT EXISTS public.society_relocation_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    employer_id text NOT NULL,
    employer_name text,
    employer_phone text,
    current_society text,
    target_society text NOT NULL,
    target_society_id text,
    reason text,
    residency_proof_url text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- 4. Additional employer_profiles columns (idempotent)
ALTER TABLE public.employer_profiles
    ADD COLUMN IF NOT EXISTS name text,
    ADD COLUMN IF NOT EXISTS company_name text,
    ADD COLUMN IF NOT EXISTS society_name text,
    ADD COLUMN IF NOT EXISTS tower_block text,
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS billing_address text,
    ADD COLUMN IF NOT EXISTS city text,
    ADD COLUMN IF NOT EXISTS state text,
    ADD COLUMN IF NOT EXISTS pincode text,
    ADD COLUMN IF NOT EXISTS gstin text,
    ADD COLUMN IF NOT EXISTS alternate_phone text,
    ADD COLUMN IF NOT EXISTS alt_phone text,
    ADD COLUMN IF NOT EXISTS verification_requirement text,
    ADD COLUMN IF NOT EXISTS residency_proof_url text,
    ADD COLUMN IF NOT EXISTS aadhaar_front_url text,
    ADD COLUMN IF NOT EXISTS aadhaar_back_url text,
    ADD COLUMN IF NOT EXISTS avatar_url text,
    ADD COLUMN IF NOT EXISTS status text;

-- Additional worker_profiles columns (idempotent)
ALTER TABLE public.worker_profiles
    ADD COLUMN IF NOT EXISTS name text,
    ADD COLUMN IF NOT EXISTS full_name text,
    ADD COLUMN IF NOT EXISTS gender text,
    ADD COLUMN IF NOT EXISTS age integer,
    ADD COLUMN IF NOT EXISTS experience_years integer,
    ADD COLUMN IF NOT EXISTS expected_salary numeric,
    ADD COLUMN IF NOT EXISTS skills text[],
    ADD COLUMN IF NOT EXISTS category text[],
    ADD COLUMN IF NOT EXISTS languages_spoken text[],
    ADD COLUMN IF NOT EXISTS primary_gated_society text,
    ADD COLUMN IF NOT EXISTS preferred_shift text,
    ADD COLUMN IF NOT EXISTS aadhaar_front_url text,
    ADD COLUMN IF NOT EXISTS aadhaar_back_url text,
    ADD COLUMN IF NOT EXISTS avatar_url text,
    ADD COLUMN IF NOT EXISTS profile_picture_url text,
    ADD COLUMN IF NOT EXISTS status text,
    ADD COLUMN IF NOT EXISTS bio text,
    ADD COLUMN IF NOT EXISTS emergency_contact text,
    ADD COLUMN IF NOT EXISTS preferred_society_name text,
    ADD COLUMN IF NOT EXISTS secondary_society_name text,
    ADD COLUMN IF NOT EXISTS police_verification_url text;

-- Additional profiles columns (idempotent)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS full_name text;

-- 5. Ensure Job Applications Table Exists
CREATE TABLE IF NOT EXISTS public.job_applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id uuid,
    worker_id uuid,
    status text DEFAULT 'applied',
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- 4. Harden search_workers RPC Function
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
    gender text,
    age integer,
    expected_salary integer,
    experience_years integer,
    skills text[],
    languages_spoken text[],
    profile_picture_url text,
    preferred_society_name text,
    is_aadhaar_verified boolean,
    is_tele_onboarded boolean,
    rating numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wp.id,
        wp.user_id,
        wp.full_name,
        wp.gender,
        wp.age,
        wp.expected_salary,
        wp.experience_years,
        wp.skills,
        wp.languages_spoken,
        wp.profile_picture_url,
        wp.preferred_society_name,
        COALESCE(wp.is_aadhaar_verified, false) AS is_aadhaar_verified,
        COALESCE(wp.is_tele_onboarded, false) AS is_tele_onboarded,
        4.8::numeric AS rating
    FROM public.worker_profiles wp
    WHERE (p_category IS NULL OR LOWER(p_category) = ANY(SELECT LOWER(s) FROM unnest(wp.skills) s))
      AND (p_max_salary IS NULL OR wp.expected_salary <= p_max_salary)
      AND (p_society_id IS NULL OR wp.preferred_society_id = p_society_id)
    ORDER BY wp.created_at DESC
    LIMIT p_limit;
END;
$$;

-- 5. Database Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON public.profiles(role, status);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_worker_profiles_user_id ON public.worker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_society_id ON public.worker_profiles(preferred_society_id);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_salary ON public.worker_profiles(expected_salary);

CREATE INDEX IF NOT EXISTS idx_employer_profiles_user_id ON public.employer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_subscription ON public.employer_profiles(subscription_status);

CREATE INDEX IF NOT EXISTS idx_jobs_employer_status ON public.jobs(employer_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

-- Application Table Indexes (for both public.applications and public.job_applications)
CREATE INDEX IF NOT EXISTS idx_applications_worker_job ON public.applications(worker_id, job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

CREATE INDEX IF NOT EXISTS idx_job_applications_worker_job ON public.job_applications(worker_id, job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- Transaction Table Indexes (safely create table if not existing)
CREATE TABLE IF NOT EXISTS public.transactions (
    id text PRIMARY KEY,
    order_id text,
    user_id text,
    employer_name text,
    employer_email text,
    employer_phone text,
    plan_name text NOT NULL DEFAULT 'Premium Subscription Pass',
    amount numeric NOT NULL DEFAULT 0,
    payment_method text DEFAULT 'UPI / Razorpay',
    status text NOT NULL DEFAULT 'captured',
    raw_payload text,
    created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
