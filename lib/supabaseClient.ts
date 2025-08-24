import { createClient } from '@supabase/supabase-js';

// Public anon key is okay in client; secure operations must be via RLS policies.
// Env vars (EXPO_PUBLIC_) are exposed in app bundles; ensure bucket policies restrict access appropriately.

// @ts-ignore
export const supabaseUrl: string | undefined = process.env?.EXPO_PUBLIC_SUPABASE_URL?.trim();
// @ts-ignore
export const supabaseAnonKey: string | undefined = process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const hasSupabase = !!supabaseUrl && !!supabaseAnonKey;

export const supabase = hasSupabase ? createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: { persistSession: false },
}) : undefined;

if (hasSupabase) {
  // Minimal diagnostic log (do not log keys)
  // eslint-disable-next-line no-console
  console.log('[supabase] client initialized', { url: supabaseUrl });
}
