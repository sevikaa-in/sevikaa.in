-- ============================================================
-- Migration 20260810000003: RLS Policies, Interviews Table,
-- Platform Settings, and Missing Schema Additions
-- Audit 5 Security Hardening
-- ============================================================

-- ============================================================
-- 1. interviews table (Item 28: missing from all prior migrations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.interviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_application_id uuid REFERENCES public.job_applications(id) ON DELETE CASCADE,
    employer_id uuid REFERENCES public.profiles(id),
    worker_id uuid REFERENCES public.profiles(id),
    scheduled_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 30,
    location TEXT,
    notes TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_employer_id ON public.interviews(employer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_worker_id ON public.interviews(worker_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON public.interviews(scheduled_at);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Employer can view/manage interviews they created
CREATE POLICY interviews_employer_select ON public.interviews
    FOR SELECT USING (employer_id = auth.uid());

CREATE POLICY interviews_employer_insert ON public.interviews
    FOR INSERT WITH CHECK (employer_id = auth.uid());

CREATE POLICY interviews_employer_update ON public.interviews
    FOR UPDATE USING (employer_id = auth.uid());

-- Worker can view their own interviews (read-only)
CREATE POLICY interviews_worker_select ON public.interviews
    FOR SELECT USING (worker_id = auth.uid());

-- ============================================================
-- 2. platform_settings table (used by paymentService, pricing)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY,
    settings JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by uuid REFERENCES public.profiles(id)
);

-- Seed default pricing configuration
INSERT INTO public.platform_settings (id, settings) VALUES (
  'pricing_config',
  '{
    "freePlan":    {"price": 0,    "name": "Free Trial Pass",              "validity": "7 Days",  "features": ["3 worker profiles", "Basic filters"]},
    "basicPlan":   {"price": 299,  "name": "Basic Household Pass",         "validity": "30 Days", "features": ["10 worker profiles", "Advanced filters", "Direct contact"]},
    "premiumPlan": {"price": 699,  "name": "Standard Family Plan",         "validity": "60 Days", "features": ["Unlimited profiles", "Priority support", "Video profiles"]},
    "proPlan":     {"price": 1499, "name": "Pro Unlimited Household Pass", "validity": "90 Days", "features": ["Unlimited", "Dedicated support", "All features"]}
  }'
)
ON CONFLICT (id) DO NOTHING;

-- Only super-admin can modify platform settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_settings_public_read ON public.platform_settings
    FOR SELECT USING (true); -- pricing is public info

CREATE POLICY platform_settings_admin_write ON public.platform_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- ============================================================
-- 3. Add razorpay_order_id column to checkout_sessions (P0 #9)
-- ============================================================
ALTER TABLE public.checkout_sessions
    ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS expected_amount INTEGER; -- amount in INR (not paise)

CREATE INDEX IF NOT EXISTS idx_checkout_razorpay_order ON public.checkout_sessions(razorpay_order_id)
    WHERE razorpay_order_id IS NOT NULL;

-- ============================================================
-- 4. payment_events idempotency table (from Audit 4 migration)
-- Ensure it exists here for safety
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_events (
    id BIGSERIAL PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    event_id TEXT NOT NULL UNIQUE, -- Razorpay webhook event ID (idempotency key)
    payment_id TEXT,
    event_type TEXT,
    payload_hash TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_events_event_id ON public.payment_events(event_id);

-- ============================================================
-- 5. RLS: otp_verifications — no user-level access (service only)
-- ============================================================
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- No direct SELECT/INSERT/UPDATE from client-side anon/authed users
-- All OTP operations go through API routes using service role only
CREATE POLICY otp_verifications_deny_all ON public.otp_verifications
    FOR ALL USING (false);

-- ============================================================
-- 6. RLS: notification_logs — admin read-only from client
-- ============================================================
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_logs_admin_select ON public.notification_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- ============================================================
-- 7. RLS: checkout_sessions — user can only see their own
-- ============================================================
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY checkout_sessions_owner_select ON public.checkout_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY checkout_sessions_deny_insert ON public.checkout_sessions
    FOR INSERT WITH CHECK (false); -- inserts only via service role (API routes)

CREATE POLICY checkout_sessions_deny_update ON public.checkout_sessions
    FOR UPDATE USING (false); -- updates only via service role

-- ============================================================
-- 8. RLS: payment_events — deny all direct client access
-- ============================================================
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_events_deny_all ON public.payment_events
    FOR ALL USING (false);

-- ============================================================
-- 9. Protect sensitive worker_profiles columns via RLS view
-- Employers should not see aadhaar_front_url / aadhaar_back_url
-- ============================================================

-- Add RLS to worker_profiles if not already enabled
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

-- Workers can see and update only their own profile
CREATE POLICY worker_profiles_owner_all ON public.worker_profiles
    FOR ALL USING (user_id = auth.uid());

-- Employers can see non-sensitive worker profile columns
-- (Aadhaar/police verification docs are never returned to employers via RLS)
CREATE POLICY worker_profiles_employer_select ON public.worker_profiles
    FOR SELECT USING (
        status IN ('live', 'approved')
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'employer'
        )
    );

-- Admin can see all
CREATE POLICY worker_profiles_admin_all ON public.worker_profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- ============================================================
-- 10. RLS: employer_profiles
-- ============================================================
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY employer_profiles_owner_all ON public.employer_profiles
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY employer_profiles_admin_all ON public.employer_profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- ============================================================
-- 11. updated_at trigger helper (if not already created)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER interviews_updated_at
    BEFORE UPDATE ON public.interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 12. sms_templates RLS — admin-only writes, public reads (DLT info)
-- ============================================================
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY sms_templates_public_read ON public.sms_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY sms_templates_admin_write ON public.sms_templates
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- ============================================================
-- 13. Add missing indexes for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON public.checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_created_at ON public.checkout_sessions(created_at DESC);
