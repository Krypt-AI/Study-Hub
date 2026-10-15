/**
 * Global setup, once per dev server:
 *  - Open the app before the tests start. Vite compiles modules on their first request; without
 *    this the first test on each server pays for that compile, which, with both servers starting
 *    together, can take most of a test's time limit.
 *  - Answer the Welcome page as a university student (and, in local mode, choose every extra) and
 *    save the browser's storage, IndexedDB included, so the other tests start past them (see
 *    `storageState` in playwright.config.ts).
 */
import { chromium, type FullConfig } from '@playwright/test';
import { answerWelcome, chooseExtras, EXTRAS } from './welcomeSteps';

export const storageStatePath = (project: string) => `e2e/.state/${project}.json`;

export default async function warmUp(config: FullConfig): Promise<void> {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    await Promise.all(
      config.projects.map(async (project) => {
        const context = await browser.newContext({ baseURL: project.use.baseURL });
        const page = await context.newPage();
        await page.goto('/', { waitUntil: 'commit', timeout: 120_000 });
        await answerWelcome(page, { age: '20' }, { timeout: 120_000 });
        // Local mode chooses extras as a signed-in learner does; a guest (the signed-in project) is not asked.
        if (project.name === 'local') await chooseExtras(page, EXTRAS, { timeout: 120_000 });
        await page.getByRole('heading', { level: 1, name: 'Dashboard' }).waitFor({ timeout: 120_000 });
        for (const path of ['/calendar', '/settings']) {
          await page.goto(path, { waitUntil: 'commit', timeout: 120_000 });
          await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 120_000 });
        }
        await context.storageState({ path: storageStatePath(project.name), indexedDB: true });
        await context.close();
      }),
    );
  } finally {
    await browser.close();
  }
}
