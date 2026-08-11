-- ============================================================
-- Migration 20260810000008: Audit 9 P0 Hardening & Schema Reconciliation
-- Includes:
-- 1. Isolate public.employer_worker_directory view to service_role ONLY (P0 #3)
-- 2. Deterministic transactions schema reconciliation (UUID PK + Razorpay IDs)
-- ============================================================

-- ============================================================
-- 1. Isolate public.employer_worker_directory view to service_role ONLY
-- Prevent authenticated workers or anon clients from directly querying directory view
-- ============================================================
REVOKE SELECT ON public.employer_worker_directory FROM anon, authenticated, public;
GRANT SELECT ON public.employer_worker_directory TO service_role;

-- ============================================================
-- 2. Deterministic transactions schema reconciliation
-- Ensures transactions table has UUID PK, razorpay_payment_id TEXT UNIQUE, razorpay_order_id TEXT
-- ============================================================
DO $$
BEGIN
    -- Ensure transactions table exists with correct column types
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
        -- Add razorpay_payment_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'razorpay_payment_id') THEN
            ALTER TABLE public.transactions ADD COLUMN razorpay_payment_id TEXT UNIQUE;
        END IF;

        -- Add razorpay_order_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'razorpay_order_id') THEN
            ALTER TABLE public.transactions ADD COLUMN razorpay_order_id TEXT;
        END IF;

        -- Add raw_payload if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'raw_payload') THEN
            ALTER TABLE public.transactions ADD COLUMN raw_payload TEXT;
        END IF;
    END IF;
END $$;
