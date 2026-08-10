-- ============================================================
-- Migration: OTP, Notification, and Checkout Session Schema
-- ============================================================

-- 1. OTP Verifications Table (replaces inline CREATE TABLE in login-otp route)
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    target_key VARCHAR(150) PRIMARY KEY,  -- 'phone:XXXXXXXXXX' or 'email:...'
    otp_hash TEXT NOT NULL,               -- SHA-256 of the actual OTP (never plaintext)
    expires_at BIGINT NOT NULL,           -- Unix ms timestamp
    attempt_count INTEGER DEFAULT 0,      -- Failed verify attempts (lock at 5)
    send_count INTEGER DEFAULT 0,         -- Sends in current hour window
    last_sent_at TIMESTAMPTZ DEFAULT NOW(),
    consumed_at TIMESTAMPTZ,              -- Set on first successful verify
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_target_key ON public.otp_verifications(target_key);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON public.otp_verifications(expires_at);

-- 2. Notification Logs Table (replaces inline CREATE TABLE in /api/notifications/logs)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    channel TEXT NOT NULL DEFAULT 'sms',
    provider TEXT NOT NULL DEFAULT 'msg91',
    recipient TEXT NOT NULL,
    template_id TEXT,
    message_id TEXT,
    status TEXT NOT NULL DEFAULT 'delivered',
    description TEXT,
    raw_payload TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON public.notification_logs(recipient);

-- 3. SMS Templates Table (replaces inline CREATE TABLE in /api/notifications/sms/templates)
CREATE TABLE IF NOT EXISTS public.sms_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key TEXT NOT NULL,
    category TEXT DEFAULT 'authentication',
    provider TEXT DEFAULT 'msg91',
    sender_id TEXT DEFAULT 'SEVKAA',
    dlt_template_id TEXT,
    language TEXT DEFAULT 'en',
    title TEXT,
    message TEXT,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_templates_key ON public.sms_templates(template_key);

-- 4. Checkout Sessions Table (replaces in-memory Map in /api/auth/checkout-session)
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,   -- SHA-256 of raw token (never stored plaintext)
    user_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,           -- Set on first retrieval (single-use)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_token_hash ON public.checkout_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON public.checkout_sessions(user_id);

-- Enable RLS on new tables
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Checkout sessions: users can only read their own
DROP POLICY IF EXISTS "Users can read own checkout sessions" ON public.checkout_sessions;
CREATE POLICY "Users can read own checkout sessions" ON public.checkout_sessions
    FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

-- Notification logs: admin only
DROP POLICY IF EXISTS "Admins can read notification logs" ON public.notification_logs;
CREATE POLICY "Admins can read notification logs" ON public.notification_logs
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- 5. Update search_workers RPC to filter only approved/live workers
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
    JOIN public.profiles p ON p.id = wp.user_id
    WHERE (p_category IS NULL OR LOWER(p_category) = ANY(SELECT LOWER(s) FROM unnest(wp.skills) s))
      AND (p_max_salary IS NULL OR wp.expected_salary <= p_max_salary)
      AND (p_society_id IS NULL OR wp.preferred_society_id = p_society_id)
      -- P0 #14: Strict visibility — only live/approved workers surface to employer search
      AND wp.status IN ('live', 'approved')
      AND p.status IN ('approved', 'live', 'active')
    ORDER BY wp.created_at DESC
    LIMIT p_limit;
END;
$$;

-- 6. Reviews Table (replaces inline DDL in /api/reviews/*)
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id text NOT NULL,
    employer_id text,
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment text,
    reviewer_name text,
    created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_worker_id ON public.reviews(worker_id);
CREATE INDEX IF NOT EXISTS idx_reviews_employer_id ON public.reviews(employer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- 7. Transactions Table (replaces inline DDL in /api/super-admin/transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id text,
    user_id text NOT NULL,
    employer_name text,
    employer_email text,
    employer_phone text,
    plan_name text,
    amount numeric,
    payment_method text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- 8. Admin Settings Table (replaces inline DDL in /api/super-admin/settings)
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamptz DEFAULT NOW()
);

-- 9. Tele Call Notes Table (replaces inline DDL in /api/admin/tele-notes)
CREATE TABLE IF NOT EXISTS public.tele_call_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id text NOT NULL,
    admin_name text NOT NULL,
    note_text text NOT NULL,
    call_outcome text DEFAULT 'connected',
    callback_at timestamptz,
    created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tele_call_notes_lead ON public.tele_call_notes(lead_id);

-- 10. Lead Locks Table (replaces inline DDL in /api/admin/lead-lock)
CREATE TABLE IF NOT EXISTS public.lead_locks (
    lead_id text PRIMARY KEY,
    admin_id text NOT NULL,
    admin_name text NOT NULL,
    locked_at timestamptz DEFAULT NOW(),
    expires_at timestamptz DEFAULT (NOW() + INTERVAL '2 minutes')
);

CREATE INDEX IF NOT EXISTS idx_lead_locks_expires ON public.lead_locks(expires_at);

-- 11. Payment Events Table (P0 #15: event-level idempotency for Razorpay webhooks)
-- Prevents duplicate processing when the same event (e.g. payment.captured) is delivered twice
-- Also correctly tracks multiple state transitions for the same payment_id (failed -> captured)
CREATE TABLE IF NOT EXISTS public.payment_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    event_id TEXT NOT NULL UNIQUE,   -- '{event_type}:{payment_id}' e.g. 'payment.captured:pay_abc123'
    payment_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload_hash TEXT,               -- SHA-256 of raw payload for tamper detection
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ         -- Set when subscription/transaction fully processed
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON public.payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_received_at ON public.payment_events(received_at DESC);

-- 12. Reviews table: update schema to match hardened submit route
-- Add missing columns that the new auth-enforced route expects
ALTER TABLE IF EXISTS public.reviews
  ADD COLUMN IF NOT EXISTS author_id text,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS reviewer_id text,
  ADD COLUMN IF NOT EXISTS reviewer_name text,
  ADD COLUMN IF NOT EXISTS reviewer_role text,
  ADD COLUMN IF NOT EXISTS reviewee_id text,
  ADD COLUMN IF NOT EXISTS reviewee_name text,
  ADD COLUMN IF NOT EXISTS reviewee_role text,
  ADD COLUMN IF NOT EXISTS interaction_type text DEFAULT 'interview_impression',
  ADD COLUMN IF NOT EXISTS categories jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS interview_id text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);
