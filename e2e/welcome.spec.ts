/** The Welcome page: the first thing a new learner answers, and Settings › About you afterwards. */
import { expect, test } from './fixtures';
import { answerWelcome, chooseExtras } from './welcomeSteps';

test.use({ storageState: { cookies: [], origins: [] } });

test('a first visit asks the Welcome questions, suggesting the year from the age', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Welcome to Study Hub' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start' })).toBeDisabled();

  await page.getByLabel('How old are you?').fill('9');
  await expect(page.getByRole('radio', { name: /^Primary school/u })).toBeChecked();
  await expect(page.getByLabel('Which year are you in?')).toHaveValue('3');
  await page.getByLabel('How old are you?').fill('14');
  await expect(page.getByRole('radio', { name: /^Secondary school/u })).toBeChecked();
  await expect(page.getByLabel('Which year are you in?').locator('option:checked')).toHaveText('Form 2');

  await page.getByLabel('What should we call you? (you can skip this)').fill('Aina');
  await page.getByRole('button', { name: 'Start' }).click();
  await chooseExtras(page, []);
  await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Aina/u })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
});

test('a link opened first shows its page once the Welcome questions are answered', async ({ page }) => {
  await page.goto('/calendar');
  await answerWelcome(page, { age: '20' });
  await chooseExtras(page, []);
  await expect(page.getByRole('heading', { level: 1, name: 'Calendar' })).toBeVisible();
});

test('changing the school year in Settings asks first', async ({ page }) => {
  await page.goto('/settings');
  await answerWelcome(page, { age: '14' });
  await chooseExtras(page, []);
  const about = page.getByRole('region', { name: 'About you' });
  await about.getByLabel('Which year are you in?').selectOption({ label: 'Form 3' });
  await about.getByRole('button', { name: 'Save' }).click();

  const confirm = page.getByRole('dialog', { name: 'Change to Form 3?' });
  await confirm.getByRole('button', { name: 'Keep Form 2' }).click();
  await expect(confirm).toBeHidden();
  await about.getByRole('button', { name: 'Save' }).click();
  await confirm.getByRole('button', { name: 'Change' }).click();
  await page.reload();
  await expect(page.getByRole('region', { name: 'About you' }).getByLabel('Which year are you in?').locator('option:checked')).toHaveText('Form 3');
});

test('a learner added by mistake can switch back from the Welcome page', async ({ page }) => {
  await page.goto('/');
  await answerWelcome(page, { age: '20' });
  await chooseExtras(page, []);
  await page.getByRole('button', { name: /Switch learner/u }).click();
  await page.getByLabel('New learner’s name').fill('Adam');
  await page.getByRole('button', { name: 'Add learner' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Welcome to Study Hub' })).toBeVisible();
  await page.getByRole('button', { name: 'Adam · Switch learner' }).click();
  await page.getByRole('dialog', { name: 'Who is studying?' }).getByRole('button', { name: 'Learner 1' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
});
