/** Study plans per subject: only subjects you practise or review bring their work to Today; Resume is always the latest lesson. */
import { expect, test } from './fixtures';

test('a subject with a study plan shows on Today, and Settings lists its plan', async ({ page }) => {
  await page.goto('/courses/cmpd363');
  const plan = page.getByRole('group', { name: /Study plan/u });
  await expect(plan.getByRole('radio', { name: /Use the material/u })).toBeChecked();
  await plan.getByRole('radio', { name: /Practise and review/u }).check();
  await expect(plan.getByRole('radio', { name: /Practise and review/u })).toBeChecked();

  await page.goto('/');
  const startHere = page.getByRole('region', { name: 'Start here' });
  await expect(startHere.getByText('Object-Oriented Programming')).toBeVisible();
  await expect(startHere.getByText('HSK 1')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Your courses' }).getByRole('link', { name: '1 with a study plan' })).toBeVisible();

  await page.goto('/settings');
  const listed = page.getByRole('combobox', { name: 'Study plan for Object-Oriented Programming' });
  await expect(listed).toHaveValue('review');
  await listed.selectOption({ label: 'Use the material' });
  await expect(listed).toHaveValue('material');
  // With no subject planned, Start here offers the learner's own level again (their university subjects here).
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Start here' }).getByRole('listitem')).toHaveCount(5);
});

test('Practice lists only subjects with a study plan that includes practice', async ({ page }) => {
  await page.goto('/practice');
  await expect(page.getByText('No subject to practise yet')).toBeVisible();

  await page.goto('/courses/cmpd363');
  await page.getByRole('group', { name: /Study plan/u }).getByRole('radio', { name: /Practise weak topics/u }).check();
  await page.goto('/practice');
  await page.getByRole('navigation', { name: 'Subjects' }).getByRole('link', { name: /Object-Oriented Programming/u }).click();
  // Without reviews in the plan, the subject offers no due-review session.
  await expect(page.getByRole('link', { name: /Practise my weaknesses/u })).toBeVisible();
  await expect(page.getByRole('link', { name: /Due reviews/u })).toHaveCount(0);
});
