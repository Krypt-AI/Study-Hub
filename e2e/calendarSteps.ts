/** Calendar steps shared by several tests. */
import { expect, type Page } from '@playwright/test';

/** Adds an important date from the calendar page; its title is "<subject code> <kind>", e.g. "CMPD363 Quiz". */
export async function addImportantDate(page: Page, { kind, subject, day }: { kind: string; subject: string; day: string }): Promise<void> {
  await page.getByRole('button', { name: 'Add important date' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add an important date' });
  await dialog.getByLabel('What').selectOption(kind);
  await dialog.getByLabel('Subject').selectOption({ label: subject });
  await dialog.getByLabel('Day').fill(day);
  await dialog.getByRole('button', { name: 'Add date' }).click();
  await expect(dialog).toBeHidden();
}

/** Opens the calendar's list of important dates. */
export async function openImportantDates(page: Page): Promise<void> {
  await page.goto('/calendar');
  await page.getByRole('tab', { name: /Important dates/u }).click();
}
