---
{
  "id": "fs-10-deploy-capstone.l02",
  "title": "CI/CD, hosting and monitoring",
  "summary": "Automating checks and releases, choosing where to run an application and knowing when it breaks.",
  "objectives": [
    "Design a CI pipeline that gates merges",
    "Compare hosting models",
    "Add logging, health checks and error monitoring"
  ],
  "estimatedMinutes": 40,
  "topics": [
    "fs-10-deploy-capstone.ci-cd-and-hosting"
  ],
  "resources": [
    {
      "title": "GitHub Actions",
      "url": "https://docs.github.com/en/actions",
      "free": true,
      "official": true
    },
    {
      "title": "Netlify docs",
      "url": "https://docs.netlify.com/",
      "free": true,
      "official": true
    }
  ]
}
---

## Continuous integration and delivery

**CI** runs automatically on every push or pull request. **CD** deploys a build that passed CI.

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

Protect `main`: require a green CI and a review before merging. A failing pipeline is a stop sign, not an annoyance.

## Release strategies

- **Preview deployments** per pull request let reviewers click the real change.
- **Rolling / blue-green**: new version starts beside the old, traffic switches, rollback is a switch back.
- **Feature flags**: ship code turned off, enable it gradually.
- **Database migrations** run before or with the release and must be backwards-compatible, so the old and new code both work during the switch.

## Where to host

| Model | Examples | Good for |
|---|---|---|
| Static / edge hosting | Netlify, Vercel, Cloudflare Pages | frontends, serverless functions |
| Platform as a service | Render, Fly.io, Railway | a server and a database with little ops |
| Containers / VMs | AWS ECS, Azure Container Apps, a VPS | control, existing infrastructure |
| Managed database | Neon, Supabase, RDS | do not run your own database server |

## Know when it breaks

1. **Health endpoint** (`GET /health`) for the platform to restart unhealthy instances.
2. **Structured logs** shipped to one place.
3. **Error tracking** (Sentry) with release versions and source maps.
4. **Uptime and latency** checks with an alert that reaches a person.
5. **Backups** you have actually restored at least once.
