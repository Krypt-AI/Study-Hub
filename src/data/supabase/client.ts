/**
 * The browser's Supabase client. It is created with the public anon key only: what a
 * learner can read or write is decided by row level security in the database, never by
 * this code. The service_role key bypasses those policies and must never be used here.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../backend';

let client: SupabaseClient | undefined;

export function supabaseClient(): SupabaseClient {
  const config = supabaseConfig();
  if (!config) throw new Error('Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).');
  // PKCE: a provider returns a one-time code to /sign-in, which the client exchanges for a session.
  client ??= createClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
  return client;
}
