import { expect, test } from './fixtures';

const PAGES: Array<[path: string, heading: string | RegExp]> = [
  ['/', 'Today'],
  ['/courses', 'Courses'],
  ['/courses/ai-01-python', 'Python and Programming Fundamentals'],
  ['/courses/it-sql', 'Databases and SQL'],
  ['/practice', 'Practice'],
  ['/practice/review', 'Due reviews'],
  ['/practice/quiz', 'Mixed quiz'],
  ['/calendar', 'Calendar'],
  ['/courses/jlpt-n5/assessments/jlpt-n5.mock', 'JLPT N5 mock exam'],
  ['/certifications', 'Certifications'],
  ['/certifications/comptia-security-plus', 'CompTIA Security+'],
  ['/roadmaps/ai-engineering', 'AI Engineering Roadmap'],
  ['/settings', 'Settings'],
];

for (const [path, heading] of PAGES) {
  test(`${path} renders`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  });
}

test('the playground opens with its empty state, and old notebook links reach the calendar', async ({ page }) => {
  await page.goto('/notebook');
  await expect(page.getByRole('heading', { level: 1, name: 'Calendar' })).toBeVisible();
  await page.goto('/playground');
  await expect(page.getByRole('heading', { name: 'Start a project' })).toBeVisible();
});

test('unknown routes show the not-found page', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
});

test('the University area opens on the current semester and can show all semesters', async ({ page }) => {
  await page.goto('/courses');
  const semester = page.getByRole('combobox', { name: 'Semester' });
  await expect(semester).toHaveValue('Sem 1 2026');
  await semester.selectOption('all');
  await expect(semester).toHaveValue('all');
});
