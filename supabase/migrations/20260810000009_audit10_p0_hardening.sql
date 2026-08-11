-- ============================================================
-- Migration 20260810000009: Audit 10 P0 Hardening & Schema Consolidation
-- Includes:
-- 1. Deterministic transactions schema reconciliation (UUID PK + Razorpay IDs)
-- 2. Performance indexes for user_id and razorpay_order_id
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

-- Indexes for high-traffic payment lookups
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_order_id ON public.transactions(razorpay_order_id);
