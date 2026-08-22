-- Migration: Add CHECK constraint for payment_events status column
-- Restricts status column values strictly to 'PENDING', 'COMPLETED', or 'REJECTED'

ALTER TABLE public.payment_events
DROP CONSTRAINT IF EXISTS chk_payment_events_status;

ALTER TABLE public.payment_events
ADD CONSTRAINT chk_payment_events_status
CHECK (status IN ('PENDING', 'COMPLETED', 'REJECTED'));
