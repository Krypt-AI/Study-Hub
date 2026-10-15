---
{
  "id": "fs-04-git-and-tooling.l03",
  "title": "A professional workflow",
  "summary": "Formatting, linting, review habits and how to read errors and debug effectively.",
  "objectives": [
    "Use a formatter and linter to remove style debates",
    "Review changes with pull requests",
    "Debug methodically with the browser and editor tools"
  ],
  "estimatedMinutes": 30,
  "topics": [
    "fs-04-git-and-tooling.workflow-and-quality"
  ],
  "resources": [
    {
      "title": "Chrome DevTools",
      "url": "https://developer.chrome.com/docs/devtools",
      "free": true,
      "official": true
    },
    {
      "title": "Conventional Commits",
      "url": "https://www.conventionalcommits.org/",
      "free": true,
      "official": true
    }
  ]
}
---

## Automate the boring parts

- A **formatter** (Prettier) decides layout so reviews are about logic.
- A **linter** (ESLint) finds probable bugs: unused variables, missing awaits, unsafe patterns.
- A **type checker** (TypeScript) finds mismatched data before the code runs.
- Run all three in a **pre-commit hook** or in **CI**, so a broken change cannot be merged.

## Pull requests

A good pull request is small, has a description of *what and why*, links the issue, and shows how it was tested. Reviewers read for correctness, clarity and risk; authors reply to every comment. Small PRs get faster and better reviews than large ones.

## Debugging method

1. **Reproduce** the bug and write down the exact steps.
2. **Read the error**: the message, then the first stack frame in *your* code.
3. **Isolate**: make the smallest case that still fails; bisect by commenting out or by `git bisect`.
4. **Form a hypothesis** and test it with one change at a time.
5. **Fix the cause**, add a test that fails without the fix, then remove debug output.

## DevTools

- **Console** for errors and `console.log`/`console.table`.
- **Network** to see requests, status codes, payloads and timing.
- **Elements** to inspect the DOM and computed CSS.
- **Sources** to set breakpoints and step through code.
- **Lighthouse** for performance and accessibility checks.
