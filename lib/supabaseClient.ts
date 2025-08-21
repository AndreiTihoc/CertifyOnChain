import { createClient } from '@supabase/supabase-js';

// Public anon key is okay in client; secure operations must be via RLS policies.
// Env vars (EXPO_PUBLIC_) are exposed in app bundles; ensure bucket policies restrict access appropriately.

// @ts-ignore
const supabaseUrl: string | undefined = process.env?.EXPO_PUBLIC_SUPABASE_URL?.trim();
// @ts-ignore
const supabaseAnon: string | undefined = process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const hasSupabase = !!supabaseUrl && !!supabaseAnon;

export const supabase = hasSupabase ? createClient(supabaseUrl!, supabaseAnon!, {
  auth: { persistSession: false },
}) : undefined;
