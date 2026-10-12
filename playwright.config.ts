/**
 * End-to-end tests in a real browser against the dev server. They use the installed Google
 * Chrome (channel "chrome"), so no separate Playwright browser download is needed.
 * Run `npm run content:build` first: the tests use the built course content.
 *
 * The server always runs in local mode (Supabase switched off, whatever .env.local says):
 * signed out, the app would use a guest database that is emptied on every page load, and
 * tests that reload to check saved progress would fail. It is never reused, so the tests
 * cannot silently run against another server (e.g. an old `vite preview` build).
 */
import { defineConfig } from '@playwright/test';

/** Not 4173, the default `vite preview` port. */
const PORT = 4199;

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  // The first run of each code runtime compiles its worker in dev mode, which is slow under parallel load.
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // More workers than this starve the dev server while it compiles pages on first request,
  // and tests time out at random; three is also faster overall than the default.
  workers: 3,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `node node_modules/vite/bin/vite.js --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    // Variables set here take priority over .env files; empty values select local mode.
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
    timeout: 120_000,
  },
});
