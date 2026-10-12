/** The optional calendar: a weekly class and an exam date are kept, and the exam shows on Today. */
import { expect, test } from './fixtures';
import { addDaysTo, todayKey } from './dates';

test('a timetable class and an important date are saved and shown', async ({ page }) => {
  await page.goto('/calendar');
  await expect(page.getByRole('heading', { level: 1, name: 'Calendar' })).toBeVisible();

  // A weekly class, linked to a University subject.
  await page.getByRole('button', { name: 'Add class' }).click();
  const classDialog = page.getByRole('dialog', { name: 'Add a class' });
  await classDialog.getByLabel('Subject').selectOption({ label: 'CMPD333 Cyber Security Essentials' });
  await classDialog.getByLabel('Day').selectOption('Monday');
  await classDialog.getByLabel('Starts').fill('10:00');
  await classDialog.getByLabel('Ends').fill('12:00');
  await classDialog.getByLabel('Room').fill('BW-2-L03');
  await classDialog.getByRole('button', { name: 'Add class' }).click();
  await expect(classDialog).toBeHidden();
  await expect(page.getByRole('region', { name: /^Monday/u }).getByText('CMPD333 Cyber Security Essentials')).toBeVisible();

  // A midterm in three days.
  const examDay = addDaysTo(todayKey(), 3);
  await page.getByRole('button', { name: 'Add important date' }).click();
  const dateDialog = page.getByRole('dialog', { name: 'Add an important date' });
  await dateDialog.getByLabel('What').selectOption('Midterm');
  await dateDialog.getByLabel('Subject').selectOption({ label: 'CMPD333 Cyber Security Essentials' });
  await dateDialog.getByLabel('Day').fill(examDay);
  await dateDialog.getByRole('button', { name: 'Add date' }).click();
  await expect(dateDialog).toBeHidden();

  await page.reload();
  await page.getByRole('tab', { name: /Important dates/u }).click();
  await expect(page.getByText('in 3 days')).toBeVisible();
  await expect(page.getByRole('button', { name: /CMPD333 Midterm/u })).toBeVisible();

  await page.goto('/');
  const comingUp = page.getByRole('region', { name: 'Important dates' });
  await expect(comingUp.getByText('CMPD333 Midterm')).toBeVisible();
  await expect(comingUp.getByText('in 3 days')).toBeVisible();
});
