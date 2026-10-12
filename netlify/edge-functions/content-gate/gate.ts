/**
 * The decision for one request: let it through, or refuse it (401) because the visitor is not
 * signed in. Any real account passes; Supabase's anonymous sign-ins, if ever enabled, do not.
 * Kept apart from the Netlify entry point so it can be tested.
 */
import { type AccessManifest, accessFor } from '../../../src/domain/content/accessRules.ts';
import type { TokenVerifier } from './token.ts';

export type GateDecision = { allow: true; locked: boolean } | { allow: false; status: 401; message: string };

export async function decide(pathname: string, token: string | undefined, manifest: AccessManifest, verify: TokenVerifier): Promise<GateDecision> {
  if (accessFor(pathname, manifest) === 'open') return { allow: true, locked: false };
  const payload = await verify(token);
  const signedIn = Boolean(payload?.sub) && payload?.role === 'authenticated' && payload.is_anonymous !== true;
  if (!signedIn) return { allow: false, status: 401, message: 'Sign in to open this course.' };
  return { allow: true, locked: true };
}
