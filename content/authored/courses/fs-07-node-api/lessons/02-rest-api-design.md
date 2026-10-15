---
{
  "id": "fs-07-node-api.l02",
  "title": "Designing REST APIs",
  "summary": "Resources, methods, status codes, validation, pagination and error shapes that make an API predictable.",
  "objectives": [
    "Model data as resources with consistent URLs",
    "Choose methods and status codes correctly",
    "Validate input and return consistent errors"
  ],
  "estimatedMinutes": 45,
  "topics": [
    "fs-07-node-api.rest-api-design"
  ],
  "resources": [
    {
      "title": "HTTP semantics (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Methods",
      "free": true,
      "official": true
    },
    {
      "title": "Microsoft REST API guidelines",
      "url": "https://github.com/microsoft/api-guidelines",
      "free": true,
      "official": true
    }
  ]
}
---

## Resources and URLs

Name **things** (nouns, plural), and use the HTTP method as the verb:

| Request | Meaning | Success |
|---|---|---|
| `GET /api/notes` | list notes | `200` |
| `POST /api/notes` | create a note | `201` + `Location` |
| `GET /api/notes/42` | read one | `200` |
| `PATCH /api/notes/42` | change some fields | `200` |
| `PUT /api/notes/42` | replace entirely | `200` |
| `DELETE /api/notes/42` | remove | `204` |

Nested ownership reads naturally: `GET /api/courses/7/lessons`. Avoid verbs in URLs (`/getNotes`).

## Status codes that matter

`200` OK · `201` Created · `204` No Content · `400` invalid input · `401` not authenticated · `403` not allowed · `404` not found · `409` conflict (duplicate) · `422` validation failed · `429` too many requests · `500` server error.

## Validation and errors

Validate **every** request body, query and parameter on the server, and answer in one shape:

```json
{ "error": { "code": "validation_failed", "message": "Title is required", "fields": { "title": "Required" } } }
```

Never leak stack traces or database errors to clients; log them server-side instead.

## Pagination, filtering, sorting

Large lists must be paged: `GET /api/notes?limit=20&cursor=abc` or `?page=2&pageSize=20`, with `?sort=-createdAt&status=open` for ordering and filtering. Return `total` or a `nextCursor` so clients know when to stop.

## Idempotency and safety

`GET` is safe (no changes). `PUT` and `DELETE` are **idempotent**: repeating them leaves the same result. `POST` is not, so a retry may create a duplicate unless you add an idempotency key.

## Document it

An OpenAPI description gives you interactive docs, generated clients and contract tests from one file.
