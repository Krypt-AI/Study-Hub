/**
 * The Supabase access token as the hosting layer sees it: the app copies it into a cookie so
 * that every file request (course JSON, page images, audio) carries it, and reads the members
 * claim from it to show what is unlocked. The edge function verifies the token; this code only
 * reads it, so a tampered claim unlocks nothing.
 */
import { ACCESS_COOKIE, MEMBER_CLAIM } from '@/domain/content/accessRules';

/** The token's payload, or undefined if it is not a readable JWT. */
export function tokenClaims(token: string): Record<string, unknown> | undefined {
  const payload = token.split('.')[1];
  if (!payload) return undefined;
  try {
    const json = atob(payload.replace(/-/gu, '+').replace(/_/gu, '/'));
    const bytes = Uint8Array.from(json, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export const isMemberToken = (token: string) => tokenClaims(token)?.[MEMBER_CLAIM] === true;

/** A `document.cookie` assignment holding the token until it expires, or clearing it. */
export function accessCookie(session: { access_token: string; expires_in: number } | null, secure: boolean): string {
  const attributes = `Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
  return session ? `${ACCESS_COOKIE}=${session.access_token}; Max-Age=${session.expires_in}; ${attributes}` : `${ACCESS_COOKIE}=; Max-Age=0; ${attributes}`;
}
