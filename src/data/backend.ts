/**
 * Which storage backend the app uses. With VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set
 * (see .env.example) the app signs in to Supabase; otherwise everything stays in this
 * browser's IndexedDB.
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function supabaseConfig(): SupabaseConfig | undefined {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return url && anonKey ? { url, anonKey } : undefined;
}

export const backendKind = (): 'local' | 'supabase' => (supabaseConfig() ? 'supabase' : 'local');
