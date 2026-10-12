/**
 * The app copies the Supabase access token into a cookie so that every file request (course
 * JSON, page images, audio) carries it; the edge function verifies it.
 */
import { ACCESS_COOKIE } from '@/domain/content/accessRules';

/** A `document.cookie` assignment holding the token until it expires, or clearing it. */
export function accessCookie(session: { access_token: string; expires_in: number } | null, secure: boolean): string {
  const attributes = `Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
  return session ? `${ACCESS_COOKIE}=${session.access_token}; Max-Age=${session.expires_in}; ${attributes}` : `${ACCESS_COOKIE}=; Max-Age=0; ${attributes}`;
}
