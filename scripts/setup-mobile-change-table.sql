-- Migration: Create mobile_change_requests table for Dual-OTP mobile number updates
CREATE TABLE IF NOT EXISTS public.mobile_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_phone TEXT NOT NULL,
  new_phone TEXT NOT NULL,
  old_otp TEXT NOT NULL,
  new_otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup by user_id and expiration
CREATE INDEX IF NOT EXISTS idx_mobile_change_requests_user_id ON public.mobile_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_change_requests_lookup ON public.mobile_change_requests(id, user_id, verified);

-- Enable RLS
ALTER TABLE public.mobile_change_requests ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on mobile_change_requests" 
  ON public.mobile_change_requests 
  FOR ALL 
  USING (true);
