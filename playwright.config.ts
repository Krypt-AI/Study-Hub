/**
 * End-to-end tests in a real browser against the dev server. They use the installed Google
 * Chrome (channel "chrome"), so no separate Playwright browser download is needed.
 * Run `npm run content:build` first: the tests use the built course content.
 *
 * Two projects, each on its own server:
 *  - "local": Supabase switched off, whatever .env.local says. Signed out, the app would use a
 *    guest database, and tests that reload to check saved progress depend on local mode.
 *  - "signed-in" (e2e/signed-in): Supabase pointed at a stub origin that the tests answer in the
 *    browser (supabaseStub.ts), for guests and a stubbed signed-in session.
 * Servers are never reused, so the tests cannot silently run against another server (e.g. an
 * old `vite preview` build).
 */
import { defineConfig } from '@playwright/test';
import { STUB_SUPABASE_URL } from './e2e/signed-in/supabaseStub';

/** Not 4173, the default `vite preview` port. */
const LOCAL_PORT = 4199;
const SIGNED_IN_PORT = 4198;

const devServer = (port: number, env: Record<string, string>) => ({
  command: `node node_modules/vite/bin/vite.js --port ${port} --strictPort`,
  url: `http://localhost:${port}`,
  reuseExistingServer: false,
  // Variables set here take priority over .env files.
  env,
  timeout: 120_000,
});

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/warmUp.ts',
  timeout: 60_000,
  // The first run of each code runtime compiles its worker in dev mode, which is slow under parallel load.
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // More workers than this starve the dev server while it compiles pages on first request,
  // and tests time out at random; three is also faster overall than the default.
  workers: 3,
  reporter: [['list']],
  use: {
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'local', testIgnore: 'signed-in/**', use: { baseURL: `http://localhost:${LOCAL_PORT}` } },
    { name: 'signed-in', testMatch: 'signed-in/**/*.spec.ts', use: { baseURL: `http://localhost:${SIGNED_IN_PORT}` } },
  ],
  webServer: [
    // Empty values select local mode.
    devServer(LOCAL_PORT, { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' }),
    devServer(SIGNED_IN_PORT, { VITE_SUPABASE_URL: STUB_SUPABASE_URL, VITE_SUPABASE_ANON_KEY: 'stub-publishable-key', VITE_AUTH_PROVIDERS: 'google' }),
  ],
});
