/** The core loop: lesson → typed answer → feedback → saved progress. */
import { expect, test } from './fixtures';

test('a typed answer is marked, explained and remembered', async ({ page }) => {
  await page.goto('/courses/ai-01-python/lessons/ai-01-python.l01');
  await expect(page.getByRole('heading', { level: 1, name: 'Values, types and variables' })).toBeVisible();

  // Question 1: a correct typed answer.
  const answer = page.getByRole('textbox', { name: 'Your answer' });
  await answer.fill('3');
  await answer.press('Enter');
  const feedback = page.getByRole('region', { name: 'Feedback' });
  await expect(feedback.getByRole('heading', { name: 'Correct' })).toBeVisible();

  // Question 2: a wrong answer shows the expected one.
  await page.getByRole('button', { name: 'Next question' }).first().click();
  await page.getByRole('textbox', { name: 'Your answer' }).fill('int');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(feedback.getByRole('heading', { name: 'Not quite' })).toBeVisible();
  // The expected answer is shown (the explanation mentions it too).
  await expect(feedback.getByRole('paragraph').filter({ hasText: /^float$/u })).toBeVisible();

  await page.getByRole('button', { name: 'Mark complete' }).click();
  await expect(page.getByText('Completed', { exact: true })).toBeVisible();

  // Everything survives a reload: progress on the answer strip and the completed lesson.
  await page.reload();
  const strip = page.getByRole('list', { name: 'Answer strip: choose a question' });
  await expect(strip.getByRole('button', { name: 'Question 1: correct' })).toBeVisible();
  await expect(strip.getByRole('button', { name: 'Question 2: incorrect' })).toBeVisible();
  await expect(page.getByText('Completed', { exact: true })).toBeVisible();

  // The answers feed Today and Practice.
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Python and Programming Fundamentals' }).or(page.getByText('Python and Programming Fundamentals').first())).toBeVisible();
  await page.goto('/practice');
  const mistakes = page.getByRole('link', { name: /Recent mistakes/u });
  await expect(mistakes).toContainText('1');
  await mistakes.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Recent mistakes' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Question 1/u })).toBeVisible();
});
