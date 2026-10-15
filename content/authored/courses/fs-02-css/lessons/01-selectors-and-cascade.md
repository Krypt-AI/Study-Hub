---
{
  "id": "fs-02-css.l01",
  "title": "Selectors, the cascade and the box model",
  "summary": "How CSS chooses which rules win, and how every element becomes a box with content, padding, border and margin.",
  "objectives": [
    "Write type, class, id, attribute and combinator selectors",
    "Predict which declaration wins using specificity and order",
    "Size boxes with box-sizing, padding, border and margin"
  ],
  "estimatedMinutes": 40,
  "topics": [
    "fs-02-css.selectors-and-cascade"
  ],
  "resources": [
    {
      "title": "CSS selectors (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors",
      "free": true,
      "official": true
    },
    {
      "title": "The box model (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model",
      "free": true,
      "official": true
    }
  ]
}
---

## Anatomy of a rule

```css
.card > h2 {          /* selector */
  color: #1a4fd6;     /* property: value */
  margin-block: 0 0.5rem;
}
```

## Selectors

| Selector | Matches |
|---|---|
| `p` | every `<p>` (type) |
| `.card` | elements with `class="card"` |
| `#main` | the element with `id="main"` (ids must be unique) |
| `a[target="_blank"]` | elements with that attribute value |
| `nav a` | any `a` inside a `nav` (descendant) |
| `ul > li` | `li` that are direct children of `ul` |
| `h2 + p` | the `p` immediately after an `h2` |
| `a:hover`, `li:nth-child(2)` | pseudo-classes: state or position |
| `p::first-line` | pseudo-elements: part of an element |

## The cascade

When several rules set the same property on one element, the browser chooses by:

1. **Importance**: `!important` beats normal declarations (avoid it).
2. **Specificity**: id (1,0,0) beats class/attribute/pseudo-class (0,1,0) beats type (0,0,1).
3. **Order**: when specificity ties, the **later** rule wins.

Some properties are **inherited** (`color`, `font-family`, `line-height`); others (`margin`, `border`, `background`) are not.

Keep specificity low: style with classes, avoid ids and `!important`, and the cascade stays predictable.

## The box model

Every element is a rectangle made of **content**, **padding**, **border** and **margin**, from the inside out.

```css
*, *::before, *::after { box-sizing: border-box; }
.panel { width: 20rem; padding: 1rem; border: 1px solid #ccc; margin: 1rem auto; }
```

With `box-sizing: border-box`, `width` includes padding and border, so the panel above is exactly `20rem` wide. With the default `content-box` it would be `20rem` plus padding and border.

Vertical margins of adjacent blocks **collapse** into the larger of the two. Units: `px` is absolute; `rem` scales with the root font size (best for type and spacing); `%` and `vw` are relative to containers and the viewport.
