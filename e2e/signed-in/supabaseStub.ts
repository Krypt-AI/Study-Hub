/**
 * Stands in for Supabase and the Netlify content gate inside the browser, so the hosted
 * setup (guests and signed-in learners) can be tested without a real project or account.
 *
 * The "signed-in" Playwright project builds the app with VITE_SUPABASE_URL = STUB_SUPABASE_URL;
 * every request to that origin is answered here, for the account whose token it carries. Each
 * account has a main learner and, optionally, rows in its tables; every write is accepted. The gate
 * applies the real access rules (accessRules.ts) to course files: without the access cookie,
 * locked files answer 401. Token signatures are checked by the edge function's unit tests, not here.
 */
import type { Page, Route } from '@playwright/test';
import { ACCESS_COOKIE, ACCESS_MANIFEST_PATH, accessFor, type AccessManifest } from '../../src/domain/content/accessRules';

export const STUB_SUPABASE_URL = 'http://supabase.stub.test';
/** supabase-js stores the session under `sb-<first label of the project host>-auth-token`. */
const SESSION_STORAGE_KEY = 'sb-supabase-auth-token';

export interface StubAccount {
  id: string;
  name: string;
  email: string;
  /** Records in the account's tables, by table name, e.g. `{ important_dates: [...] }`. */
  rows?: Record<string, object[]>;
}

export const STUB_ACCOUNT: StubAccount = { id: '00000000-0000-4000-8000-0000000000e2', name: 'Test Learner', email: 'learner@example.com' };

const user = (account: StubAccount) => ({
  id: account.id,
  aud: 'authenticated',
  role: 'authenticated',
  email: account.email,
  app_metadata: { provider: 'google', providers: ['google'] },
  user_metadata: { full_name: account.name },
  created_at: '2026-10-01T00:00:00Z',
});

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

/** A session in the shape supabase-js stores; the token is unsigned, which only the real gate would notice. */
function sessionFor(account: StubAccount) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const claims = { sub: account.id, role: 'authenticated', aud: 'authenticated', email: account.email, exp: expiresAt };
  return {
    access_token: `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(claims)}.stub-signature`,
    refresh_token: `stub-refresh-${account.id}`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user: user(account),
  };
}

/** The account whose token a request carries, if any. */
function accountOf(authorization: string | undefined, accounts: StubAccount[]): StubAccount | undefined {
  const payload = authorization?.replace(/^Bearer /u, '').split('.')[1];
  if (!payload) return undefined;
  try {
    const { sub } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { sub?: string };
    return accounts.find((account) => account.id === sub);
  } catch {
    return undefined;
  }
}

const MAIN_LEARNER = { id: 'main', name: 'Learner 1', createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z' };

/** Answers auth and REST requests: each account sees only its own rows; every write is accepted. */
async function answerSupabase(route: Route, accounts: StubAccount[]): Promise<void> {
  const request = route.request();
  const { pathname } = new URL(request.url());
  const account = accountOf((await request.allHeaders()).authorization, accounts);
  const json = (status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  if (pathname === '/auth/v1/user') return account ? json(200, user(account)) : json(401, { message: 'No session' });
  if (pathname === '/auth/v1/token') return account ? json(200, sessionFor(account)) : json(400, { message: 'Invalid refresh token' });
  if (pathname === '/auth/v1/logout') return route.fulfill({ status: 204 });
  if (pathname.startsWith('/rest/v1/rpc/')) return route.fulfill({ status: 204 });
  if (pathname.startsWith('/rest/v1/')) {
    if (request.method() !== 'GET' && request.method() !== 'HEAD') return json(201, []);
    const table = pathname.slice('/rest/v1/'.length);
    const records = table === 'learners' ? [MAIN_LEARNER] : (account?.rows?.[table] ?? []);
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': `*/${records.length}` }, body: JSON.stringify(records.map((record) => ({ record }))) });
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

/** Stubs Supabase (for the given accounts) and the gate, for a visitor who is not signed in. */
export async function asGuest(page: Page, accounts: StubAccount[] = [STUB_ACCOUNT]): Promise<void> {
  await page.route(`${STUB_SUPABASE_URL}/**`, (route) => answerSupabase(route, accounts));
  await installContentGate(page);
}

/** Stubs Supabase and the gate, and opens the first page with a stored session for `account`. */
export async function asSignedIn(page: Page, account: StubAccount = STUB_ACCOUNT, others: StubAccount[] = []): Promise<void> {
  await asGuest(page, [account, ...others]);
  // Only before the first page of the tab, so that signing out stays signed out. A string script:
  // the e2e TypeScript project has no DOM types.
  const key = JSON.stringify(SESSION_STORAGE_KEY);
  await page.addInitScript({
    content: `if (!sessionStorage.getItem('stub-session-seeded')) { sessionStorage.setItem('stub-session-seeded', '1'); localStorage.setItem(${key}, ${JSON.stringify(JSON.stringify(sessionFor(account)))}); }`,
  });
}

/** Signs in as `account` on the current page, as returning from Google would, and reloads. */
export async function signInAs(page: Page, account: StubAccount): Promise<void> {
  await page.evaluate(`localStorage.setItem(${JSON.stringify(SESSION_STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(sessionFor(account)))})`);
  await page.reload();
}

/** The keys this site holds in localStorage. */
export const localStorageKeys = (page: Page) => page.evaluate('Object.keys(localStorage)') as Promise<string[]>;
