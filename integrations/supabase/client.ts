import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!client) {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      'https://mngrodgujznnlczqorod.supabase.co';
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      client = createClient(supabaseUrl, supabaseAnonKey);
    } else {
      return null;
    }
  }

  return client;
};
