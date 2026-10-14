/** Starred courses focus Today; with none starred, Today shows every course and a tip. */
import { expect, test } from './fixtures';

test('starring a course focuses Today on it, and unstarring brings everything back', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Tip: star the courses you are taking', { exact: false })).toBeVisible();

  await page.goto('/courses');
  const star = page.getByRole('button', { name: 'Star Object-Oriented Programming' });
  await star.click();
  await expect(star).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/');
  await expect(page.getByText('Showing your 1 starred course.', { exact: false })).toBeVisible();
  const startHere = page.getByRole('region', { name: 'Start here' });
  await expect(startHere.getByText('Object-Oriented Programming')).toBeVisible();
  await expect(startHere.getByText('HSK 1')).toHaveCount(0);

  // The star is saved with the learner: it survives a reload, and can be removed from the course page.
  await page.goto('/courses/cmpd363');
  const courseStar = page.getByRole('button', { name: 'Star Object-Oriented Programming' });
  await expect(courseStar).toHaveAttribute('aria-pressed', 'true');
  await courseStar.click();
  await expect(courseStar).toHaveAttribute('aria-pressed', 'false');
  await page.goto('/');
  await expect(page.getByText('Tip: star the courses you are taking', { exact: false })).toBeVisible();
});
