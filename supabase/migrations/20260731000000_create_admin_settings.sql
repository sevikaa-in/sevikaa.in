-- Migration: Create public.admin_settings table for dynamic communication & helpline management
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast key lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(key);

-- Seed default communication numbers
INSERT INTO public.admin_settings (key, value) 
VALUES 
  ('helpline_phone', '+91 7096093039'),
  ('whatsapp_number', '+91 7096093039'),
  ('support_email', 'support@sevikaa.in')
ON CONFLICT (key) DO NOTHING;
