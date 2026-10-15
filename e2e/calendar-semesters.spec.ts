/** Class types, extra classes and semesters the learner adds. */
import { addClass, addImportantDate, ensureSemester, todayWeekday, weekColumn } from './calendarSteps';
import { addDaysTo, todayKey } from './dates';
import { expect, test } from './fixtures';

test('a weekly lab is shown as a lab', async ({ page }) => {
  await page.goto('/calendar');
  await ensureSemester(page);
  await addClass(page, { name: 'Networks lab', type: 'Lab', weekday: todayWeekday() });
  await expect(weekColumn(page, todayWeekday()).getByText(/· Lab$/u)).toBeVisible();
  await expect(weekColumn(page, todayWeekday()).getByText('Networks lab')).toBeVisible();
});

test('an extra class appears on its day only, and on Today', async ({ page }) => {
  await page.goto('/calendar');
  await ensureSemester(page);
  await addImportantDate(page, { kind: 'Extra or make-up class', subject: 'CMPD363 Object-Oriented Programming', day: todayKey() });
  await expect(page.getByRole('region').filter({ hasText: 'CMPD363 Extra class' })).toHaveCount(1);
  await expect(weekColumn(page, todayWeekday()).getByText('CMPD363 Extra class')).toBeVisible();

  // On Today, under today's classes, with a link to its subject.
  await page.goto('/');
  const today = page.getByRole('region', { name: 'Today', exact: true });
  await expect(today.getByText('CMPD363 Extra class')).toBeVisible();
  await today.getByRole('link', { name: 'Open Object-Oriented Programming' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Object-Oriented Programming' })).toBeVisible();
});

test('a class linked to a JLPT course shows on Today with a link to it', async ({ page }) => {
  await page.goto('/calendar');
  await ensureSemester(page);
  await page.getByRole('button', { name: 'Add class' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a class' });
  await dialog.getByLabel('Subject').selectOption({ label: 'JLPT N4' });
  await dialog.getByLabel('Name').fill('Japanese class');
  await dialog.getByLabel('Day').selectOption({ label: todayWeekday() });
  await dialog.getByRole('button', { name: 'Add class' }).click();

  await page.goto('/');
  const today = page.getByRole('region', { name: 'Today', exact: true });
  await expect(today.getByText('Japanese class')).toBeVisible();
  await expect(today.getByRole('link', { name: 'Open JLPT N4' })).toBeVisible();
});

test('a new learner has no semester; added semesters keep their own classes and can be removed with them', async ({ page }) => {
  await page.goto('/calendar');
  await expect(page.getByText('Add your semester first')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add class' })).toHaveCount(0);

  await ensureSemester(page, 'Sem 1 2026');
  await page.getByRole('button', { name: 'Add semester' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a semester' });
  await dialog.getByLabel('Name').fill('  Sem 1 2026 ');
  await dialog.getByRole('button', { name: 'Add semester' }).click();
  await expect(dialog.getByText('Sem 1 2026 is already in the list.')).toBeVisible();
  await dialog.getByLabel('Name').fill('Sem 3 2030');
  await dialog.getByRole('button', { name: 'Add semester' }).click();
  await expect(dialog).toBeHidden();

  await expect(page.getByRole('combobox', { name: 'Semester' })).toHaveValue('Sem 3 2030');
  await expect(page.getByText('No subjects chosen yet', { exact: false })).toBeVisible();
  await addClass(page, { name: 'Robotics lecture', type: 'Lecture', weekday: todayWeekday() });
  await expect(weekColumn(page, todayWeekday()).getByText('Robotics lecture')).toBeVisible();

  // The class belongs to that semester only.
  await page.getByRole('combobox', { name: 'Semester' }).selectOption('Sem 1 2026');
  await expect(page.getByText('Robotics lecture')).toHaveCount(0);

  await page.getByRole('combobox', { name: 'Semester' }).selectOption('Sem 3 2030');
  await page.getByRole('button', { name: 'Remove semester' }).click();
  await expect(page.getByText('Remove Sem 3 2030 with its 1 class and 0 dates?')).toBeVisible();
  await page.getByRole('group', { name: /Remove Sem 3 2030/u }).getByRole('button', { name: 'Remove semester' }).click();
  await expect(page.getByRole('combobox', { name: 'Semester' }).locator('option', { hasText: 'Sem 3 2030' })).toHaveCount(0);

  // It is also gone from the University area of the catalog.
  await page.goto('/courses?area=university');
  await expect(page.getByRole('combobox', { name: 'Semester' }).locator('option', { hasText: 'Sem 3 2030' })).toHaveCount(0);
});

test('a holiday week shows on each of its days, before the other dates of that day', async ({ page }) => {
  await page.goto('/calendar');
  await ensureSemester(page);
  await addImportantDate(page, { kind: 'Holiday or break', day: todayKey(), lastDay: addDaysTo(todayKey(), 4) });
  await addImportantDate(page, { kind: 'Quiz', subject: 'CMPD103 Statistics for Computer Science', day: todayKey() });

  // The week view lists the holiday first on today, and it is still there two days later.
  const today = weekColumn(page, todayWeekday());
  await expect(today.getByRole('button').first()).toContainText('Holiday');
  await expect(today.getByRole('button').nth(1)).toContainText('CMPD103 Quiz');

  // The month cell features the holiday; opening the day shows both.
  await page.getByRole('tab', { name: 'Month' }).click();
  const cell = page.getByRole('gridcell', { name: /2 important dates/u }).first();
  await expect(cell).toContainText('Holiday');
  await expect(cell).toContainText('+1 more');
  await cell.click();
  const selected = page.getByRole('region', { name: 'Selected day' });
  await expect(selected.getByText('CMPD103 Quiz')).toBeVisible();
});
