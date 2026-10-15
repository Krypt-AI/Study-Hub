---
{
  "id": "fs-02-css.l03",
  "title": "Responsive design, custom properties and good habits",
  "summary": "Mobile-first media queries, fluid sizes, CSS variables and the organisation habits that keep stylesheets maintainable.",
  "objectives": [
    "Write mobile-first media queries",
    "Use custom properties for design tokens and theming",
    "Organise CSS so it stays easy to change"
  ],
  "estimatedMinutes": 40,
  "topics": [
    "fs-02-css.responsive-design"
  ],
  "resources": [
    {
      "title": "Responsive design (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_design",
      "free": true,
      "official": true
    },
    {
      "title": "Custom properties (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties",
      "free": true,
      "official": true
    }
  ]
}
---

## Mobile first

Write the small-screen styles as the default, then add rules as the screen grows:

```css
.layout { display: grid; gap: 1rem; }

@media (min-width: 48rem) {
  .layout { grid-template-columns: 1fr 2fr; }
}
```

Make sure the page has `<meta name="viewport" content="width=device-width, initial-scale=1">`, or phones will pretend to be wide desktops.

## Fluid values

```css
img { max-width: 100%; height: auto; }
h1  { font-size: clamp(1.75rem, 4vw, 3rem); } /* min, preferred, max */
.container { width: min(100% - 2rem, 70rem); margin-inline: auto; }
```

## Custom properties

```css
:root {
  --brand: #1a4fd6;
  --space: 1rem;
  --radius: 0.5rem;
}
.button { background: var(--brand); padding: var(--space); border-radius: var(--radius); }

@media (prefers-color-scheme: dark) {
  :root { --bg: #111; --text: #eee; }
}
```

Custom properties cascade and can be changed at run time, so one class can re-theme a whole subtree.

## Habits

- Style with **classes**; keep specificity flat.
- Name by purpose (`.card`, `.button--primary`) not appearance (`.red-box`).
- Reset once (`box-sizing`, margins) and build up.
- Respect user preferences: `prefers-reduced-motion`, `prefers-color-scheme`, user font size (use `rem`).
- Test by resizing the window and with keyboard-only navigation.
