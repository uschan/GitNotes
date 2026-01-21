import { createClient, SupabaseClient } from '@supabase/supabase-js';

// CRITICAL FOR VPS/PRODUCTION BUILDS:
// We must access import.meta.env properties DIRECTLY (e.g., import.meta.env.VITE_VAR).
// Vite performs static string replacement at build time. 
// Indirect access (like `const env = import.meta.env; const val = env.KEY`) often fails 
// because the bundler cannot trace the variable usage to perform the replacement.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here'
);

// Standard anon client for public checks
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
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
}