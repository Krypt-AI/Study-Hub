/**
 * Sign-in methods shown on the sign-in page. VITE_AUTH_PROVIDERS lists them in order
 * (default "google,discord,github"); add "email" to offer email and password as well. Each
 * one must also be enabled in Supabase (Authentication -> Providers).
 */
import type { OAuthProviderId } from './useAuth';

export type SignInMethod = OAuthProviderId | 'email';

export const PROVIDER_LABELS: Record<OAuthProviderId, string> = { google: 'Google', discord: 'Discord', github: 'GitHub' };

const KNOWN: readonly SignInMethod[] = ['google', 'discord', 'github', 'email'];

export function signInMethods(setting = import.meta.env.VITE_AUTH_PROVIDERS as string | undefined): SignInMethod[] {
  const listed = (setting?.trim() ? setting : 'google,discord,github')
    .split(',')
    .map((method) => method.trim().toLowerCase())
    .filter((method): method is SignInMethod => (KNOWN as readonly string[]).includes(method));
  return [...new Set(listed)];
}

/** Only same-site paths, so the sign-in page cannot be used to bounce users to another site. */
export function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') && !value.startsWith('/sign-in') ? value : '/';
}
