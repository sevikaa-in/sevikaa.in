-- Migration: Add provider event timestamp tracking to employer_profiles for out-of-order webhook sequence protection
ALTER TABLE public.employer_profiles
    ADD COLUMN IF NOT EXISTS subscription_event_timestamp BIGINT DEFAULT 0;
