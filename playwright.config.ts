/**
 * End-to-end tests in a real browser against the dev server. They use the installed Google
 * Chrome (channel "chrome"), so no separate Playwright browser download is needed.
 * Run `npm run content:build` first: the tests use the built course content.
 */
import { defineConfig } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  // The first run of each code runtime compiles its worker in dev mode, which is slow under parallel load.
  expect: { timeout: 15_000 },
  fullyParallel: true,
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
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
