import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isServiceKeyValid = serviceKey && !serviceKey.includes('placeholder') && serviceKey.length > 50;

if (!isServiceKeyValid && typeof process !== 'undefined') {
  console.warn('[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY is missing or invalid. Privileged admin queries will fail closed at runtime.');
}

// Fail-closed: Use serviceKey if valid, otherwise an explicit dummy key so module evaluation during 'next build' succeeds.
const apiKey = isServiceKeyValid ? serviceKey : 'invalid-service-key-missing';

export const supabaseAdmin = createClient(supabaseUrl, apiKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

