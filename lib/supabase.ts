import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cast import.meta to any to avoid "Property 'env' does not exist" type error
// when vite/client types are not loaded correctly.
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Check if valid configuration exists (not empty and not default placeholders)
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;