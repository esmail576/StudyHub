import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your configuration.');
}

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Create or get the Supabase client instance
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      supabaseUrl || 'https://default-project.supabase.co',
      supabaseAnonKey || 'default-anon-key'
    );
  }
  return supabaseInstance;
})(); 