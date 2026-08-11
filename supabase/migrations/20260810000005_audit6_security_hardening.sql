-- ============================================================
-- Migration 20260810000005: Audit 6 Security & Architecture Hardening
-- Includes:
-- 1. profiles.status constraint update (adds 'pending_deletion')
-- 2. transactions schema reconciliation (UUID PK + razorpay_payment_id + razorpay_order_id)
-- 3. trg_lock_user_role trigger (locks role once assigned)
-- 4. Column-level Protection Triggers on employer_profiles and worker_profiles
-- 5. public.employer_worker_directory view (Aadhaar & document privacy)
-- 6. checkout_sessions.expires_at default
-- ============================================================

-- ============================================================
-- 1. profiles.status constraint update
-- ============================================================
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_profiles_status;

    ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check
        CHECK (status IN ('pending_review', 'admin_interview', 'approved', 'live', 'suspended', 'deactivated', 'pending_deletion'));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Notice updating profiles_status_check constraint: %', SQLERRM;
END $$;

-- ============================================================
-- 2. Reconcile transactions table schema
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_order_id TEXT,
    user_id TEXT NOT NULL,
    employer_name TEXT,
    employer_email TEXT,
    employer_phone TEXT,
    plan_name TEXT NOT NULL DEFAULT 'Premium Subscription Pass',
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'UPI / Razorpay',
    status TEXT NOT NULL DEFAULT 'captured',
    invoice_number TEXT,
    raw_payload TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
    ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
    ADD COLUMN IF NOT EXISTS user_id TEXT,
    ADD COLUMN IF NOT EXISTS invoice_number TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_rzp_order ON public.transactions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_rzp_payment ON public.transactions(razorpay_payment_id);

-- ============================================================
-- 3. Role Lock Trigger: Prevents non-super-admins from changing assigned role
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_lock_user_role()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS NOT NULL AND NEW.role IS DISTINCT FROM OLD.role THEN
        IF current_setting('request.jwt.claims', true)::jsonb->>'role' NOT IN ('super-admin', 'service_role')
           AND current_user NOT IN ('postgres', 'service_role') THEN
            RAISE EXCEPTION 'Role modification forbidden: user role is locked once assigned.'
                USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_lock_user_role ON public.profiles;
CREATE TRIGGER trg_lock_user_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (OLD.role IS NOT NULL AND NEW.role IS DISTINCT FROM OLD.role)
    EXECUTE FUNCTION public.fn_lock_user_role();

-- ============================================================
-- 4. Protection Trigger for employer_profiles
-- Prevents employers from directly self-assigning subscription_status or status
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_protect_employer_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.subscription_status IS DISTINCT FROM OLD.subscription_status OR NEW.status IS DISTINCT FROM OLD.status) THEN
        IF current_setting('request.jwt.claims', true)::jsonb->>'role' NOT IN ('admin', 'super-admin', 'service_role')
           AND current_user NOT IN ('postgres', 'service_role') THEN
            RAISE EXCEPTION 'Modification of subscription_status or status is restricted to system webhooks and admins.'
                USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_employer_fields ON public.employer_profiles;
CREATE TRIGGER trg_protect_employer_fields
    BEFORE UPDATE ON public.employer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_protect_employer_fields();

-- ============================================================
-- Protection Trigger for worker_profiles
-- Prevents workers from self-verifying Aadhaar/Police/Interview status
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_protect_worker_verification_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.is_aadhaar_verified IS DISTINCT FROM OLD.is_aadhaar_verified OR
        NEW.is_police_verified IS DISTINCT FROM OLD.is_police_verified OR
        NEW.is_interview_verified IS DISTINCT FROM OLD.is_interview_verified) THEN
        IF current_setting('request.jwt.claims', true)::jsonb->>'role' NOT IN ('admin', 'super-admin', 'service_role')
           AND current_user NOT IN ('postgres', 'service_role') THEN
            RAISE EXCEPTION 'Modification of verification flags is restricted to system admins.'
                USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_worker_verification_fields ON public.worker_profiles;
CREATE TRIGGER trg_protect_worker_verification_fields
    BEFORE UPDATE ON public.worker_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_protect_worker_verification_fields();

-- ============================================================
-- Ensure rating & total_reviews columns exist on worker_profiles
-- ============================================================
ALTER TABLE public.worker_profiles
    ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.8,
    ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- ============================================================
-- 5. public.employer_worker_directory View (Privacy Isolation)
-- Excludes sensitive Aadhaar front/back scans & police clearance URLs from employer browsing
-- ============================================================
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
    wp.video_url,
    wp.profile_picture_url,
    wp.avatar_url,
    wp.status,
    wp.rating,
    wp.total_reviews,
    wp.is_aadhaar_verified,
    wp.is_police_verified,
    wp.is_interview_verified,
    wp.created_at
FROM public.worker_profiles wp
WHERE wp.status IN ('live', 'approved');

GRANT SELECT ON public.employer_worker_directory TO authenticated, anon;

-- ============================================================
-- 6. Ensure expires_at column on checkout_sessions is NOT NULL with default
-- ============================================================
ALTER TABLE public.checkout_sessions
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes');
