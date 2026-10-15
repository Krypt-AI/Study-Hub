---
{
  "id": "fs-05-typescript.l01",
  "title": "Types, interfaces and unions",
  "summary": "Annotating values, describing object shapes, and modelling data with unions and literal types.",
  "objectives": [
    "Annotate variables, parameters and return types",
    "Describe objects with interfaces and type aliases",
    "Model alternatives with unions and literal types"
  ],
  "estimatedMinutes": 45,
  "topics": [
    "fs-05-typescript.types-basics"
  ],
  "resources": [
    {
      "title": "TypeScript handbook: everyday types",
      "url": "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html",
      "free": true,
      "official": true
    },
    {
      "title": "Object types",
      "url": "https://www.typescriptlang.org/docs/handbook/2/objects.html",
      "free": true,
      "official": true
    }
  ]
}
---

## What TypeScript adds

TypeScript is JavaScript plus a **static type system**. The compiler checks your code before it runs and then erases the types: the output is plain JavaScript. Types are documentation the machine verifies.

## Annotations and inference

```ts
let title: string = "Intro";
let count = 3;                 // inferred as number
const tags: string[] = ["ts", "web"];

function total(prices: number[], tax = 0.06): number {
  return prices.reduce((sum, p) => sum + p, 0) * (1 + tax);
}
```

Annotate **function parameters** and public return types; let inference handle local variables.

## Object shapes

```ts
interface Course {
  id: number;
  title: string;
  subtitle?: string;           // optional
  readonly createdAt: Date;    // cannot be reassigned
}

type Point = { x: number; y: number };
```

`interface` and `type` overlap; use `interface` for object shapes that may be extended and `type` for unions and computed types.

## Unions and literals

```ts
type Status = "idle" | "loading" | "error" | "done";
type Id = string | number;

function label(status: Status): string {
  switch (status) {
    case "idle": return "Not started";
    case "loading": return "Loading…";
    case "error": return "Failed";
    case "done": return "Ready";
  }
}
```

A union says a value is **one of** several types; literal types restrict a string to exact values, so a typo (`"loadng"`) is a compile error.

## Avoiding `any`

`any` turns checking off. Use `unknown` for values you have not checked yet; the compiler then forces you to narrow it before use. Turn on `"strict": true` in `tsconfig.json` from the first day.
