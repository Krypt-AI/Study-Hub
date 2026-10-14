/** A page fixture that fails the test on any uncaught error or console error it did not expect. */
import { expect, test as base } from '@playwright/test';

export const test = base.extend<{ expectedConsoleErrors: RegExp[]; errors: string[] }>({
  /** Console errors a test causes on purpose, such as the browser's log line for a refused file. */
  expectedConsoleErrors: [[], { option: true }],
  errors: [
    async ({ page, expectedConsoleErrors }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(`page error: ${error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error' && !expectedConsoleErrors.some((pattern) => pattern.test(message.text()))) errors.push(`console error: ${message.text()}`);
      });
      await use(errors);
      expect(errors, 'the page logged errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
