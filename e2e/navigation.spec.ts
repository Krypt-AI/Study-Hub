import { addSemester } from './calendarSteps';
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

test('courses open on their areas, and the UNITEN area asks for a semester, then its subjects', async ({ page }) => {
  await page.goto('/courses');
  const areas = page.getByRole('navigation', { name: 'Course areas' });
  await expect(areas.getByRole('link', { name: /Japanese \(JLPT\)/u })).toBeVisible();
  await expect(areas.getByRole('link', { name: /AI Engineering/u })).toBeVisible();
  await areas.getByRole('link', { name: /^UNITEN/u }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'UNITEN' })).toBeVisible();

  // No semester is preset: the learner adds their own, then chooses its subjects.
  await expect(page.getByText('Add your semester first')).toBeVisible();
  await addSemester(page, 'Sem 1 2026');
  await expect(page.getByRole('combobox', { name: 'Semester' })).toHaveValue('Sem 1 2026');
  await expect(page.getByText('No subjects chosen for Sem 1 2026 yet')).toBeVisible();
  await page.getByRole('checkbox', { name: /Cyber Security Essentials/u }).click();
  await expect(page.getByRole('region', { name: 'Subjects' }).getByRole('link', { name: 'Cyber Security Essentials' })).toBeVisible();
});

test('certifications open on their areas, with JLPT and HSK among them', async ({ page }) => {
  await page.goto('/certifications');
  const areas = page.getByRole('navigation', { name: 'Certification areas' });
  await areas.getByRole('link', { name: /Japanese \(JLPT\)/u }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Japanese (JLPT)' })).toBeVisible();
  await page.getByRole('link', { name: /Japanese-Language Proficiency Test N5/u }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Japanese-Language Proficiency Test N5' })).toBeVisible();

  await page.goto('/certifications');
  await page.getByRole('navigation', { name: 'Certification areas' }).getByRole('link', { name: /IT courses/u }).click();
  await expect(page.getByRole('link', { name: 'Databases and SQL' })).toBeVisible();
});

test('the playground joins the rail once a coding subject is chosen', async ({ page }) => {
  await page.goto('/');
  const rail = page.getByRole('navigation', { name: 'Main' }).first();
  await expect(rail.getByRole('link', { name: 'Today' })).toBeVisible();
  await expect(rail.getByRole('link', { name: 'Playground' })).toHaveCount(0);

  await page.goto('/courses/ai-01-python');
  await page.getByRole('group', { name: /Study plan/u }).getByRole('radio', { name: /Practise weak topics/u }).check();
  await expect(rail.getByRole('link', { name: 'Playground' })).toBeVisible();
});
