/**
 * Stands in for Supabase and the Netlify content gate inside the browser, so the hosted
 * setup (guests and signed-in learners) can be tested without a real project or account.
 *
 * The "signed-in" Playwright project builds the app with VITE_SUPABASE_URL = STUB_SUPABASE_URL;
 * every request to that origin is answered here. The gate applies the real access rules
 * (accessRules.ts) to course files: without the access cookie, locked files answer 401.
 * Token signatures are checked by the edge function's unit tests, not here.
 */
import type { Page, Route } from '@playwright/test';
import { ACCESS_COOKIE, ACCESS_MANIFEST_PATH, accessFor, type AccessManifest } from '../../src/domain/content/accessRules';

export const STUB_SUPABASE_URL = 'http://supabase.stub.test';
/** supabase-js stores the session under `sb-<first label of the project host>-auth-token`. */
const SESSION_STORAGE_KEY = 'sb-supabase-auth-token';

export const STUB_ACCOUNT = { id: '00000000-0000-4000-8000-0000000000e2', name: 'Test Learner', email: 'learner@example.com' };

const STUB_USER = {
  id: STUB_ACCOUNT.id,
  aud: 'authenticated',
  role: 'authenticated',
  email: STUB_ACCOUNT.email,
  app_metadata: { provider: 'google', providers: ['google'] },
  user_metadata: { full_name: STUB_ACCOUNT.name },
  created_at: '2026-10-01T00:00:00Z',
};

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

/** A session in the shape supabase-js stores; the token is unsigned, which only the real gate would notice. */
function stubSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const claims = { sub: STUB_ACCOUNT.id, role: 'authenticated', aud: 'authenticated', email: STUB_ACCOUNT.email, exp: expiresAt };
  return {
    access_token: `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(claims)}.stub-signature`,
    refresh_token: 'stub-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user: STUB_USER,
  };
}

/** Answers auth and REST requests like an empty Supabase project: no rows, every write accepted. */
async function answerSupabase(route: Route): Promise<void> {
  const request = route.request();
  const { pathname } = new URL(request.url());
  const json = (status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  if (pathname === '/auth/v1/user') return json(200, STUB_USER);
  if (pathname === '/auth/v1/token') return json(200, stubSession());
  if (pathname === '/auth/v1/logout') return route.fulfill({ status: 204 });
  if (pathname.startsWith('/rest/v1/rpc/')) return route.fulfill({ status: 204 });
  if (pathname.startsWith('/rest/v1/')) {
    if (request.method() === 'GET' || request.method() === 'HEAD') return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': '*/0' }, body: '[]' });
    return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
  }
  return json(404, { message: `No stub for ${pathname}` });
}

/** Refuses locked course files, materials and the account search index to requests without the access cookie. */
async function installContentGate(page: Page): Promise<void> {
  let manifest: AccessManifest | undefined;
  await page.route(/\/(content|materials)\//u, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === ACCESS_MANIFEST_PATH) return route.continue();
    manifest ??= (await (await route.fetch({ url: new URL(ACCESS_MANIFEST_PATH, url).href })).json()) as AccessManifest;
    if (accessFor(url.pathname, manifest) === 'open') return route.continue();
    const cookies = (await route.request().allHeaders()).cookie ?? '';
    const signedIn = cookies.split(';').some((cookie) => cookie.trim().startsWith(`${ACCESS_COOKIE}=`) && cookie.trim().length > ACCESS_COOKIE.length + 1);
    return signedIn ? route.continue() : route.fulfill({ status: 401, body: 'Sign in to open this course.' });
  });
}

/** Stubs Supabase and the gate for a visitor who is not signed in. */
export async function asGuest(page: Page): Promise<void> {
  await page.route(`${STUB_SUPABASE_URL}/**`, answerSupabase);
  await installContentGate(page);
}

/** Stubs Supabase and the gate, and starts the page with a stored session for STUB_ACCOUNT. */
export async function asSignedIn(page: Page): Promise<void> {
  await asGuest(page);
  // A string script: the e2e TypeScript project has no DOM types.
  await page.addInitScript({ content: `window.localStorage.setItem(${JSON.stringify(SESSION_STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(stubSession()))});` });
}
