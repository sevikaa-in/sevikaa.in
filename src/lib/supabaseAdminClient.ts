import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';

const env = getServerEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';

const isServiceKeyValid = serviceKey && !serviceKey.includes('placeholder') && serviceKey.length > 50;

if (env.NODE_ENV === 'production' && !isServiceKeyValid) {
  throw new Error('[supabaseAdmin] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing or invalid in production environment.');
}

if (!isServiceKeyValid && typeof process !== 'undefined') {
  console.warn('[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY is missing or invalid. Privileged admin queries will fail closed at runtime.');
}

const apiKey = isServiceKeyValid ? serviceKey : 'invalid-service-key-missing';

export const supabaseAdmin = createClient(supabaseUrl || 'https://unconfigured.local', apiKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
