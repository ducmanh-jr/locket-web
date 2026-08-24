import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://zrvoevcwnrdegbwzaexc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_q5ipNkes5jd0i6ijlHebDg_R8uPzwST';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl !== 'https://your-supabase-url.supabase.co' &&
    supabaseUrl !== 'https://placeholder.supabase.co'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
