import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hcuvizvdsooeypetvmhm.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isServiceKeyValid = serviceKey && !serviceKey.includes('placeholder');
const apiKey = isServiceKeyValid ? serviceKey : anonKey;



export const supabaseAdmin = createClient(supabaseUrl, apiKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
