/** Calendar steps shared by several tests. */
import { expect, type Page } from '@playwright/test';

/** Adds an important date from the calendar page; its title is "<subject code> <kind>", e.g. "CMPD363 Quiz", or the kind alone. */
export async function addImportantDate(page: Page, { kind, subject, day, lastDay }: { kind: string; subject?: string; day: string; lastDay?: string }): Promise<void> {
  await page.getByRole('button', { name: 'Add important date' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add an important date' });
  await dialog.getByLabel('What').selectOption(kind);
  if (subject) await dialog.getByLabel('Subject').selectOption({ label: subject });
  await dialog.getByLabel('Day', { exact: true }).fill(day);
  if (lastDay) await dialog.getByLabel('Last day').fill(lastDay);
  await dialog.getByRole('button', { name: 'Add date' }).click();
  await expect(dialog).toBeHidden();
}

/** Opens the calendar's list of important dates. */
export async function openImportantDates(page: Page): Promise<void> {
  await page.goto('/calendar');
  await page.getByRole('tab', { name: /Important dates/u }).click();
}

/** Adds a weekly class from the calendar page, by name (no subject). */
export async function addClass(page: Page, { name, type, weekday }: { name: string; type: 'Lecture' | 'Lab'; weekday: string }): Promise<void> {
  await page.getByRole('button', { name: 'Add class' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a class' });
  await dialog.getByLabel('Name').fill(name);
  await dialog.getByLabel('Type').selectOption(type);
  await dialog.getByLabel('Day').selectOption({ label: weekday });
  await dialog.getByRole('button', { name: 'Add class' }).click();
  await expect(dialog).toBeHidden();
}

/** Today's weekday as the calendar names it, e.g. "Wednesday". */
export const todayWeekday = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });

/** The week view's column for a day, found by its weekday name. */
export const weekColumn = (page: Page, weekday: string) => page.getByRole('region', { name: new RegExp(`^${weekday} `, 'u') });
