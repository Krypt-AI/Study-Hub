---
{
  "id": "fs-03-javascript.l02",
  "title": "The DOM and events",
  "summary": "How the browser exposes a page as a tree you can read and change, and how to respond to user actions.",
  "objectives": [
    "Select and modify elements through the DOM",
    "Handle events and use event delegation",
    "Keep state in data and render from it"
  ],
  "estimatedMinutes": 45,
  "topics": [
    "fs-03-javascript.dom-and-events"
  ],
  "resources": [
    {
      "title": "Introduction to the DOM (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction",
      "free": true,
      "official": true
    },
    {
      "title": "Event reference (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/Events",
      "free": true,
      "official": true
    }
  ]
}
---

## The DOM

The browser parses HTML into a tree of objects, the **Document Object Model**. JavaScript reads and changes that tree and the browser updates the screen.

```js
const title = document.querySelector("h1");            // first match
const items = document.querySelectorAll(".item");      // all matches

title.textContent = "Hello";                           // safe: plain text
title.classList.add("highlight");
title.setAttribute("data-state", "ready");

const li = document.createElement("li");
li.textContent = "New task";
document.querySelector("ul").append(li);
```

Prefer `textContent` to `innerHTML`: assigning untrusted text to `innerHTML` allows script injection (cross-site scripting).

## Events

```js
const button = document.querySelector("#add");
button.addEventListener("click", (event) => {
  event.preventDefault();      // stop a form submit or link follow
  console.log(event.target);
});
```

Events **bubble**: they travel from the target up through its ancestors. This allows **event delegation**: one listener on the list handles clicks for all current and future items.

```js
list.addEventListener("click", (event) => {
  const item = event.target.closest("[data-id]");
  if (item) remove(item.dataset.id);
});
```

## State first, then render

The most maintainable pattern, and the idea behind React, is:

1. Keep the state in plain data (`const todos = [...]`).
2. Write one `render()` that rebuilds the view from that data.
3. Event handlers change the data and call `render()`.

Never read the truth back from the DOM when you can keep it in a variable.

## Scripts and timing

Load scripts with `<script type="module" src="app.js"></script>` (deferred by default) so the DOM exists when your code runs.
