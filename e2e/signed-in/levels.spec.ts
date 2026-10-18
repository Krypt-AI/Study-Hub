/** Guests see their own level only, with a note on where the other courses are; the calendar works at every level. */
import type { Page } from '@playwright/test';
import { addClass, ensureSemester, todayWeekday, weekColumn } from '../calendarSteps';
import { expect, test } from '../fixtures';
import { answerWelcome } from '../welcomeSteps';
import { asGuest, asSignedIn, type StubAccount } from './supabaseStub';

test.use({ storageState: { cookies: [], origins: [] } });

const signInNote = (page: Page) => page.getByRole('main').getByText('to add Chinese, Japanese, roadmaps and certifications.');

for (const { age, year } of [
  { age: '9', year: 'Standard 3' },
  { age: '14', year: 'Form 2' },
]) {
  test(`a guest at school sees ${year} first, the sign-in note, and a working calendar`, async ({ page }) => {
    await asGuest(page);
    await page.goto('/courses');
    await answerWelcome(page, { age });

    await expect(page.getByRole('heading', { level: 1, name: 'Courses' })).toBeVisible();
    const ownYear = page.getByRole('region', { name: `${year}: your year` });
    await expect(ownYear.getByText(`Courses for ${year} are not ready yet`)).toBeVisible();
    await expect(page.getByRole('region', { name: 'Subjects' })).toHaveCount(0);
    await expect(signInNote(page)).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Certifications' })).toHaveCount(0);

    await page.goto('/calendar');
    await ensureSemester(page);
    await addClass(page, { name: 'Sains', type: 'Lecture', weekday: todayWeekday() });
    await expect(weekColumn(page, todayWeekday()).getByText('Sains')).toBeVisible();
  });
}

test('a university guest sees their subjects and the sign-in note, is not asked about extras, and has a streak page', async ({ page }) => {
  await asGuest(page);
  await page.goto('/courses');
  await answerWelcome(page, { age: '20' });
  await expect(page.getByRole('region', { name: 'Subjects' })).toBeVisible();
  await expect(signInNote(page)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What do you want to study?' })).toHaveCount(0);

  await page.goto('/streak');
  await expect(page.getByRole('table', { name: 'Study on each day of the last 12 weeks' })).toBeVisible();
});

test('a signed-in learner is asked once what to study, with extras they already used ticked', async ({ page }) => {
  const at = '2026-10-01T00:00:00.000Z';
  const progress = { lessonId: 'hsk-1.l01', courseId: 'hsk-1', status: 'in-progress', answeredQuestionIds: [], correctQuestionIds: [], lastBlockIndex: 0, startedAt: at, updatedAt: at };
  const account: StubAccount = {
    id: '00000000-0000-4000-8000-0000000d1a7a',
    name: 'Dina Lee',
    email: 'dina@example.com',
    rows: { settings: [{ profile: { age: 20, level: 'university' } }], lesson_progress: [progress] },
  };
  await asSignedIn(page, account);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'What do you want to study?' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'University' })).toBeDisabled();
  await expect(page.getByRole('checkbox', { name: 'Chinese (HSK)' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Japanese (JLPT)' })).not.toBeChecked();
});
