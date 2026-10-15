---
{
  "id": "fs-07-node-api.l01",
  "title": "Node.js and Express",
  "summary": "Running JavaScript on the server, the module system, and building an HTTP server with routes and middleware.",
  "objectives": [
    "Explain what Node.js is and how it differs from the browser",
    "Build routes and middleware with Express",
    "Read request data and send responses"
  ],
  "estimatedMinutes": 45,
  "topics": [
    "fs-07-node-api.node-and-express"
  ],
  "resources": [
    {
      "title": "Node.js learn",
      "url": "https://nodejs.org/en/learn",
      "free": true,
      "official": true
    },
    {
      "title": "Express guide",
      "url": "https://expressjs.com/en/guide/routing.html",
      "free": true,
      "official": true
    }
  ]
}
---

## Node.js

**Node.js** runs JavaScript outside the browser using the same V8 engine. There is no DOM; instead you get the file system, networking, processes and environment variables. Its I/O is **non-blocking**: while one request waits for the database, the single thread serves another, which suits servers that mostly wait.

```js
import { readFile } from "node:fs/promises";
const text = await readFile("notes.txt", "utf8");
```

## An Express server

```js
import express from "express";

const app = express();
app.use(express.json());                 // parse JSON bodies

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/courses/:id", (req, res) => {
  const course = courses.find((c) => c.id === Number(req.params.id));
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.json(course);
});

app.listen(3000, () => console.log("Listening on :3000"));
```

- `req.params` come from the path, `req.query` from `?a=b`, `req.body` from the parsed body, `req.headers` from headers.
- Every handler must **send exactly one response**.

## Middleware

Middleware is a function `(req, res, next)` that runs before the route: it can log, authenticate, validate, or end the request.

```js
function requireAuth(req, res, next) {
  if (!req.headers.authorization) return res.status(401).json({ error: "Sign in" });
  next();
}
app.use("/api/private", requireAuth);
```

An **error-handling** middleware has four parameters `(err, req, res, next)` and is registered last, so one place turns exceptions into consistent responses.

## Project layout

Keep route files thin: *routes* parse the request and call a *service* that holds the business rules and talks to the database. The same service can then be tested without HTTP.
