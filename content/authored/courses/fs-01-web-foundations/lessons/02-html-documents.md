---
{
  "id": "fs-01-web-foundations.l02",
  "title": "HTML documents and semantic elements",
  "summary": "The skeleton of a page, text, links, images, lists, tables and the semantic elements that give a page meaning.",
  "objectives": [
    "Write a valid HTML5 document skeleton",
    "Choose semantic elements over generic div and span",
    "Add links, images with alt text, lists and tables correctly"
  ],
  "estimatedMinutes": 45,
  "topics": [
    "fs-01-web-foundations.html-documents"
  ],
  "resources": [
    {
      "title": "HTML elements reference (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements",
      "free": true,
      "official": true
    },
    {
      "title": "Semantic HTML (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/HTML",
      "free": true,
      "official": true
    }
  ]
}
---

## The skeleton

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Study Hub</title>
  </head>
  <body>
    <h1>Hello</h1>
  </body>
</html>
```

- `<!doctype html>` puts the browser in standards mode.
- `lang` helps screen readers pick a pronunciation and browsers offer translation.
- `<head>` holds information about the page; only the `<body>` is displayed.
- The `viewport` meta tag makes the page usable on phones.

## Elements and attributes

An element is an opening tag, content and a closing tag: `<p class="lead">Text</p>`. `class="lead"` is an **attribute**. **Void** elements such as `<img>`, `<br>` and `<input>` have no content and no closing tag.

## Text, links and images

```html
<h1>Main heading</h1>   <!-- one per page -->
<h2>Section</h2>
<p>A paragraph with <strong>important</strong> and <em>emphasised</em> words.</p>
<a href="/courses">All courses</a>
<a href="https://example.com" target="_blank" rel="noopener">External</a>
<img src="logo.png" alt="Study Hub logo" width="120" height="40" />
```

Every `img` needs an `alt`: it is read by screen readers and shown if the image fails. A purely decorative image gets `alt=""`.

## Lists and tables

```html
<ul><li>unordered</li><li>list</li></ul>
<ol><li>first</li><li>second</li></ol>

<table>
  <thead><tr><th scope="col">Method</th><th scope="col">Use</th></tr></thead>
  <tbody><tr><td>GET</td><td>Read</td></tr></tbody>
</table>
```

Tables are for tabular data, never for page layout.

## Semantic structure

Prefer elements that say what the content *is*:

`<header>`, `<nav>`, `<main>` (one per page), `<article>`, `<section>`, `<aside>`, `<footer>`.

`<div>` and `<span>` have no meaning; use them only when no semantic element fits. Semantics help search engines, screen readers and keyboard users, and they make your CSS easier to read.
