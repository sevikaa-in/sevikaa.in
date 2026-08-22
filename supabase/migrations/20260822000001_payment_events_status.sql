-- Migration: Add status column to public.payment_events
-- Enforces durable event states: PENDING, COMPLETED, REJECTED

ALTER TABLE public.payment_events
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING';

ALTER TABLE public.payment_events
DROP CONSTRAINT IF EXISTS chk_payment_events_status;

ALTER TABLE public.payment_events
ADD CONSTRAINT chk_payment_events_status
CHECK (status IN ('PENDING', 'COMPLETED', 'REJECTED'));

-- Backfill status based on processed_at for existing rows
UPDATE public.payment_events
SET status = 'COMPLETED'
WHERE processed_at IS NOT NULL AND status = 'PENDING';

-- Index for status filtering and idempotency checks
CREATE INDEX IF NOT EXISTS idx_payment_events_status ON public.payment_events(status);
