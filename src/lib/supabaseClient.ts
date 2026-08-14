import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';

const env = getServerEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (env.NODE_ENV !== 'production' && (!supabaseUrl || supabaseUrl.includes('placeholder'))) {
  console.warn("Supabase credentials warning: Running in non-production environment with unconfigured or placeholder credentials.");
}

export const supabase = createClient(supabaseUrl || 'https://unconfigured.local', supabaseAnonKey || 'unconfigured');
