/** "Show on Today" per subject: only chosen subjects bring their work to Today; Resume is always the latest lesson. */
import { expect, test } from './fixtures';

test('switching a subject on shows it on Today, and Settings lists it', async ({ page }) => {
  await page.goto('/courses/cmpd363');
  const showOnToday = page.getByRole('switch', { name: 'Show on Today' });
  await expect(showOnToday).toHaveAttribute('aria-checked', 'false');
  await showOnToday.click();
  await expect(showOnToday).toHaveAttribute('aria-checked', 'true');

  await page.goto('/');
  const startHere = page.getByRole('region', { name: 'Start here' });
  await expect(startHere.getByText('Object-Oriented Programming')).toBeVisible();
  await expect(startHere.getByText('HSK 1')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Your courses' }).getByRole('link', { name: '1 on Today' })).toBeVisible();

  await page.goto('/settings');
  const listed = page.getByRole('switch', { name: 'Show Object-Oriented Programming on Today' });
  await expect(listed).toHaveAttribute('aria-checked', 'true');
  await listed.click();
  await expect(listed).toHaveAttribute('aria-checked', 'false');
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Start here' }).getByText('HSK 1')).toBeVisible();
});
