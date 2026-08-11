-- ============================================================
-- Migration 20260810000004: Consolidate Runtime DDL Tables
-- Removes all CREATE TABLE from API routes — all schema
-- changes live here (Item 30 from Audit 5 security review)
-- ============================================================

-- ============================================================
-- 1. public.transactions (used by super-admin/transactions)
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

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY transactions_admin_only ON public.transactions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- ============================================================
-- 2. public.reviews (used by super-admin/reviews)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    interview_id TEXT,
    reviewer_id TEXT,
    reviewer_name TEXT,
    reviewer_role TEXT,
    reviewee_id TEXT,
    reviewee_name TEXT,
    reviewee_role TEXT,
    interaction_type TEXT DEFAULT 'interview_impression',
    rating INTEGER DEFAULT 5,
    categories JSONB DEFAULT '{}'::jsonb,
    comment TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviewer can insert their own reviews
CREATE POLICY reviews_reviewer_insert ON public.reviews
    FOR INSERT WITH CHECK (reviewer_id::text = auth.uid()::text);

-- Reviewee can see reviews about them
CREATE POLICY reviews_reviewee_select ON public.reviews
    FOR SELECT USING (reviewee_id::text = auth.uid()::text OR reviewer_id::text = auth.uid()::text);

-- Admin can see all
CREATE POLICY reviews_admin_all ON public.reviews
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- ============================================================
-- 3. public.admin_settings (used by super-admin/settings)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Super-admin can read and write
CREATE POLICY admin_settings_super_admin ON public.admin_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super-admin')
    );

-- ============================================================
-- 4. public.audit_logs (used by super-admin/audit and auditLogger)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    category TEXT DEFAULT 'admin_action',
    severity TEXT DEFAULT 'info',
    actor TEXT DEFAULT 'admin@sevikaa.in',
    actor_role TEXT DEFAULT 'Moderator',
    admin_email TEXT,
    admin_name TEXT,
    target_name TEXT,
    target_id TEXT,
    changes_summary TEXT,
    raw_payload TEXT,
    ip_address TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON public.audit_logs(category);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_admin_only ON public.audit_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- ============================================================
-- 5. public.society_relocation_requests (used by admin/society-relocations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.society_relocation_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    employer_id TEXT,
    employer_name TEXT,
    employer_phone TEXT,
    current_society TEXT,
    target_society TEXT NOT NULL,
    target_society_id TEXT,
    reason TEXT,
    residency_proof_url TEXT,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relocations_employer_id ON public.society_relocation_requests(employer_id);
CREATE INDEX IF NOT EXISTS idx_relocations_status ON public.society_relocation_requests(status);

ALTER TABLE public.society_relocation_requests ENABLE ROW LEVEL SECURITY;

-- Employer can see their own requests
CREATE POLICY relocations_owner_select ON public.society_relocation_requests
    FOR SELECT USING (employer_id::text = auth.uid()::text);

-- Employer can only insert (not update)
CREATE POLICY relocations_owner_insert ON public.society_relocation_requests
    FOR INSERT WITH CHECK (employer_id::text = auth.uid()::text);

-- Admin can manage all
CREATE POLICY relocations_admin_all ON public.society_relocation_requests
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- ============================================================
-- 6. public.tele_call_notes (used by admin/tele-notes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tele_call_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id TEXT NOT NULL,
    admin_name TEXT NOT NULL,
    note_text TEXT NOT NULL,
    call_outcome TEXT DEFAULT 'connected',
    callback_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tele_call_notes_lead ON public.tele_call_notes(lead_id);

ALTER TABLE public.tele_call_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY tele_notes_admin_only ON public.tele_call_notes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- ============================================================
-- 7. public.lead_locks (used by admin/lead-lock)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_locks (
    lead_id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    admin_name TEXT NOT NULL,
    locked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 minutes')
);

CREATE INDEX IF NOT EXISTS idx_lead_locks_expires ON public.lead_locks(expires_at);

ALTER TABLE public.lead_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_locks_admin_only ON public.lead_locks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- ============================================================
-- 8. Missing columns additions (remove remaining runtime DDL)
-- ============================================================

-- last_called_by/last_called_at used by admin/tele-notes POST
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS last_called_by TEXT,
    ADD COLUMN IF NOT EXISTS last_called_at TIMESTAMPTZ;

-- target_society_id used in society-relocations POST
ALTER TABLE public.society_relocation_requests
    ADD COLUMN IF NOT EXISTS target_society_id TEXT,
    ADD COLUMN IF NOT EXISTS admin_notes TEXT;

