---
{
  "id": "fs-01-web-foundations.l03",
  "title": "Forms, validation and accessibility",
  "summary": "Collecting input with labelled controls, built-in validation, and the habits that make a page usable for everyone.",
  "objectives": [
    "Build a form with labelled inputs and the right input types",
    "Use built-in validation attributes",
    "Apply the core accessibility habits: labels, keyboard use, contrast, focus"
  ],
  "estimatedMinutes": 45,
  "topics": [
    "fs-01-web-foundations.forms-and-accessibility"
  ],
  "resources": [
    {
      "title": "HTML forms (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/Learn_web_development/Core/Structuring_content/Forms",
      "free": true,
      "official": true
    },
    {
      "title": "WCAG quick reference",
      "url": "https://www.w3.org/WAI/WCAG22/quickref/",
      "free": true,
      "official": true
    }
  ]
}
---

## A form

```html
<form action="/signup" method="post">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required autocomplete="email" />

  <label for="age">Age</label>
  <input id="age" name="age" type="number" min="13" max="120" />

  <fieldset>
    <legend>Plan</legend>
    <label><input type="radio" name="plan" value="free" checked /> Free</label>
    <label><input type="radio" name="plan" value="pro" /> Pro</label>
  </fieldset>

  <label for="bio">About you</label>
  <textarea id="bio" name="bio" rows="4"></textarea>

  <button type="submit">Create account</button>
</form>
```

- `name` is the key the server receives; without it the field is not submitted.
- `method="get"` puts values in the URL (searches, filters); `method="post"` sends them in the body (anything that changes data or is private).
- `<label for>` connects the text to the control: clicking the label focuses the input and a screen reader announces it.

## Input types and validation

`text`, `email`, `password`, `number`, `date`, `url`, `tel`, `checkbox`, `radio`, `file`, `range`, `hidden`. The type gives the right mobile keyboard and free validation.

Validation attributes: `required`, `minlength`, `maxlength`, `min`, `max`, `pattern="[A-Z]{3}"`. Browser validation is a **convenience**; the server must validate again because anyone can send a request without your form.

## Accessibility habits

1. **Use real elements.** A `<button>` is focusable, activates with Enter and Space and is announced as a button. A clickable `<div>` is none of these.
2. **Label every control** and every icon-only button (`aria-label="Close"`).
3. **Keyboard**: everything must work with Tab, Shift+Tab, Enter and Space, and the focus indicator must stay visible.
4. **Contrast**: normal text needs at least 4.5 : 1 against its background.
5. **Do not rely on colour alone** to show errors or status.
6. **ARIA is a last resort**: the first rule of ARIA is to use a native element instead.
