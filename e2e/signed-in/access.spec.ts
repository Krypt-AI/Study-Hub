import { expect, test } from '../fixtures';
import { asGuest, asSignedIn, STUB_ACCOUNT } from './supabaseStub';

/** A course outside the University area, so it needs an account. */
const SIGN_IN_ONLY_COURSE = { path: '/courses/ai-01-python', title: 'Python and Programming Fundamentals' };

test.describe('a guest', () => {
  // The browser logs the gate's refusal of the course file.
  test.use({ expectedConsoleErrors: [/status of 401 \(Unauthorized\)/u] });

  test('is asked to sign in when opening a sign-in-only course by its URL', async ({ page }) => {
    await asGuest(page);
    await page.goto(SIGN_IN_ONLY_COURSE.path);
    await expect(page.getByText('Sign in to open this course')).toBeVisible();
    await page.getByRole('main').getByRole('link', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fcourses%2Fai-01-python$/u);
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });
});

test('a signed-in learner opens the course and sees their account in Settings', async ({ page }) => {
  await asSignedIn(page);
  await page.goto(SIGN_IN_ONLY_COURSE.path);
  await expect(page.getByRole('heading', { level: 1, name: SIGN_IN_ONLY_COURSE.title })).toBeVisible();
  await expect(page.getByText('Sign in to open this course')).toHaveCount(0);

  await page.goto('/settings');
  const account = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Your account' }) });
  await expect(account.getByText(STUB_ACCOUNT.name)).toBeVisible();
  await expect(account.getByText(STUB_ACCOUNT.email)).toBeVisible();
  await expect(account.getByText('Google')).toBeVisible();
  await expect(account.getByRole('button', { name: 'Sign out' })).toBeVisible();
});
