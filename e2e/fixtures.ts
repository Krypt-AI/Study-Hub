/** A page fixture that fails the test on any uncaught error or console error. */
import { expect, test as base } from '@playwright/test';

export const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(`page error: ${error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console error: ${message.text()}`);
      });
      await use(errors);
      expect(errors, 'the page logged errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
