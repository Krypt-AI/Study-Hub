/** Guests keep their data on the device; signing out or switching accounts leaves nothing of the previous account. */
import { addClass, addImportantDate, openImportantDates, todayWeekday, weekColumn } from '../calendarSteps';
import { addDaysTo, todayKey } from '../dates';
import { expect, test } from '../fixtures';
import { asGuest, asSignedIn, localStorageKeys, signInAs, type StubAccount } from './supabaseStub';

const dateRecord = (id: string, title: string) => ({ id, title, kind: 'test', date: addDaysTo(todayKey(), 5), createdAt: 'a', updatedAt: 'a' });

const ALICE: StubAccount = { id: '00000000-0000-4000-8000-00000000a11c', name: 'Alice Tan', email: 'alice@example.com', rows: { important_dates: [dateRecord('a1', 'Alice’s test')] } };
const BOB: StubAccount = { id: '00000000-0000-4000-8000-0000000000b0', name: 'Bob Lim', email: 'bob@example.com', rows: { important_dates: [dateRecord('b1', 'Bob’s test')] } };

test('a guest’s class and important date survive a reload', async ({ page }) => {
  await asGuest(page);
  await page.goto('/calendar');
  await addClass(page, { name: 'Web lab', type: 'Lab', weekday: todayWeekday() });
  await addImportantDate(page, { kind: 'Quiz', subject: 'CMPD203 Web Programming', day: addDaysTo(todayKey(), 4) });
  await page.reload();
  await expect(weekColumn(page, todayWeekday()).getByText('Web lab')).toBeVisible();
  await page.getByRole('tab', { name: /Important dates/u }).click();
  await expect(page.getByRole('button', { name: /CMPD203 Quiz/u })).toBeVisible();
});

test('signing out, then in to another account, shows nothing of the first account', async ({ page }) => {
  await asSignedIn(page, ALICE, [BOB]);
  await openImportantDates(page);
  await expect(page.getByRole('button', { name: /Alice’s test/u })).toBeVisible();

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();

  // As a guest: the account's date is gone from the page, and its session from the browser.
  await openImportantDates(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Calendar' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Alice’s test/u })).toHaveCount(0);
  expect((await localStorageKeys(page)).filter((key) => key.startsWith('sb-'))).toEqual([]);

  // Another account sees only its own data.
  await signInAs(page, BOB);
  await openImportantDates(page);
  await expect(page.getByRole('button', { name: /Bob’s test/u })).toBeVisible();
  await expect(page.getByRole('button', { name: /Alice’s test/u })).toHaveCount(0);
});

test('on first sign-in, the device’s progress can be brought into an empty account, once', async ({ page }) => {
  const carol: StubAccount = { id: '00000000-0000-4000-8000-0000000ca201', name: 'Carol Ng', email: 'carol@example.com' };
  await asGuest(page, [carol]);
  await openImportantDates(page);
  await addImportantDate(page, { kind: 'Test', subject: 'CMPD103 Statistics for Computer Science', day: addDaysTo(todayKey(), 6) });

  await signInAs(page, carol);
  const offer = page.getByRole('heading', { name: 'Bring this device’s progress into your account' });
  await expect(offer).toBeVisible();
  const copied = page.waitForRequest((request) => request.method() === 'POST' && request.url().includes('/rest/v1/important_dates') && (request.postData() ?? '').includes('CMPD103 Test'));
  await page.getByRole('button', { name: 'Bring it in' }).click();
  await copied;
  await expect(page.getByText('This device’s progress is now in your account.')).toBeVisible();
  await expect(offer).toBeHidden();

  // Answered once: not offered again.
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Calendar' })).toBeVisible();
  await expect(offer).toHaveCount(0);
});
