---
{
  "id": "fs-09-auth-security-testing.l03",
  "title": "Testing strategy",
  "summary": "Unit, integration and end-to-end tests, what to test and how to keep a suite fast and trustworthy.",
  "objectives": [
    "Distinguish unit, integration and end-to-end tests",
    "Write a clear test with arrange, act, assert",
    "Decide what is worth testing"
  ],
  "estimatedMinutes": 40,
  "topics": [
    "fs-09-auth-security-testing.testing"
  ],
  "resources": [
    {
      "title": "Vitest",
      "url": "https://vitest.dev/guide/",
      "free": true,
      "official": true
    },
    {
      "title": "Testing Library",
      "url": "https://testing-library.com/docs/",
      "free": true,
      "official": true
    },
    {
      "title": "Playwright",
      "url": "https://playwright.dev/docs/intro",
      "free": true,
      "official": true
    }
  ]
}
---

## The shape of a test suite

| Level | Tests | Speed | Confidence |
|---|---|---|---|
| **Unit** | one function or module, with no I/O | milliseconds | narrow but precise |
| **Integration** | several parts together: API route + database, component + hooks | fast | the main value |
| **End-to-end** | the whole app in a real browser | slow | closest to a user |

Favour many unit and integration tests and a **few** end-to-end tests of the critical journeys (sign up, pay, publish).

## A good test

```ts
import { describe, expect, it } from "vitest";
import { applyDiscount } from "./pricing";

describe("applyDiscount", () => {
  it("takes the percentage off the price", () => {
    // arrange
    const price = 200;
    // act
    const result = applyDiscount(price, 25);
    // assert
    expect(result).toBe(150);
  });

  it("rejects a discount above 100%", () => {
    expect(() => applyDiscount(200, 120)).toThrow();
  });
});
```

- **Arrange, act, assert**; one behaviour per test; the name states the behaviour.
- Test **behaviour, not implementation**: renaming an internal variable should not break a test.
- Tests must be **independent** and deterministic: no shared state, no real clock or network (fake them).

## Testing UI and APIs

Test components the way a user uses them: find by role and label, click, read the result (Testing Library). Test an API by sending HTTP requests to the app against a **test database** that is reset between tests.

## What to test

Business rules, boundaries (0, empty, maximum), error paths and every bug you fix (write the failing test first). Do not chase 100% coverage; coverage shows what was **not** tested, not that the tested code is correct.

## Run it automatically

Run tests, type check and lint in CI on every pull request, so the main branch is always releasable.
