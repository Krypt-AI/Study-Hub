/** A subject's past papers are grouped by kind, and each one can be sat and marked. */
import { expect, test } from './fixtures';

test('past papers are grouped into tests and finals, and a paper is sat and marked', async ({ page }) => {
  await page.goto('/courses/cmpd103');
  const papers = page.getByRole('region', { name: 'Past papers' });
  const tests = papers.getByRole('region', { name: 'Tests' });
  await expect(tests.getByText('Test 2 · Semester 2 2025/2026')).toBeVisible();
  await expect(papers.getByRole('region', { name: 'Final exams' }).getByText('Final exam · Semester 2 2017/2018')).toBeVisible();

  await tests.getByRole('link', { name: 'Try this paper' }).nth(1).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Test 2 · Semester 2 2025/2026' })).toBeVisible();
  await page.getByRole('button', { name: 'Start section 1' }).click();

  const answers = page.getByRole('region', { name: 'Answer sheet' }).getByRole('listitem');
  const fill = async (index: number, values: string[]) => {
    for (const [gap, value] of values.entries()) await answers.nth(index).getByRole('textbox').nth(gap).fill(value);
  };
  await fill(0, ['1.75']);
  await fill(1, ['3.782']);
  await fill(2, ['133', '7.3']);
  // Probabilities typed as fractions are marked like decimals.
  await fill(3, ['1/10', '2/5']);
  await fill(4, ['120']);
  await fill(5, ['1.5', '0.75', '0.866']);
  await page.getByRole('button', { name: 'Finish exam' }).first().click();

  const score = page.getByRole('region', { name: 'Score' });
  await expect(score.getByText(/^6\s*\/\s*6$/u).first()).toBeVisible();
  await expect(score.getByText('Saved to your progress')).toBeVisible();
});
