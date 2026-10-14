/** The streak page: days in a row, whether today counts, and the last twelve weeks. */
import { expect, test } from './fixtures';

test('an answer makes today count on the streak page, reached from Today', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('region', { name: 'This week' }).getByRole('link', { name: 'Your streak' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Your streak' })).toBeVisible();
  const figures = page.getByRole('region', { name: 'Days in a row' });
  await expect(figures.getByRole('definition').filter({ hasText: 'Not yet' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Study on each day of the last 12 weeks' }).getByRole('row')).toHaveCount(7);

  await page.goto('/courses/ai-01-python/lessons/ai-01-python.l01');
  const answer = page.getByRole('textbox', { name: 'Your answer' });
  await answer.fill('3');
  await answer.press('Enter');
  await expect(page.getByRole('region', { name: 'Feedback' })).toBeVisible();

  await page.goto('/streak');
  await expect(page.getByText('Today counts already. Well done!')).toBeVisible();
  await expect(figures.getByRole('definition').filter({ hasText: '1 day' }).first()).toBeVisible();
});
