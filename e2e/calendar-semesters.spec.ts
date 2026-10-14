/** Class types, extra classes and semesters the learner adds. */
import { addClass, addImportantDate, todayWeekday, weekColumn } from './calendarSteps';
import { todayKey } from './dates';
import { expect, test } from './fixtures';

test('a weekly lab is shown as a lab', async ({ page }) => {
  await page.goto('/calendar');
  await addClass(page, { name: 'Networks lab', type: 'Lab', weekday: todayWeekday() });
  await expect(weekColumn(page, todayWeekday()).getByText(/· Lab$/u)).toBeVisible();
  await expect(weekColumn(page, todayWeekday()).getByText('Networks lab')).toBeVisible();
});

test('an extra class appears on its day only, and on Today', async ({ page }) => {
  await page.goto('/calendar');
  await addImportantDate(page, { kind: 'Extra or make-up class', subject: 'CMPD363 Object-Oriented Programming', day: todayKey() });
  await expect(page.getByRole('region').filter({ hasText: 'CMPD363 Extra class' })).toHaveCount(1);
  await expect(weekColumn(page, todayWeekday()).getByText('CMPD363 Extra class')).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Important dates' }).getByText('CMPD363 Extra class')).toBeVisible();
});

test('a semester without materials keeps its own classes, and can be removed with them', async ({ page }) => {
  await page.goto('/calendar');
  await page.getByRole('button', { name: 'Add semester' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a semester' });
  await dialog.getByLabel('Name').fill('  Sem 1 2026 ');
  await dialog.getByRole('button', { name: 'Add semester' }).click();
  await expect(dialog.getByText('Sem 1 2026 is already in the list.')).toBeVisible();
  await dialog.getByLabel('Name').fill('Sem 3 2030');
  await dialog.getByRole('button', { name: 'Add semester' }).click();
  await expect(dialog).toBeHidden();

  await expect(page.getByLabel('Semester', { exact: true })).toHaveValue('Sem 3 2030');
  await expect(page.getByText('No materials for this semester yet', { exact: false })).toBeVisible();
  await addClass(page, { name: 'Robotics lecture', type: 'Lecture', weekday: todayWeekday() });
  await expect(weekColumn(page, todayWeekday()).getByText('Robotics lecture')).toBeVisible();

  // The class belongs to that semester only.
  await page.getByLabel('Semester', { exact: true }).selectOption('Sem 1 2026');
  await expect(page.getByText('Robotics lecture')).toHaveCount(0);

  // Semesters from the catalog cannot be removed; one the learner added can.
  await expect(page.getByRole('button', { name: 'Remove semester' })).toHaveCount(0);
  await page.getByLabel('Semester', { exact: true }).selectOption('Sem 3 2030');
  await page.getByRole('button', { name: 'Remove semester' }).click();
  await expect(page.getByText('Remove Sem 3 2030 with its 1 class and 0 dates?')).toBeVisible();
  await page.getByRole('group', { name: /Remove Sem 3 2030/u }).getByRole('button', { name: 'Remove semester' }).click();
  await expect(page.getByLabel('Semester', { exact: true }).locator('option', { hasText: 'Sem 3 2030' })).toHaveCount(0);

  // It is also gone from the University area of the catalog.
  await page.goto('/courses');
  await expect(page.getByRole('combobox', { name: 'Semester' }).locator('option', { hasText: 'Sem 3 2030' })).toHaveCount(0);
});
