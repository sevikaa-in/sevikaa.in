import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

if (supabaseUrl.includes('placeholder') || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("Supabase credentials are missing. Verify your local env configurations.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
