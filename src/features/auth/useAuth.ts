/** Who is using Study Hub, provided by AuthProvider. */
import { createContext, useContext } from 'react';

export type OAuthProviderId = 'google' | 'discord' | 'github';

export interface Account {
  id: string;
  email?: string;
  name: string;
  avatarUrl?: string;
  /** Providers the account has signed in with, e.g. ['google']. */
  providers: string[];
  /** On the members list: may open the courses outside the University area. */
  member: boolean;
}

export type AuthState =
  /** No Supabase project configured: everything stays in this browser and nothing is locked. */
  | { status: 'local' }
  | { status: 'loading' }
  /** Signed out: open courses only, and progress lasts until the page is closed. */
  | { status: 'guest' }
  | { status: 'signed-in'; account: Account };

export interface AuthActions {
  signInWithProvider(provider: OAuthProviderId, next: string): Promise<void>;
  signInWithEmail(email: string, password: string): Promise<void>;
  /** Resolves to true when the account still has to be confirmed by email. */
  signUpWithEmail(email: string, password: string): Promise<boolean>;
  signOut(): Promise<void>;
  /** Fetches a fresh token, picking up a change to the members list. */
  refreshMembership(): Promise<void>;
}

export type Auth = AuthState & AuthActions;

export const AuthContext = createContext<Auth | undefined>(undefined);

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}

/** Members-only courses can be opened: always in local mode, otherwise by members. */
export const canOpenMembersContent = (auth: AuthState) => auth.status === 'local' || (auth.status === 'signed-in' && auth.account.member);
