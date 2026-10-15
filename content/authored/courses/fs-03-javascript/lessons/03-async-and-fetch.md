---
{
  "id": "fs-03-javascript.l03",
  "title": "Asynchronous JavaScript and fetch",
  "summary": "The event loop, promises, async and await, error handling and talking to an API with fetch.",
  "objectives": [
    "Explain why JavaScript uses asynchronous code",
    "Use promises and async/await with try/catch",
    "Fetch JSON from an API and handle failure correctly"
  ],
  "estimatedMinutes": 50,
  "topics": [
    "fs-03-javascript.async-and-fetch"
  ],
  "resources": [
    {
      "title": "Asynchronous JavaScript (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Asynchronous_JavaScript",
      "free": true,
      "official": true
    },
    {
      "title": "Using fetch (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch",
      "free": true,
      "official": true
    }
  ]
}
---

## One thread, an event loop

JavaScript runs your code on **one thread**. Slow work (network, timers, files) is started and then handled later, so the page stays responsive. When the work finishes, its callback is queued and the **event loop** runs it once the current code is done.

```js
console.log("a");
setTimeout(() => console.log("b"), 0);
console.log("c");
// a, c, b  — the timer callback waits for the current code to finish
```

## Promises

A **promise** represents a value that will exist later: *pending*, then *fulfilled* with a value or *rejected* with an error.

```js
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
wait(100).then(() => console.log("done")).catch(console.error);
```

## async and await

```js
async function loadCourse(id) {
  const response = await fetch(`/api/courses/${id}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

try {
  const course = await loadCourse(7);
} catch (error) {
  showMessage(error.message);
}
```

- `await` pauses the **function**, not the page.
- An `async` function always returns a promise.
- `fetch` only rejects on network failure; a `404` or `500` still **resolves**, so check `response.ok`.

## In parallel

```js
const [courses, user] = await Promise.all([fetchJson("/api/courses"), fetchJson("/api/me")]);
```

`Promise.all` starts both requests at once and fails if either fails. Use `Promise.allSettled` when you want every result regardless.

## Sending data

```js
await fetch("/api/notes", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Review closures" }),
});
```
