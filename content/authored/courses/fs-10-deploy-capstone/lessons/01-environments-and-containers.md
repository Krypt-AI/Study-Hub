---
{
  "id": "fs-10-deploy-capstone.l01",
  "title": "Environments, builds and containers",
  "summary": "From your laptop to production: build steps, environments, configuration and Docker.",
  "objectives": [
    "Explain build, test and runtime environments",
    "Write a Dockerfile for a Node application",
    "Keep configuration and secrets out of the image"
  ],
  "estimatedMinutes": 40,
  "topics": [
    "fs-10-deploy-capstone.environments-and-containers"
  ],
  "resources": [
    {
      "title": "Docker get started",
      "url": "https://docs.docker.com/get-started/",
      "free": true,
      "official": true
    },
    {
      "title": "Vite: building for production",
      "url": "https://vite.dev/guide/build",
      "free": true,
      "official": true
    }
  ]
}
---

## Environments

| Environment | Purpose | Data |
|---|---|---|
| **Development** | your machine | fake / seed data |
| **Test / CI** | automated checks | created per run |
| **Staging** | production-like rehearsal | anonymised copy or fake |
| **Production** | real users | real data |

They must differ **only** in configuration. Code that works because of something unique to your laptop does not work anywhere else.

## Build

A frontend build bundles, minifies and fingerprints your files (`dist/`); a TypeScript backend is compiled to JavaScript. The output is an **artifact**: build it once, test it, and deploy that same artifact to every environment.

## Containers

A **container** packages an application with its runtime and dependencies so it runs the same everywhere.

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

- Copy `package*.json` first so the dependency layer is **cached** until dependencies change.
- A **multi-stage** build leaves compilers and dev dependencies out of the final image.
- Run as a non-root user; keep a `.dockerignore` (`node_modules`, `.git`, `.env`).
- **Never bake secrets into an image**; pass them as environment variables at run time.

`docker compose` runs your app, database and cache together for local development with one command.

## Config and secrets

Twelve-factor rule: configuration comes from the environment. Use your host's secret store, rotate keys, and give each environment its own.
