/** Answering the Welcome page, as a first-time learner does. */
import type { Page } from '@playwright/test';

export interface WelcomeAnswers {
  age: string;
  name?: string;
  /** The level's label, when it should differ from what the age suggests. */
  level?: string;
  /** e.g. "Form 2", when it should differ from what the age suggests. */
  year?: string;
}

export async function answerWelcome(page: Page, answers: WelcomeAnswers, options: { timeout?: number } = {}): Promise<void> {
  await page.getByRole('heading', { level: 1, name: 'Welcome to Study Hub' }).waitFor(options);
  if (answers.name) await page.getByLabel('What should we call you? (you can skip this)').fill(answers.name);
  await page.getByLabel('How old are you?').fill(answers.age);
  if (answers.level) await page.getByRole('radio', { name: new RegExp(`^${answers.level}`, 'u') }).check();
  if (answers.year) await page.getByLabel('Which year are you in?').selectOption({ label: answers.year });
  await page.getByRole('button', { name: 'Start' }).click();
}

/** The extras' names on "What do you want to study?" and in Settings. */
export const EXTRAS = ['Chinese (HSK)', 'Japanese (JLPT)', 'Roadmaps', 'Certifications'] as const;

/** Answers "What do you want to study?", ticking exactly the given extras. */
export async function chooseExtras(page: Page, extras: readonly (typeof EXTRAS)[number][], options: { timeout?: number } = {}): Promise<void> {
  await page.getByRole('heading', { level: 1, name: 'What do you want to study?' }).waitFor(options);
  for (const extra of EXTRAS) await page.getByRole('checkbox', { name: extra }).setChecked(extras.includes(extra));
  await page.getByRole('button', { name: 'Continue' }).click();
}
