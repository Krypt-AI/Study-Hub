# Study Hub design system: "Answer Sheet"

Every study session is a sitting at an exam mark sheet. The sheet's printed structure is dropout-ink salmon; the learner's marks are pencil fill; grading comes in check, cross and slip inks. Progress is always shown as filled bubbles.

Recorded from the shipped code (`src/styles/global.css`, `src/components/ui/`) on 2026-10-11.

## Principles

1. **Fill, then mark.** A bubble fills when you answer and gets its mark (check, cross, dashed check for "almost") when it is graded. This is the only signature motion; it is skipped under reduced motion.
2. **Printed structure, pencil content.** Headers, rules, numbers and empty bubbles are print ink; anything the learner did is ink or mark colour.
3. **Low glare at night.** The default night theme is graphite, never pure black or pure white.
4. **Ruled rows, not card grids.** Lists are rows on a sheet, like an answer sheet. Browse pages start with an index of areas (large ruled rows, like a test booklet's contents page) and open one area at a time, so nobody scrolls past what they don't study.
5. **Honest labels.** Provenance, "editor only", estimates and unverified facts are always visible.
6. **Bubbles mean progress.** Bubbles appear only where they record answers, lessons, goals or a tracked plan; navigation and decoration never use them, and lists never repeat a symbol on every row.
7. **The task first.** What a learner came to do (the chapters, the questions, the switches) starts on the first screen. Long descriptions are cut to three lines with "More about this course", empty states are one or two short sentences (or the section is left out when another page covers it), and reference material sits behind closed `<details>` rows.

## Colour tokens

Defined as CSS variables on `:root` (day) and `[data-theme="dark"]` (night), exposed to Tailwind through `@theme inline` (`bg-sheet`, `text-print`, …).

| Token | Night | Day | Use |
|---|---|---|---|
| `ground` | #15171b | #f0eee9 | page background (the desk) |
| `rail` | #111316 | #e7e3dc | navigation rail |
| `sheet` / `sheet-2` | #1d2025 / #24272d | #fbfaf8 / #f3f1ec | panels; hover and inset areas |
| `rule` / `rule-strong` | #2d3138 / #3c414a | #ddd8cf / #c9c3b8 | hairlines; control borders |
| `ink` / `ink-muted` / `ink-faint` | #ece6db / #b4aea4 / #918c84 | #26282d / #565961 / #6c6f77 | text levels |
| `print` / `print-strong` | #e07a68 / #f0917f | #b84e38 / #9e3f2b | printed structure, primary actions, links |
| `print-soft` / `print-line` | 11% / 50% print | 9% / 45% print | selected fills; header rules, empty bubbles |
| `mark` | #ece6db | #26282d | pencil fill in bubbles |
| `correct` / `wrong` / `slip` | #67bd88 / #f06c69 / #e3b052 | #2c7f4d / #c03a35 / #95620a | grading inks (each with a `-soft` fill) |

Printing always uses the day palette on white.

## Type

- **Text**: Public Sans Variable, 16 px base.
- **Display**: Barlow Semi Condensed 500–700 for headings, sheet titles and numerals (`.display-numerals`, tabular figures).
- **Code**: JetBrains Mono Variable.
- **CJK**: `:lang(zh)` and `:lang(ja)` select system CJK fonts; content in Chinese or Japanese always carries a `lang` attribute.

## Components (`src/components/ui`)

- **Bubble / BubbleStrip**: ellipse 22×15 (sm 16×11, lg 30×20). States: empty, current (thicker print stroke), filled, correct, almost, wrong, review (inner ring), and mastery levels new (dashed), learning (half fill), weak (red stroke), mastered (filled).
- **Sheet**: rounded 6 px panel, `rule` border, optional header band with a `print-line` underline. **PageHeader**: page title (28–32 px), lead, actions.
- **Button**: primary (print fill), secondary (bordered sheet), ghost, danger; sizes sm 32 px, md 36 px, lg 44 px. **IconButton**: 32 px, always labelled.
- **Field / Input / Select / Textarea**: write-in boxes, print focus ring. **Tabs** (underlined in print), **Segmented** (small exclusive toggles), **Tag** (neutral, print, correct, wrong, slip), **Dialog** (native `<dialog>`), **Toast**.
- **Feedback**: loading, empty (dashed border) and error states.
- **AreaIndex / AreaBack**: the first step of Courses and Certifications: one ruled row per area with its name in the display face (26 px), a one-line description, a count and a chevron (two columns from `lg` when there are many); `AreaBack` returns from an opened area.
- **Switch**: an on/off control with a visible label and description (or only its accessible name, in lists).

## Layout

- Rail 15 rem on large screens; a drawer below 1024 px. Its items are icon and label only (40 px tall); the current page is a raised sheet in semibold. Playground is listed only for learners of a course with code exercises. Content max width 64–96 rem depending on the page; 16–40 px gutters.
- Two-column pages (main + side sheets) collapse to one column below `xl`.
- The lesson page is a single reading column (max 56 rem).
- The calendar week view gives each weekday a column from `lg` (weekends only when something is on them) and stacks the days below it; the month grid keeps seven columns and shows dots instead of titles below `sm`.

## Motion

Only the bubble fill (170 ms scale-in) and its mark (200 ms, starting 110 ms later) animate, both on an expo-out curve. Everything else changes instantly or with 150 ms colour transitions. `prefers-reduced-motion` removes the animations.

## Accessibility

WCAG AA contrast for text in both themes; visible focus rings; every control reachable by keyboard (1–9 picks options, Ctrl+Enter runs or checks, Ctrl+K searches); answer strips and mark rows use radio/button semantics with labels; timers announce only at five and one minutes.
