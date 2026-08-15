import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (process.env.NODE_ENV !== 'production' && (!supabaseUrl || supabaseUrl.includes('placeholder'))) {
  console.warn("Supabase credentials warning: Running in non-production environment with unconfigured or placeholder credentials.");
}

export const supabase = createClient(supabaseUrl || 'https://unconfigured.local', supabaseAnonKey || 'unconfigured');
