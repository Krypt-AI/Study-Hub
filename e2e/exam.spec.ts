/** A mock exam from cover page to results, section by section. */
import { expect, test } from './fixtures';

test('a mock exam is sat section by section and marked at the end', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/courses/jlpt-n5/assessments/jlpt-n5.mock');
  await page.getByRole('checkbox', { name: /Time each section/u }).uncheck();
  await page.getByRole('button', { name: 'Start section 1' }).click();

  // Section 1: the booklet beside the answer sheet; mark question 1 (answer 2 is correct).
  await expect(page.getByRole('region', { name: 'Question booklet' }).getByRole('img').first()).toBeVisible();
  const sheet = page.getByRole('region', { name: 'Answer sheet' });
  await sheet.getByRole('radiogroup', { name: 'Question 1' }).first().getByRole('radio', { name: 'Answer 2' }).click();
  await expect(page.getByText('1 / 33 marked')).toBeVisible();

  // Finish each section; unanswered questions ask for confirmation.
  for (const finish of ['Finish section', 'Finish section', 'Finish exam']) {
    await page.getByRole('button', { name: finish }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: finish }).click();
  }

  await expect(page.getByRole('heading', { level: 1, name: 'JLPT N5 mock exam' })).toBeVisible();
  await expect(page.getByText('Results', { exact: true })).toBeVisible();
  await expect(page.getByText(/^1\s*\/\s*89$/u)).toBeVisible();
  await expect(page.getByText('Saved to your progress')).toBeVisible();
});

test('the N2 mock exam has one language section and one listening section', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/courses/jlpt-n2/assessments/jlpt-n2.mock');
  await page.getByRole('checkbox', { name: /Time each section/u }).uncheck();
  await page.getByRole('button', { name: 'Start section 1' }).click();

  // Question 1 of 問題1 (文字・語彙): answer 2 is correct.
  const sheet = page.getByRole('region', { name: 'Answer sheet' });
  await sheet.getByRole('radiogroup', { name: 'Question 1' }).first().getByRole('radio', { name: 'Answer 2' }).click();
  await expect(page.getByText('1 / 75 marked')).toBeVisible();

  for (const finish of ['Finish section', 'Finish exam']) {
    await page.getByRole('button', { name: finish }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: finish }).click();
  }

  await expect(page.getByRole('heading', { level: 1, name: 'JLPT N2 mock exam' })).toBeVisible();
  await expect(page.getByText(/^1\s*\/\s*106$/u)).toBeVisible();
});

test('an unfinished sitting survives a reload and can be resumed', async ({ page }) => {
  await page.goto('/courses/jlpt-n5/assessments/jlpt-n5.mock');
  await page.getByRole('button', { name: 'Start section 1' }).click();
  const sheet = page.getByRole('region', { name: 'Answer sheet' });
  await sheet.getByRole('radiogroup', { name: 'Question 1' }).first().getByRole('radio', { name: 'Answer 2' }).click();
  await expect(page.getByText('1 / 33 marked')).toBeVisible();

  await page.reload();
  await expect(page.getByText(/unfinished sitting: section 1 of 3, 1 answer marked/u)).toBeVisible();
  await page.getByRole('button', { name: 'Resume section 1' }).click();
  await expect(page.getByText('1 / 33 marked')).toBeVisible();
  await expect(sheet.getByRole('radiogroup', { name: 'Question 1' }).first().getByRole('radio', { name: 'Answer 2' })).toBeChecked();

  // Starting again discards the sitting and shows the normal cover page.
  await page.reload();
  await page.getByRole('button', { name: 'Start again' }).click();
  await expect(page.getByRole('button', { name: 'Start section 1' })).toBeVisible();
});
