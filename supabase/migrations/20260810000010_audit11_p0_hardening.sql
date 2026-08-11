-- ============================================================
-- Migration 20260810000010: Audit 11 Release Candidate Hardening
-- Includes:
-- 1. Create public.refresh_tokens table with dual session_id & family_id tracking
-- 2. Preflight-audited safe text-to-uuid schema reconciliation for public.transactions
-- ============================================================

-- ============================================================
-- 1. Refresh Tokens Table (Dual session_id & family_id Tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    session_id UUID NOT NULL DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL DEFAULT gen_random_uuid(),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON public.refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session_id ON public.refresh_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_id ON public.refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);

-- RLS: Only service_role can query/update refresh_tokens
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.refresh_tokens FROM anon, authenticated, public;
GRANT ALL ON public.refresh_tokens TO service_role;

-- ============================================================
-- 2. Preflight-Audited Deterministic Transactions Schema Reconciliation
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
        -- Add razorpay_payment_id column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'razorpay_payment_id') THEN
            ALTER TABLE public.transactions ADD COLUMN razorpay_payment_id TEXT UNIQUE;
        END IF;

        -- Add razorpay_order_id column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'razorpay_order_id') THEN
            ALTER TABLE public.transactions ADD COLUMN razorpay_order_id TEXT;
        END IF;

        -- Add raw_payload column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'raw_payload') THEN
            ALTER TABLE public.transactions ADD COLUMN raw_payload TEXT;
        END IF;

        -- Safely convert id column from TEXT to UUID if currently TEXT
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'id' AND data_type = 'text') THEN
            -- Add new_id UUID column
            ALTER TABLE public.transactions ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
            
            -- Migrate valid UUID strings or generate new UUIDs
            UPDATE public.transactions 
            SET new_id = CASE 
                WHEN id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::uuid 
                ELSE gen_random_uuid() 
            END;

            -- Preserve legacy text payment IDs in razorpay_payment_id
            UPDATE public.transactions 
            SET razorpay_payment_id = id 
            WHERE razorpay_payment_id IS NULL AND id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

            -- Rebuild Primary Key
            ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_pkey;
            ALTER TABLE public.transactions DROP COLUMN id;
            ALTER TABLE public.transactions RENAME COLUMN new_id TO id;
            ALTER TABLE public.transactions ADD PRIMARY KEY (id);
        END IF;
    END IF;
END $$;
