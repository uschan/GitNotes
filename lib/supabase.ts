import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cast import.meta to any to avoid "Property 'env' does not exist" type error
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here'
);

// Standard anon client for public checks
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

// Authenticated client factory
// This injects the 'x-gitnotes-key' header which our RLS policies will check
export const getAuthenticatedClient = (secretKey: string): SupabaseClient | null => {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-gitnotes-key': secretKey
      }
    }
  });
};