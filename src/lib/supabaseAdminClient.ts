import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hcuvizvdsooeypetvmhm.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isServiceKeyValid = serviceKey && !serviceKey.includes('placeholder') && serviceKey.length > 50;
const apiKey = isServiceKeyValid ? serviceKey : anonKey;

if (!isServiceKeyValid && typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  console.warn('[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY is missing or invalid. Falling back to anon key — storage uploads and admin operations will fail RLS checks.');
}

export const supabaseAdmin = createClient(supabaseUrl, apiKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
