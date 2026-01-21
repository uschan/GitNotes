import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Access environment variables safely.
// We use a fallback object to prevent crashes if import.meta.env is undefined.
const env = import.meta.env || {};
const supabaseUrl = (env as any).VITE_SUPABASE_URL || '';
const supabaseAnonKey = (env as any).VITE_SUPABASE_ANON_KEY || '';

// Logic to determine if we should run in Cloud Mode (Supabase) or Local Mode (LocalStorage)
// In local development without a .env file, these checks ensure we fall back to constants.ts data.
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  // Check against common placeholder values to avoid connecting to non-existent backends
  !supabaseUrl.includes('your-project-id') &&
  !supabaseUrl.includes('your_supabase_project_url')
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