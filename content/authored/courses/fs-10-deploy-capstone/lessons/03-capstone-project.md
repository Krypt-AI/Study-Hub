---
{
  "id": "fs-10-deploy-capstone.l03",
  "title": "Capstone: ship a full-stack application",
  "summary": "A project brief that combines every stage: plan, build, test, secure and deploy a real application.",
  "objectives": [
    "Turn requirements into a scoped plan",
    "Deliver a vertical slice early and iterate",
    "Check the finished project against a launch checklist"
  ],
  "estimatedMinutes": 60,
  "topics": [
    "fs-10-deploy-capstone.capstone-project"
  ],
  "resources": [
    {
      "title": "The Twelve-Factor App",
      "url": "https://12factor.net/",
      "free": true,
      "official": true
    },
    {
      "title": "Web.dev: Learn",
      "url": "https://web.dev/learn",
      "free": true,
      "official": true
    }
  ]
}
---

## The brief

Build **Study Planner**: a web application where a signed-in learner keeps a list of courses, adds study tasks with due dates, ticks them off and sees weekly progress.

### Requirements

1. **Accounts**: register, sign in, sign out; passwords hashed; sessions in `HttpOnly` cookies.
2. **Tasks**: create, read, update, delete tasks with `title`, `course`, `dueDate`, `done`.
3. **Ownership**: a user can only see and change their own tasks.
4. **Filtering**: by course and by done / not done; paginated.
5. **Progress**: a weekly summary of completed tasks.
6. **Accessible UI**: usable by keyboard, labelled form fields, responsive down to a phone.

### Suggested stack

React + TypeScript (Vite) · Node + Express (or a framework such as Next.js) · PostgreSQL or SQLite with an ORM · Zod for validation · Vitest and Playwright for tests · GitHub Actions · a free host.

## How to work

1. **Model the data** first: tables, keys and the relationships. Write the migration.
2. **Build one vertical slice** end to end (create a task: form → API → database → list) before adding features.
3. **Write the API contract** (routes, request and response shapes) and validate everything.
4. **Add auth**, then check *every* route for ownership.
5. **Test**: unit tests for rules, integration tests for the API, one end-to-end test for the main journey.
6. **Deploy early**, with CI, a preview per pull request and real environment variables.
7. **Write the README**: what it is, how to run it, the architecture in one diagram, and the trade-offs you chose.

## Launch checklist

- [ ] CI green: lint, types, tests, build
- [ ] No secrets in the repository or logs; `.env.example` provided
- [ ] Every route checks authentication **and** ownership
- [ ] Input validated on the server; errors consistent; no stack traces to clients
- [ ] HTTPS, secure cookies, security headers
- [ ] Lighthouse accessibility score reviewed; keyboard walk-through done
- [ ] Database indexed for the main queries; migrations applied from scratch
- [ ] Health check, error tracking and a restored backup
- [ ] README with screenshots and a live link
