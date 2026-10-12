/**
 * Netlify edge function in front of every file: the courses outside the University area, their
 * page images and audio, and their search index are served only to signed-in users. See
 * src/domain/content/accessRules.ts and docs/DEPLOY.md.
 */
import type { Config, Context } from '@netlify/edge-functions';
import { ACCESS_COOKIE, ACCESS_MANIFEST_PATH, type AccessManifest } from '../../../src/domain/content/accessRules.ts';
import { decide } from './gate.ts';
import { supabaseTokenVerifier, type TokenVerifier } from './token.ts';

/** With no manifest every course and material is locked. */
const LOCKED: AccessManifest = { openCourses: [], openSources: [] };

let manifest: Promise<AccessManifest> | undefined;
let verifier: TokenVerifier | undefined;

/** The manifest belongs to this deploy, so one fetch per edge instance is enough. */
function loadManifest(origin: string): Promise<AccessManifest> {
  manifest ??= fetch(new URL(ACCESS_MANIFEST_PATH, origin))
    .then((response) => (response.ok ? (response.json() as Promise<AccessManifest>) : LOCKED))
    .catch(() => LOCKED);
  return manifest;
}

function tokenVerifier(): TokenVerifier {
  const supabaseUrl = Netlify.env.get('SUPABASE_URL') ?? Netlify.env.get('VITE_SUPABASE_URL');
  // Without a Supabase project nobody can sign in, so locked content stays locked.
  verifier ??= supabaseUrl ? supabaseTokenVerifier({ supabaseUrl, jwtSecret: Netlify.env.get('SUPABASE_JWT_SECRET') }) : async () => undefined;
  return verifier;
}

export default async function contentGate(request: Request, context: Context): Promise<Response | undefined> {
  const url = new URL(request.url);
  const decision = await decide(url.pathname, context.cookies.get(ACCESS_COOKIE), await loadManifest(url.origin), tokenVerifier());

  if (!decision.allow) {
    return Response.json({ error: decision.message }, { status: decision.status, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!decision.locked) return undefined;

  // Locked files may be cached by the user's browser, never by a shared cache.
  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, max-age=3600');
  headers.append('Vary', 'Cookie');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export const config: Config = {
  path: '/*',
  // Built app code and the open content indexes need no check.
  excludedPath: ['/assets/*', '/favicon.svg', ACCESS_MANIFEST_PATH, '/content/catalog.json', '/content/search-index.json'],
};
