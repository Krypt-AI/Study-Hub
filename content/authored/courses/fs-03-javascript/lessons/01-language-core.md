---
{
  "id": "fs-03-javascript.l01",
  "title": "The language core",
  "summary": "Variables, types, functions, objects and arrays, and the array methods you will use every day.",
  "objectives": [
    "Declare variables with const and let and explain scope",
    "Use objects, arrays, destructuring and spread",
    "Transform data with map, filter and reduce"
  ],
  "estimatedMinutes": 50,
  "topics": [
    "fs-03-javascript.language-core"
  ],
  "resources": [
    {
      "title": "JavaScript guide (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
      "free": true,
      "official": true
    },
    {
      "title": "Array methods (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array",
      "free": true,
      "official": true
    }
  ]
}
---

## Variables and types

```js
const course = "JavaScript";   // cannot be reassigned
let attempts = 0;              // can be reassigned
attempts += 1;
```

Use `const` by default and `let` when you must reassign; never `var`. Primitive types: `string`, `number`, `boolean`, `null`, `undefined`, `bigint`, `symbol`. Everything else is an **object** (arrays and functions included). Compare with `===` (strict); `==` converts types and surprises.

`falsy` values: `false`, `0`, `""`, `null`, `undefined`, `NaN`. Everything else is truthy, including `[]` and `{}`.

## Functions

```js
function add(a, b) { return a + b; }
const double = (n) => n * 2;           // arrow function
const greet = (name = "friend") => `Hello, ${name}!`;
```

Functions are values: they can be stored, passed and returned. A **closure** is a function that remembers the variables of the scope where it was created.

## Objects and arrays

```js
const learner = { name: "Aisha", scores: [80, 92, 75] };
const { name, scores } = learner;          // destructuring
const [first, ...rest] = scores;           // array destructuring
const updated = { ...learner, name: "Aina" }; // spread: a copy with a change
const withNew = [...scores, 100];
```

## map, filter, reduce

```js
const nums = [1, 2, 3, 4, 5];
nums.map((n) => n * n);                // [1, 4, 9, 16, 25]
nums.filter((n) => n % 2 === 0);       // [2, 4]
nums.reduce((sum, n) => sum + n, 0);   // 15
nums.find((n) => n > 3);               // 4
nums.some((n) => n > 4);               // true
```

These return **new** values and do not mutate the array, which keeps code predictable. Optional chaining and nullish coalescing handle missing data: `user?.address?.city ?? "unknown"`.
