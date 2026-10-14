/**
 * What a learner sees follows their level and the extras they chose (local mode chooses extras as a
 * signed-in learner does). Each test starts as a new learner.
 */
import { expect, test } from './fixtures';
import { answerWelcome, chooseExtras } from './welcomeSteps';

test.use({ storageState: { cookies: [], origins: [] } });

const areas = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: 'Course areas' });
const rail = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: 'Main' });

test('the extras chosen once decide the course areas, certifications and search', async ({ page }) => {
  await page.goto('/');
  await answerWelcome(page, { age: '20' });
  await chooseExtras(page, ['Japanese (JLPT)']);

  await page.goto('/courses');
  await expect(areas(page).getByRole('link', { name: /UNITEN/u })).toBeVisible();
  await expect(areas(page).getByRole('link', { name: /Japanese \(JLPT\)/u })).toBeVisible();
  await expect(areas(page).getByRole('link', { name: /Chinese \(HSK\)/u })).toHaveCount(0);

  await rail(page).getByRole('link', { name: 'Certifications' }).click();
  const certificationAreas = page.getByRole('navigation', { name: 'Certification areas' });
  await expect(certificationAreas.getByRole('link', { name: /Japanese \(JLPT\)/u })).toBeVisible();
  await expect(certificationAreas.getByRole('link', { name: /^Cloud/u })).toHaveCount(0);

  await page.keyboard.press('Control+K');
  await page.getByRole('combobox', { name: 'Search' }).fill('HSK 1');
  await expect(page.getByRole('listbox', { name: 'Results' }).getByRole('option', { name: /HSK Standard Course 1/u })).toHaveCount(0);
  await page.keyboard.press('Escape');

  // Turned on in Settings, Chinese joins the lists at once.
  await page.goto('/settings');
  await page.getByRole('region', { name: 'Courses I want to see' }).getByRole('checkbox', { name: 'Chinese (HSK)' }).check();
  await page.goto('/courses');
  await expect(areas(page).getByRole('link', { name: /Chinese \(HSK\)/u })).toBeVisible();
});

test('a course in a hidden extra, opened by its link, offers to show it', async ({ page }) => {
  await page.goto('/courses/hsk-1');
  await answerWelcome(page, { age: '20' });
  await chooseExtras(page, []);

  const banner = page.getByRole('status').filter({ hasText: 'This course is hidden from your course list.' });
  await expect(banner).toBeVisible();
  await banner.getByRole('button', { name: 'Show these courses' }).click();
  await expect(banner).toBeHidden();
  await page.goto('/courses');
  await expect(areas(page).getByRole('link', { name: /Chinese \(HSK\)/u })).toBeVisible();
});

test('with no extras, Courses opens on the learner’s level and Certifications leaves the rail', async ({ page }) => {
  await page.goto('/');
  await answerWelcome(page, { age: '20' });
  await page.getByRole('button', { name: 'Skip' }).click();

  await rail(page).getByRole('link', { name: 'Courses' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Courses' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Subjects' })).toBeVisible();
  await expect(areas(page)).toHaveCount(0);
  await expect(rail(page).getByRole('link', { name: 'Certifications' })).toHaveCount(0);
});
