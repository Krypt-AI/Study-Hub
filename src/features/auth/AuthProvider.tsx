/**
 * Tracks the Supabase session (when Supabase is configured) and keeps the access cookie in step
 * with it, so the host can serve members-only files. Sign-in with Google, Discord or GitHub goes
 * through Supabase and returns to /sign-in, which then continues to the page the user came from.
 */
import type { Session } from '@supabase/supabase-js';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { supabaseConfig } from '@/data/backend';
import { supabaseClient } from '@/data/supabase/client';
import { accessCookie, isMemberToken } from './accessToken';
import { type Account, type Auth, AuthContext, type AuthActions, type AuthState, type OAuthProviderId } from './useAuth';

function accountFrom(session: Session): Account {
  const { user } = session;
  const metadata = user.user_metadata as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === 'string' && value ? value : undefined);
  const providers = user.app_metadata.providers;
  return {
    id: user.id,
    email: user.email,
    name: text(metadata.full_name) ?? text(metadata.name) ?? text(metadata.user_name) ?? user.email?.split('@')[0] ?? 'You',
    avatarUrl: text(metadata.avatar_url) ?? text(metadata.picture),
    providers: Array.isArray(providers) ? providers.filter((provider): provider is string => typeof provider === 'string') : [],
    member: isMemberToken(session.access_token),
  };
}

const stateFrom = (session: Session | null): AuthState => (session ? { status: 'signed-in', account: accountFrom(session) } : { status: 'guest' });

/** Where an OAuth provider sends the user back to: the sign-in page, then `next`. */
const signInReturnUrl =(next: string) => `${window.location.origin}/sign-in?next=${encodeURIComponent(next)}`;

const LOCAL: Auth = {
  status: 'local',
  signInWithProvider: () => Promise.resolve(),
  signInWithEmail: () => Promise.resolve(),
  signUpWithEmail: () => Promise.resolve(false),
  signOut: () => Promise.resolve(),
  refreshMembership: () => Promise.resolve(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  return supabaseConfig() ? <SupabaseAuthProvider>{children}</SupabaseAuthProvider> : <AuthContext.Provider value={LOCAL}>{children}</AuthContext.Provider>;
}

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const secure = window.location.protocol === 'https:';
    // Fires INITIAL_SESSION once the client has read the stored session (or exchanged the
    // code a provider returned), then on every sign-in, refresh and sign-out.
    const { data } = supabaseClient().auth.onAuthStateChange((_event, session) => {
      document.cookie = accessCookie(session, secure);
      setState(stateFrom(session));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const actions = useMemo<AuthActions>(() => {
    const auth = () => supabaseClient().auth;
    const fail = (error: { message: string } | null) => {
      if (error) throw new Error(error.message);
    };
    return {
      async signInWithProvider(provider: OAuthProviderId, next: string) {
        fail((await auth().signInWithOAuth({ provider, options: { redirectTo: signInReturnUrl(next) } })).error);
      },
      async signInWithEmail(email, password) {
        fail((await auth().signInWithPassword({ email, password })).error);
      },
      async signUpWithEmail(email, password) {
        const { data, error } = await auth().signUp({ email, password, options: { emailRedirectTo: signInReturnUrl('/') } });
        fail(error);
        return !data.session;
      },
      async signOut() {
        await auth().signOut();
        // Start clean: every cached query belonged to the account.
        window.location.assign('/');
      },
      async refreshMembership() {
        fail((await auth().refreshSession()).error);
      },
    };
  }, []);

  const value = useMemo<Auth>(() => ({ ...state, ...actions }), [state, actions]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
