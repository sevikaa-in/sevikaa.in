import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://hcuvizvdsooeypetvmhm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjdXZpenZkc29vZXlwZXR2bWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MDMxMTAsImV4cCI6MjEwMDE3OTExMH0.uZ6LHNSvqCZlgprgzvdMxO7TNr87FDFc5h6lGSoHKYc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
