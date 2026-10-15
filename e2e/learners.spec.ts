/** Several learners on one device: each sees only their own data, and the chosen learner stays open. */
import { addImportantDate, openImportantDates } from './calendarSteps';
import { addDaysTo, todayKey } from './dates';
import { expect, test } from './fixtures';
import { answerWelcome, chooseExtras } from './welcomeSteps';

test('learners on one device keep their data apart', async ({ page }) => {
  await openImportantDates(page);
  await addImportantDate(page, { kind: 'Quiz', subject: 'CMPD363 Object-Oriented Programming', day: addDaysTo(todayKey(), 2) });
  await expect(page.getByRole('button', { name: /CMPD363 Quiz/u })).toBeVisible();

  // A sibling adds themselves and becomes the learner studying now.
  await page.goto('/');
  await page.getByRole('button', { name: /Switch profile/u }).click();
  await page.getByLabel('New profile’s name').fill('Adam');
  await page.getByRole('button', { name: 'Add profile' }).click();
  // A new learner answers the Welcome questions for themselves.
  await answerWelcome(page, { age: '20' });
  await chooseExtras(page, []);
  await expect(page.getByRole('button', { name: 'Adam · Switch profile' })).toBeVisible();

  await openImportantDates(page);
  await expect(page.getByRole('button', { name: /CMPD363 Quiz/u })).toHaveCount(0);

  // The chosen learner stays open after a reload.
  await page.reload();
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Adam · Switch profile' })).toBeVisible();

  // Back to the first learner: their quiz is still there.
  await page.getByRole('button', { name: /Switch profile/u }).click();
  await page.getByRole('dialog', { name: 'Who is studying?' }).getByRole('button', { name: 'Learner 1' }).click();
  await expect(page.getByRole('button', { name: 'Learner 1 · Switch profile' })).toBeVisible();
  await openImportantDates(page);
  await expect(page.getByRole('button', { name: /CMPD363 Quiz/u })).toBeVisible();
});

test('a duplicate learner name is refused with a message', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Switch profile/u }).click();
  await page.getByLabel('New profile’s name').fill('  learner 1 ');
  await page.getByRole('button', { name: 'Add profile' }).click();
  await expect(page.getByRole('alert')).toHaveText('There is already a profile called learner 1.');
});
