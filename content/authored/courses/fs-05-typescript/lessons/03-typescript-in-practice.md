---
{
  "id": "fs-05-typescript.l03",
  "title": "TypeScript in a real project",
  "summary": "Configuring the compiler, typing API data safely, and the habits that make types pay off.",
  "objectives": [
    "Read the essential tsconfig options",
    "Validate external data instead of trusting a type",
    "Keep types close to the data they describe"
  ],
  "estimatedMinutes": 35,
  "topics": [
    "fs-05-typescript.typescript-in-practice"
  ],
  "resources": [
    {
      "title": "tsconfig reference",
      "url": "https://www.typescriptlang.org/tsconfig/",
      "free": true,
      "official": true
    },
    {
      "title": "Zod",
      "url": "https://zod.dev/",
      "free": true,
      "official": true
    }
  ]
}
---

## tsconfig essentials

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

`strict` enables `strictNullChecks` (no accidental `undefined`), `noImplicitAny` and more. `noUncheckedIndexedAccess` makes `array[i]` possibly `undefined`, which matches reality.

## Types do not exist at run time

A type annotation on JSON from a server is a **promise**, not a check:

```ts
const course = (await response.json()) as Course; // compiles, but may be wrong
```

Validate untrusted data (API responses, form input, local storage) at the boundary with a schema library such as **Zod** and derive the type from the schema, so the runtime check and the type can never drift apart:

```ts
import { z } from "zod";

const Course = z.object({ id: z.number(), title: z.string() });
type Course = z.infer<typeof Course>;

const course = Course.parse(await response.json()); // throws if the shape is wrong
```

## Habits

- Type the **boundaries** (function parameters, API results, component props); let inference do the rest.
- Prefer `readonly` and immutable updates.
- Avoid `enum` for plain unions of strings; `"a" | "b"` is simpler.
- Do not silence errors with `// @ts-ignore`; use `// @ts-expect-error` with a reason when you must.
- Let the type checker run in CI: `tsc --noEmit`.
