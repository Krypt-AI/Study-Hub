/**
 * Global setup: open each dev server's app once before the tests start. Vite compiles modules on
 * their first request; without this the first test on each server pays for that compile, which,
 * with both servers starting together, can take most of a test's time limit.
 */
import { chromium, type FullConfig } from '@playwright/test';

export default async function warmUp(config: FullConfig): Promise<void> {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    await Promise.all(
      config.projects.map(async (project) => {
        const page = await browser.newPage({ baseURL: project.use.baseURL });
        for (const path of ['/', '/calendar', '/settings']) {
          await page.goto(path, { waitUntil: 'commit', timeout: 120_000 });
          await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 120_000 });
        }
        await page.close();
      }),
    );
  } finally {
    await browser.close();
  }
}
