/** Code really runs in the sandboxed workers, and editor-only languages say so. */
import { expect, test } from './fixtures';

async function newProject(page: import('@playwright/test').Page, language: RegExp) {
  await page.goto('/playground');
  await page.getByRole('button', { name: language }).first().click();
  await expect(page.getByRole('textbox', { name: 'Project title' })).toBeVisible();
}

test('JavaScript runs in its worker', async ({ page }) => {
  await newProject(page, /^JavaScript/u);
  await page.getByRole('button', { name: 'Run' }).click();
  const output = page.getByRole('region', { name: 'Output' });
  await expect(output.getByText('finished')).toBeVisible();
  await expect(output).toContainText(/1,\s*2,\s*3/u);
});

test('SQL runs on an in-memory SQLite database', async ({ page }) => {
  await newProject(page, /^SQL \(SQLite\)/u);
  await page.getByRole('button', { name: 'Run' }).click();
  const output = page.getByRole('region', { name: 'Output' });
  await expect(output.getByRole('cell', { name: 'second' })).toBeVisible();
});

test('the sandbox blocks network access from learner code', async ({ page }) => {
  await newProject(page, /^JavaScript/u);
  const editor = page.getByRole('textbox', { name: 'Program code' });
  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type("fetch('https://example.com').then(() => console.log('reached'), (error) => console.log('blocked:', error.message));");
  await expect(editor).toContainText("fetch('https://example.com')");
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.getByRole('region', { name: 'Output' })).toContainText('blocked: Network access is disabled in the Study Hub sandbox.');
});

test('C is labelled editor-only and cannot be run', async ({ page }) => {
  await newProject(page, /^C\b/u);
  await expect(page.getByText(/Editor only: C cannot be compiled or run/u)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run' })).toHaveCount(0);
});

test('Python runs in Pyodide (downloads the runtime from the CDN on first use)', async ({ page }) => {
  test.setTimeout(180_000);
  await newProject(page, /^Python/u);
  await page.getByRole('button', { name: 'Run' }).click();
  const output = page.getByRole('region', { name: 'Output' });
  await expect(output).toContainText('Hello, Study Hub!', { timeout: 150_000 });
});
