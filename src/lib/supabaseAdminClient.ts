import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isServiceKeyValid = serviceKey && !serviceKey.includes('placeholder') && serviceKey.length > 50;

if (!isServiceKeyValid && typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  throw new Error('[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY is required for privileged server operations.');
}

// Fail-closed: Never fall back to anonKey for administrative operations.
// Use placeholder key during build/test if missing to prevent build crashes.
const apiKey = isServiceKeyValid ? serviceKey : (process.env.NODE_ENV === 'test' ? 'placeholder-service-key-test' : serviceKey);

export const supabaseAdmin = createClient(supabaseUrl, apiKey || 'invalid-service-key-missing', {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

