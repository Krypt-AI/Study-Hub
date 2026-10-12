/**
 * Sign-in methods shown on the sign-in page. VITE_AUTH_PROVIDERS lists them in order
 * (default "google"; "discord", "github" and "email" can be added). Each one must also be
 * enabled in Supabase (Authentication -> Sign In / Providers).
 */
import type { OAuthProviderId } from './useAuth';

export type SignInMethod = OAuthProviderId | 'email';

export const PROVIDER_LABELS: Record<OAuthProviderId, string> = { google: 'Google', discord: 'Discord', github: 'GitHub' };

const KNOWN: readonly SignInMethod[] = ['google', 'discord', 'github', 'email'];

export function signInMethods(setting = import.meta.env.VITE_AUTH_PROVIDERS as string | undefined): SignInMethod[] {
  const listed = (setting?.trim() ? setting : 'google')
    .split(',')
    .map((method) => method.trim().toLowerCase())
    .filter((method): method is SignInMethod => (KNOWN as readonly string[]).includes(method));
  return [...new Set(listed)];
}

/** The configured providers for sentences: "Google", "Google or GitHub", "Google, Discord or GitHub". */
export function providerNames(methods: readonly SignInMethod[] = signInMethods()): string {
  const names = methods.filter((method): method is OAuthProviderId => method !== 'email').map((provider) => PROVIDER_LABELS[provider]);
  if (methods.includes('email')) names.push('email');
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} or ${names.at(-1)}` : (names[0] ?? 'your account');
}

/** Only same-site paths, so the sign-in page cannot be used to bounce users to another site. */
export function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') && !value.startsWith('/sign-in') ? value : '/';
}
