---
{
  "id": "fs-02-css.l02",
  "title": "Layout with Flexbox and Grid",
  "summary": "One-dimensional layout with Flexbox and two-dimensional layout with Grid, and when to use each.",
  "objectives": [
    "Lay out a row or column of items with Flexbox",
    "Build a responsive grid with Grid and fr units",
    "Choose between Flexbox and Grid"
  ],
  "estimatedMinutes": 45,
  "topics": [
    "fs-02-css.flexbox-and-grid"
  ],
  "resources": [
    {
      "title": "Flexbox (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout",
      "free": true,
      "official": true
    },
    {
      "title": "Grid (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout",
      "free": true,
      "official": true
    }
  ]
}
---

## Flexbox: one dimension

```css
.toolbar {
  display: flex;
  gap: 0.75rem;
  align-items: center;          /* cross axis */
  justify-content: space-between; /* main axis */
}
.toolbar .grow { flex: 1; }     /* take the leftover space */
```

- The **main axis** follows `flex-direction` (row by default); the **cross axis** is perpendicular.
- `flex: 1` is shorthand for growing and shrinking to share free space.
- `flex-wrap: wrap` lets items flow onto new lines.

Use Flexbox for **components**: navigation bars, button groups, centring a single item.

## Grid: two dimensions

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
  gap: 1rem;
}
.page {
  display: grid;
  grid-template-columns: 16rem 1fr;
  grid-template-areas:
    "side main";
}
```

- `fr` divides the free space; `minmax(12rem, 1fr)` with `auto-fill` makes a responsive grid with **no media queries**.
- Items can span with `grid-column: span 2`.

Use Grid for **page layout** and anything with rows and columns together.

## Centring

```css
.center { display: grid; place-items: center; }
```

## Which one?

If you are laying out content **in a line** and letting content size things, use Flexbox. If you are defining a **layout** and placing content into it, use Grid. They nest freely: a grid of cards where each card is a flex column.
