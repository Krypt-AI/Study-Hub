---
{
  "id": "fs-05-typescript.l02",
  "title": "Narrowing, generics and utility types",
  "summary": "How the compiler refines types as code runs, how to write reusable typed code, and the built-in helpers.",
  "objectives": [
    "Narrow unions with typeof, in, equality and discriminants",
    "Write a generic function and a generic type",
    "Use Partial, Pick, Omit, Record and ReturnType"
  ],
  "estimatedMinutes": 50,
  "topics": [
    "fs-05-typescript.narrowing-and-generics"
  ],
  "resources": [
    {
      "title": "Narrowing",
      "url": "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
      "free": true,
      "official": true
    },
    {
      "title": "Generics",
      "url": "https://www.typescriptlang.org/docs/handbook/2/generics.html",
      "free": true,
      "official": true
    },
    {
      "title": "Utility types",
      "url": "https://www.typescriptlang.org/docs/handbook/utility-types.html",
      "free": true,
      "official": true
    }
  ]
}
---

## Narrowing

Inside a branch the compiler knows more:

```ts
function size(value: string | string[]): number {
  if (typeof value === "string") return value.length; // string here
  return value.length;                                 // string[] here
}
```

Other guards: `value != null`, `"id" in obj`, `Array.isArray(x)`, `x instanceof Date`.

## Discriminated unions

Give each variant a shared literal field and `switch` on it:

```ts
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function show(r: Result<number>) {
  if (r.ok) return r.value.toFixed(1);  // value exists here
  return r.error;                        // error exists here
}
```

This is the safest way to model "loading / success / failure" in an application.

## Generics

A generic is a type parameter: the type is decided by the caller.

```ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}
first([1, 2, 3]);      // number | undefined
first(["a", "b"]);     // string | undefined

interface Page<T> { items: T[]; total: number }
```

Constrain a parameter with `extends`: `function byId<T extends { id: number }>(list: T[], id: number)`.

## Utility types

```ts
interface User { id: number; name: string; email: string }

type Draft   = Partial<User>;               // all optional
type Public  = Pick<User, "id" | "name">;
type NoEmail = Omit<User, "email">;
type ById    = Record<number, User>;
type Fetcher = ReturnType<typeof fetchUser>;
```

## Escape hatches, used rarely

`value as Course` asserts a type without checking it; `value!` asserts non-null. Prefer narrowing or runtime validation; use assertions only when you know more than the compiler and say why.
