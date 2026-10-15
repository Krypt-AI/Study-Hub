---
{
  "id": "fs-07-node-api.l03",
  "title": "Configuration, errors and structure",
  "summary": "Environment configuration, centralised error handling, logging and a layout that keeps a backend testable.",
  "objectives": [
    "Load configuration from the environment",
    "Handle async errors in one place",
    "Structure a backend into routes, services and data access"
  ],
  "estimatedMinutes": 35,
  "topics": [
    "fs-07-node-api.middleware-and-structure"
  ],
  "resources": [
    {
      "title": "The Twelve-Factor App",
      "url": "https://12factor.net/",
      "free": true,
      "official": true
    },
    {
      "title": "Express error handling",
      "url": "https://expressjs.com/en/guide/error-handling.html",
      "free": true,
      "official": true
    }
  ]
}
---

## Configuration

Read configuration once at start-up, validate it and **fail fast** when something is missing:

```ts
import { z } from "zod";

const Env = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});
export const env = Env.parse(process.env);
```

Secrets come from the environment or a secrets manager, never from the repository. Use different values for development, test and production.

## Errors in one place

```ts
class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

app.get("/api/notes/:id", async (req, res) => {
  const note = await notes.find(req.params.id);
  if (!note) throw new HttpError(404, "Note not found");
  res.json(note);
});

app.use((err, req, res, next) => {
  const status = err instanceof HttpError ? err.status : 500;
  if (status === 500) logger.error(err);
  res.status(status).json({ error: { message: status === 500 ? "Internal error" : err.message } });
});
```

(Express 5 forwards rejected promises to the error handler; in Express 4 wrap async handlers.)

## Logging

Write **structured** logs (JSON) with a level, a request id and no secrets or personal data. Log at the edge (one line per request: method, path, status, time) and for failures.

## Layers

```
src/
  routes/     HTTP only: parse, call a service, send
  services/   business rules, no req/res
  data/       database access
  config.ts   validated environment
```

Dependencies point inward: routes know services, services know data, never the reverse. This is what lets you test the rules without starting a server.
