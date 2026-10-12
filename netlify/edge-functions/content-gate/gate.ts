/**
 * The decision for one request: let it through, or refuse it because the visitor is signed out
 * (401) or not a member (403). Kept apart from the Netlify entry point so it can be tested.
 */
import { type AccessManifest, accessFor, MEMBER_CLAIM } from '../../../src/domain/content/accessRules.ts';
import type { TokenVerifier } from './token.ts';

export type GateDecision = { allow: true; members: boolean } | { allow: false; status: 401 | 403; message: string };

export async function decide(pathname: string, token: string | undefined, manifest: AccessManifest, verify: TokenVerifier): Promise<GateDecision> {
  if (accessFor(pathname, manifest) === 'open') return { allow: true, members: false };
  const payload = await verify(token);
  if (!payload) return { allow: false, status: 401, message: 'Sign in to open this course.' };
  if (payload[MEMBER_CLAIM] !== true) return { allow: false, status: 403, message: 'Your account is not on the members list yet.' };
  return { allow: true, members: true };
}
